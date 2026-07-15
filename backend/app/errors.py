"""Domain errors and global exception handlers."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import ORJSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.logging import logger


class AppError(Exception):
    """Base class for known application errors."""

    status_code: int = 500
    code: str = "internal_error"
    message: str = "Something went wrong."

    def __init__(self, message: str | None = None, *, code: str | None = None) -> None:
        super().__init__(message or self.message)
        if message:
            self.message = message
        if code:
            self.code = code


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"
    message = "Resource not found."


class ConflictError(AppError):
    status_code = 409
    code = "conflict"
    message = "Resource already exists."


class ValidationFailed(AppError):
    status_code = 422
    code = "validation_failed"
    message = "Validation failed."


class AuthError(AppError):
    status_code = 401
    code = "unauthorized"
    message = "Invalid credentials."


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"
    message = "Forbidden."


def _payload(code: str, message: str, *, details: Any = None) -> dict[str, Any]:
    body: dict[str, Any] = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return body


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError) -> ORJSONResponse:
        details: Any = None
        # Surface DuplicateUpload's existing key/url to the client so the UI can
        # offer "upload as (1) instead" without a follow-up round trip.
        if exc.code == "duplicate_upload":
            details = {
                "existing_key": getattr(exc, "existing_key", None),
                "existing_url": getattr(exc, "existing_url", None),
            }
        if exc.status_code >= 500:
            logger.error("app_error", code=exc.code, message=exc.message, path=request.url.path)
        # 4xx codes are visible in the access log (one line includes status + path);
        # don't double-log here. The response body still carries `code` for clients.
        return ORJSONResponse(
            status_code=exc.status_code,
            content=_payload(exc.code, exc.message, details=details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> ORJSONResponse:
        code = {
            401: "unauthorized",
            403: "forbidden",
            404: "not_found",
            405: "method_not_allowed",
            429: "rate_limited",
        }.get(exc.status_code, "http_error")
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
        return ORJSONResponse(status_code=exc.status_code, content=_payload(code, detail))

    @app.exception_handler(RequestValidationError)
    async def _validation_error(request: Request, exc: RequestValidationError) -> ORJSONResponse:
        errors = exc.errors()
        # Surface which fields failed without dumping the entire raw payload.
        fields = sorted({".".join(str(p) for p in e.get("loc", []) if p != "body") for e in errors})
        logger.info(
            "validation_failed",
            path=request.url.path,
            method=request.method,
            fields=fields,
            error_count=len(errors),
        )
        # Redact the raw `input` values before returning them to the client.
        # Drop `ctx` too: custom field_validators put the raw exception object
        # in there, which is not JSON serializable (the message is in `msg`).
        safe_errors = []
        for e in errors:
            safe = {k: v for k, v in e.items() if k not in ("input", "ctx")}
            safe_errors.append(safe)
        return ORJSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_payload(
                "validation_failed",
                "Request data is invalid.",
                details={"fields": fields, "errors": safe_errors},
            ),
        )

    @app.exception_handler(IntegrityError)
    async def _integrity_error(request: Request, exc: IntegrityError) -> ORJSONResponse:
        logger.warning("integrity_error", path=request.url.path, error=str(exc.orig))
        return ORJSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=_payload("conflict", "Resource conflict (duplicate or constraint)."),
        )

    @app.exception_handler(SQLAlchemyError)
    async def _db_error(request: Request, exc: SQLAlchemyError) -> ORJSONResponse:
        logger.exception("database_error", path=request.url.path, error=str(exc))
        return ORJSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=_payload("database_unavailable", "Database error."),
        )

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception) -> ORJSONResponse:
        logger.exception(
            "unhandled_exception",
            path=request.url.path,
            method=request.method,
            error=str(exc),
        )
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_payload("internal_error", "Unexpected server error."),
        )
