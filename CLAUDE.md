# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # start with nodemon (auto-reload)
npm start      # start without auto-reload
```

No test runner or linter is configured.

## Environment variables

Required in `.env`:

| Variable | Purpose |
|---|---|
| `WHOOP_CLIENT_ID` | WHOOP OAuth client ID |
| `WHOOP_CLIENT_SECRET` | WHOOP OAuth client secret (also used to validate webhook HMAC signatures) |
| `WHOOP_REDIRECT_URI` | Must match the redirect URI registered in the WHOOP developer portal |
| `DATABASE_URL` | Neon Postgres connection string |

## Architecture

**Single-user personal dashboard.** The app connects one WHOOP account via OAuth 2.0, persists exactly one token row in Postgres, and serves a fullscreen dark-theme dashboard at `/`.

### Request flow

```
Browser → Express (server.js)
           └── /whoop/* → routers/whoop.js
                           ├── controllers/whoop.js    (OAuth + per-resource proxy)
                           ├── controllers/dashboard.js (aggregated today's data)
                           └── controllers/webhook.js   (HMAC-validated event receiver)
```

All WHOOP API calls go through `utils/whoopClient.js → whoopGet()`, which calls `getValidToken()` before every request. `getValidToken()` automatically refreshes an expired access token using the stored refresh token and updates the DB row in place.

### Token storage

`models/WhoopToken.js` is a Sequelize model backed by Neon Postgres. There is always at most one row — `callback` runs `WhoopToken.destroy({ where: {} })` before creating a new one. The model is synced at startup via `db.sync()` in `server.js`.

### Dashboard data (`/whoop/dashboard/data`)

`controllers/dashboard.js` fetches all of today's data live on every request (no caching). It uses a local `fetchAll` paginator that follows `next_token` cursors. All six WHOOP endpoints are fetched in parallel via `Promise.all`. The UI at `public/index.html` polls this endpoint every 5 minutes.

### Webhook

`controllers/webhook.js` validates `x-whoop-signature` (HMAC-SHA256 over `timestamp + rawBody` using `WHOOP_CLIENT_SECRET`). Raw body accumulation happens in a middleware in `server.js` before `express.json()`.

### Deployment

Hosted on Vercel as a single serverless function (`vercel.json` routes all traffic to `server.js`). The `@vercel/node` builder with `bundle: false` is used.
