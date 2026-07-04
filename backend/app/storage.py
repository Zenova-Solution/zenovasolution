"""Cloudflare R2 (S3-compatible) object storage for image uploads.

Uploads preserve the user's filename:

* ``logo.png`` → ``projects/logo.png``
* uploading ``logo.png`` again is a 409 ``duplicate_upload`` by default
* with ``force=True`` it becomes ``projects/logo (1).png``, ``logo (2).png``, …

That keeps storage human-readable while still letting editors save multiple
versions when they explicitly want to.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from typing import BinaryIO

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config import get_settings
from app.errors import AppError
from app.logging import logger

_ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/svg+xml": ".svg",
}

_ALLOWED_VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
    "video/quicktime": ".mov",
}

_ALLOWED_TYPES = {**_ALLOWED_IMAGE_TYPES, **_ALLOWED_VIDEO_TYPES}

# Anything outside this set is collapsed to '-' in the stored filename.
_SAFE_NAME = re.compile(r"[^a-zA-Z0-9._\- ()]+")
_DUPLICATE_SUFFIX = re.compile(r"^(.*?)(?:\s*\((\d+)\))?$")
_MAX_DUPLICATE_TRIES = 999


@dataclass(slots=True)
class StoredObject:
    """A single object as returned by the R2 list endpoint."""

    key: str
    name: str  # basename of the key, e.g. "logo.png" or "logo (1).png"
    size: int
    content_type: str
    uploaded_at: datetime | None
    url: str


class StorageDisabled(AppError):
    status_code = 503
    code = "storage_disabled"
    message = "Object storage is not configured."


class UploadTooLarge(AppError):
    status_code = 413
    code = "upload_too_large"
    message = "File exceeds the configured size limit."


class UnsupportedMedia(AppError):
    status_code = 415
    code = "unsupported_media"
    message = "Only common image and video types are accepted."


class DuplicateUpload(AppError):
    """Raised when an upload would overwrite an existing key without ``force``."""

    status_code = 409
    code = "duplicate_upload"
    message = "An image with this name already exists."

    def __init__(self, *, key: str, url: str) -> None:
        super().__init__(self.message)
        self.existing_key = key
        self.existing_url = url


@lru_cache(maxsize=1)
def _s3_client():  # type: ignore[no-untyped-def]
    settings = get_settings()
    if not settings.uploads_enabled:
        raise StorageDisabled()
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4", retries={"max_attempts": 3, "mode": "standard"}),
        region_name="auto",
    )


def _safe_stem(name: str) -> str:
    base = _SAFE_NAME.sub("-", name).strip("-._ ")
    base = re.sub(r"\s+", " ", base)
    return (base or "file")[:120]


def _public_url(key: str) -> str:
    settings = get_settings()
    return f"{settings.r2_public_base.rstrip('/')}/{key}"


def _split_filename(filename: str) -> tuple[str, str | None]:
    """Return ``(stem, ext)`` where ``ext`` is ``None`` if the file has no dot."""
    if "." in filename:
        stem, _, ext = filename.rpartition(".")
        return stem, ext.lower()
    return filename, None


def _object_exists(key: str) -> bool:
    settings = get_settings()
    client = _s3_client()
    try:
        client.head_object(Bucket=settings.r2_bucket, Key=key)
        return True
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        if code in {"404", "NoSuchKey", "NotFound"}:
            return False
        raise


def _next_unique_key(prefix: str, stem: str, ext: str) -> str:
    """Return ``prefix/stem (N).ext`` where ``N`` is the smallest free index."""
    # Strip any pre-existing ``(N)`` from the stem so re-uploading "logo (1).png"
    # produces "logo (2).png" rather than "logo (1) (1).png".
    match = _DUPLICATE_SUFFIX.match(stem)
    base = (match.group(1) if match else stem).rstrip()
    start = int(match.group(2)) + 1 if match and match.group(2) else 1
    for n in range(start, start + _MAX_DUPLICATE_TRIES):
        candidate = f"{prefix}/{base} ({n}).{ext}"
        if not _object_exists(candidate):
            return candidate
    raise UploadTooLarge("Too many duplicates of this filename.")


def upload_image(
    *,
    stream: BinaryIO,
    filename: str,
    content_type: str,
    size: int,
    prefix: str = "projects",
    force: bool = False,
) -> tuple[str, str, bool]:
    """Upload an image and return ``(public_url, object_key, was_renamed)``.

    Raises :class:`DuplicateUpload` if an object with the same filename already
    exists and ``force`` is ``False``.
    """
    settings = get_settings()
    if not settings.uploads_enabled:
        raise StorageDisabled()
    if content_type not in _ALLOWED_TYPES:
        raise UnsupportedMedia(f"Unsupported content type: {content_type}")
    limit_bytes = settings.r2_max_upload_mb * 1024 * 1024
    if size > limit_bytes:
        raise UploadTooLarge(
            f"File is {size} bytes; limit is {settings.r2_max_upload_mb} MiB."
        )

    canonical_ext = _ALLOWED_TYPES[content_type].lstrip(".")
    raw_stem, _raw_ext = _split_filename(filename)
    stem = _safe_stem(raw_stem)
    clean_prefix = prefix.strip("/") or "uploads"
    desired_key = f"{clean_prefix}/{stem}.{canonical_ext}"

    was_renamed = False
    final_key = desired_key
    if _object_exists(desired_key):
        if not force:
            raise DuplicateUpload(key=desired_key, url=_public_url(desired_key))
        final_key = _next_unique_key(clean_prefix, stem, canonical_ext)
        was_renamed = True

    client = _s3_client()
    client.upload_fileobj(
        Fileobj=stream,
        Bucket=settings.r2_bucket,
        Key=final_key,
        ExtraArgs={
            "ContentType": content_type,
            "CacheControl": "public, max-age=31536000, immutable",
        },
    )

    logger.info(
        "r2_upload",
        key=final_key,
        original_name=filename,
        size=size,
        content_type=content_type,
        renamed=was_renamed,
    )
    return _public_url(final_key), final_key, was_renamed


def delete_object(key: str) -> None:
    settings = get_settings()
    if not settings.uploads_enabled:
        raise StorageDisabled()
    client = _s3_client()
    client.delete_object(Bucket=settings.r2_bucket, Key=key)
    logger.info("r2_delete", key=key)


def list_objects(prefix: str | None = None, limit: int = 1000) -> list[StoredObject]:
    """List images currently in the bucket, optionally scoped to a prefix."""
    settings = get_settings()
    if not settings.uploads_enabled:
        raise StorageDisabled()
    client = _s3_client()

    pfx = (prefix or "").strip("/")
    pfx = f"{pfx}/" if pfx else ""

    out: list[StoredObject] = []
    token: str | None = None
    fetched = 0
    while True:
        kwargs: dict[str, object] = {"Bucket": settings.r2_bucket, "MaxKeys": 1000}
        if pfx:
            kwargs["Prefix"] = pfx
        if token:
            kwargs["ContinuationToken"] = token
        resp = client.list_objects_v2(**kwargs)
        for item in resp.get("Contents", []) or []:
            key = item["Key"]
            # Skip pseudo-folders.
            if key.endswith("/"):
                continue
            ext = key.rsplit(".", 1)[-1].lower() if "." in key else ""
            content_type = next(
                (ct for ct, e in _ALLOWED_TYPES.items() if e.lstrip(".") == ext),
                "application/octet-stream",
            )
            out.append(
                StoredObject(
                    key=key,
                    name=key.rsplit("/", 1)[-1],
                    size=int(item.get("Size", 0)),
                    content_type=content_type,
                    uploaded_at=item.get("LastModified"),
                    url=_public_url(key),
                )
            )
            fetched += 1
            if fetched >= limit:
                break
        if fetched >= limit or not resp.get("IsTruncated"):
            break
        token = resp.get("NextContinuationToken")
        if not token:
            break

    out.sort(key=lambda o: o.uploaded_at or datetime.min, reverse=True)
    return out


def object_exists(key: str) -> bool:
    """Public wrapper used by the router for explicit existence checks."""
    settings = get_settings()
    if not settings.uploads_enabled:
        raise StorageDisabled()
    return _object_exists(key)
