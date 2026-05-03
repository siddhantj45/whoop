# Whoop Dashboard (`whoop-api`)

## Overview

A **Node.js / Express** backend that integrates with the **WHOOP Developer API** via OAuth 2.0. It handles OAuth authorization, persists tokens to a local JSON file (no database), proxies WHOOP API endpoints, and serves a live dashboard UI showing today's recovery, sleep, HRV, and body metrics.

**Package name:** `whoop-api`  
**Version:** 1.0.0  
**Entry point:** `server.js`

---

## Tech stack

| Layer        | Choice                              |
|-------------|--------------------------------------|
| Runtime     | Node.js (CommonJS `require`)         |
| HTTP server | Express 4                            |
| HTTP client | Axios                                |
| Config      | dotenv (`.env` loaded at startup)    |
| Token store | `token.json` (local file via `utils/tokenStore.js`) |
| Dev reload  | nodemon (used by `npm start`)        |

---

## Project structure

```
Whoop/
├── server.js                   # Express app entry point
├── package.json
├── token.json                  # OAuth token file (auto-created; gitignore this)
├── controllers/
│   ├── whoop.js                # OAuth + WHOOP API proxy handlers
│   ├── dashboard.js            # Dashboard data endpoint (live API fetch)
│   └── webhook.js              # WHOOP webhook receiver (signature validation)
├── routers/
│   └── whoop.js                # All routes under /whoop
├── utils/
│   ├── whoopClient.js          # whoopGet() + token refresh logic
│   └── tokenStore.js           # Read/write token.json
└── public/
    ├── index.html              # Dashboard UI
    └── style.css               # Dashboard styles
```

---

## Configuration

`.env` file in project root:

| Variable              | Required | Purpose |
|-----------------------|----------|---------|
| `WHOOP_CLIENT_ID`     | Yes      | WHOOP OAuth client ID |
| `WHOOP_CLIENT_SECRET` | Yes      | WHOOP OAuth client secret (also used to verify webhook signatures) |
| `WHOOP_REDIRECT_URI`  | Yes      | Must match the redirect URI registered in the WHOOP developer portal |
| `PORT`                | No       | HTTP port (default **3333**) |

---

## Token storage (`utils/tokenStore.js`)

Tokens are persisted to `token.json` in the project root — no database required. The file is read/written synchronously via `fs`. Add `token.json` to `.gitignore`.

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresAt": "2026-05-03T12:00:00.000Z",
  "scope": "offline read:recovery ..."
}
```

---

## HTTP API

All routes are prefixed with **`/whoop`**.

| Method | Path                  | Description |
|--------|-----------------------|-------------|
| GET    | `/whoop/connect`      | Redirects browser to WHOOP OAuth authorization page |
| GET    | `/whoop/auth-url`     | Returns OAuth URL as JSON `{ url }` |
| GET    | `/whoop/callback`     | OAuth redirect handler — exchanges code for tokens, writes `token.json` |
| GET    | `/whoop/status`       | Returns `{ connected, expired, expiresAt, scope }` from `token.json` |
| GET    | `/whoop/profile`      | Proxies `GET /v2/user/profile/basic` |
| GET    | `/whoop/recovery`     | Proxies `GET /v2/recovery` (query params forwarded) |
| GET    | `/whoop/cycles`       | Proxies `GET /v2/cycle` (query params forwarded) |
| GET    | `/whoop/sleep`        | Proxies `GET /v2/activity/sleep` (query params forwarded) |
| GET    | `/whoop/workouts`     | Proxies `GET /v2/activity/workout` (query params forwarded) |
| GET    | `/whoop/body`         | Proxies `GET /v2/user/measurement/body` |
| POST   | `/whoop/webhook`      | Receives WHOOP webhook events (validates HMAC signature) |
| GET    | `/whoop/dashboard/data` | Fetches today's data live from all WHOOP APIs and returns it in a single response |

---

## Dashboard (`/whoop/dashboard/data`)

`controllers/dashboard.js` fetches **today's data live** from the WHOOP API on every request — no database reads or writes. It uses a local `fetchAll` paginator to collect all records from `today 00:00:00` onwards.

### Response shape

```json
{
  "profile": { "first_name": "...", "last_name": "..." },
  "body": { "height_meter": 1.80, "weight_kilogram": 74.5, "max_heart_rate": 187 },
  "latest": { "date", "score", "hrv", "rhr", "spo2" },
  "recoveries": [{ "date", "score", "hrv", "rhr", "spo2" }],
  "sleeps": [{ "date", "durationHours", "performance", "efficiency", "rem", "deepSleep", "light", "respiratoryRate" }],
  "workouts": [{ "date", "sport", "strain", "avgHr", "maxHr", "kj", "distanceM" }],
  "cycles": [{ "date", "strain", "avgHr", "kj" }]
}
```

- `latest` is the last recovery record for today (used to drive the ring UI)
- `sleeps` filters out naps (`nap: false`)
- `body` comes from `GET /v2/user/measurement/body`

---

## Dashboard UI (`public/index.html`)

A fullscreen dark-theme single-page dashboard served as a static file. Styles live in `public/style.css`.

- **Top bar:** live clock, date, connection status dot, user name
- **Left panel:** recovery score ring (color-coded green/yellow/red)
- **Right panel:** HRV, resting HR, SpO₂ metric cards
- **Bottom bar:** height, weight, max HR (body measurements)

Fetches `/whoop/dashboard/data` on load and refreshes every **5 minutes**.

---

## Token flow (`utils/whoopClient.js`)

1. `getValidToken()` reads `token.json`
2. If missing → throws (visit `/whoop/connect`)
3. If `now < expiresAt` → returns `accessToken`
4. If expired and `refreshToken` exists → calls WHOOP token endpoint with `grant_type=refresh_token`, writes updated token to `token.json`
5. If expired and no refresh token → throws (re-authorize)

---

## Webhook (`controllers/webhook.js`)

Validates WHOOP webhook signature using HMAC-SHA256 against `WHOOP_CLIENT_SECRET`. Logs the event type and ID, then acknowledges with `200`. No data is stored.

---

## How to run

```bash
npm install
# Create .env with WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_REDIRECT_URI
npm start        # nodemon server.js (auto-reload)
# or
npm run dev      # node server.js
```

**Typical flow**

1. Register an OAuth app in the WHOOP developer portal; set redirect URI to match `WHOOP_REDIRECT_URI`
2. Open `http://localhost:3333/whoop/connect` in a browser
3. Approve access — WHOOP redirects to `/whoop/callback` which writes `token.json`
4. Open `http://localhost:3333` to view the live dashboard
5. Call individual resource routes as needed (e.g. `/whoop/recovery`)

---

## Dependencies

| Package    | Purpose |
|------------|---------|
| `axios`    | HTTP client for OAuth and WHOOP API calls |
| `dotenv`   | `.env` loading |
| `express`  | Web server and routing |
| `nodemon`  | Dev auto-reload |
| `sequelize` / `sqlite3` | Listed in `package.json` but no longer used — safe to remove |
