# ringdash-ui

React + Vite frontend for the [ringdash](https://github.com/Marketing-Bull/ringdash) call-analytics dashboard.

## Setup

```bash
cp .env.example .env.local   # then fill in VITE_API_BASE_URL
npm install
npm run dev
```

> **CORS requirement** — `VITE_API_BASE_URL` must point to a ringdash instance that includes this UI's origin in its `CORS_ORIGINS` env var. The two values must agree or the browser will block every request.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the ringdash API (e.g. `https://ringdash.example.com` or `http://localhost:8899`) |

## API surface consumed

All requests use `Authorization: Bearer <token>` except `POST /api/auth/token`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/token` | Login — body is `application/x-www-form-urlencoded` with `username` and `password`; returns `{ access_token }` |
| `GET` | `/api/auth/me` | Fetch the current user |
| `GET` | `/api/analytics/` | Summary stats (total calls, avg/total duration) |
| `GET` | `/api/calls/?limit=200` | All calls, newest first |
| `GET` | `/api/calls/callbacks` | Missed calls with pending callback status |
| `PATCH` | `/api/calls/{id}/callback` | Mark a missed call as called back |

### Creating users

`POST /api/auth/register` requires an authenticated user (added in ringdash PR #2). There is no register UI. To create the first user, run on the server:

```bash
python scripts/create_user.py <username>
```

Subsequent users can be created by an already-logged-in admin hitting `POST /api/auth/register` with a Bearer token.
