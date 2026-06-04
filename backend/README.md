# Zenova Backend

FastAPI service backing the Zenova site and admin dashboard. Postgres via
Supabase, custom JWT auth, image uploads to Cloudflare R2.

## Stack

- **FastAPI** + **uvicorn**
- **SQLAlchemy 2.0** async + **asyncpg**
- **Alembic** migrations
- **Pydantic v2** validation
- **PyJWT** (HS256) for auth, **passlib[bcrypt]** for password hashing
- **boto3** against the Cloudflare R2 S3 API
- **structlog** for structured logs, **slowapi** for rate limiting

## Quick start

```bash
# 1. Create a venv and install
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -e .[dev]

# 2. Copy env and fill in DATABASE_URL + JWT_SECRET (+ R2 creds if uploading)
cp .env.example .env

# 3. Apply migrations
alembic upgrade head

# 4. Seed the default content
python -m scripts.seed

# 5. Create the first admin
python -m scripts.create_admin --email you@example.com --name "Your Name"

# 6. Run dev server
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/docs for the OpenAPI explorer.

## Configuration

All settings come from environment variables (or `.env` in development).
See `.env.example` for the full list. The non-obvious ones:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Async URL used at runtime. Supabase: use the **pooler** URI (port 6543) for serverless deploys, the **direct** URI (port 5432) for long-lived workers. Must use the `+asyncpg` driver. |
| `DATABASE_URL_SYNC` | Sync URL used only by Alembic. Same Supabase project, `+psycopg` driver. |
| `JWT_SECRET` | At least 32 chars. Generate with `python -c "import secrets; print(secrets.token_urlsafe(64))"`. |
| `CORS_ORIGINS` | Comma-separated list of frontend origins allowed to call the API. |
| `R2_*` | Cloudflare R2 bucket + S3 token. Leave blank to disable uploads — the endpoint returns 503 instead. |

## API surface

| Path | Auth | Notes |
|---|---|---|
| `GET /health` | — | Liveness probe |
| `POST /api/v1/auth/login` | — | Email + password → access/refresh JWT |
| `POST /api/v1/auth/refresh` | — | Rotate access token |
| `GET /api/v1/auth/me` | JWT | Current admin |
| `GET /api/v1/public/site` | — | All public content in one payload (services, projects, team, content, brand) |
| `GET /api/v1/public/services[/{slug}]` | — | Public service list/detail |
| `GET /api/v1/public/projects[/{slug}]` | — | Public project list/detail |
| `GET/POST/PUT/DELETE /api/v1/admin/services[/{slug}]` | JWT | CRUD |
| `GET/POST/PUT/DELETE /api/v1/admin/projects[/{slug}]` | JWT | CRUD |
| `GET/POST/PUT/DELETE /api/v1/admin/team[/{id}]` | JWT | CRUD |
| `GET/PUT /api/v1/admin/content` | JWT | Singleton site content |
| `GET/PUT /api/v1/admin/brand` | JWT | Singleton brand settings |
| `POST /api/v1/admin/uploads/image` | JWT | `multipart/form-data` → Cloudflare R2 |
| `DELETE /api/v1/admin/uploads/image?key=...` | JWT | Remove an uploaded asset |

Reorder endpoints accept `["slug-a", "slug-b", ...]` and re-rank the entries.

## Data model

- `services`, `projects`, `team_members`: `(pk, position, data: JSONB, timestamps)` — Pydantic enforces the shape inside `data` so it stays in lockstep with the frontend without schema churn.
- `site_content`, `brand_settings`: singleton rows (`id = 1`).
- `admin_users`: real columns for the auth path.

## Production deploy

- Build with the included `Dockerfile` (Python 3.12 slim, non-root user, `/health` probe).
- Run `alembic upgrade head` on deploy.
- Use the Supabase pooler URL on serverless platforms (Render, Railway, Fly).
- Set `APP_ENV=production` to disable `/docs`, `/redoc`, and switch logging to JSON.
- Set tight `CORS_ORIGINS` (your site domain only).

## Tests

```bash
pytest
```

`tests/` runs against an in-memory SQLite or a disposable Postgres — see
`tests/conftest.py` for details.
