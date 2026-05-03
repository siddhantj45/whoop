# Whoop Dashboard

A Node.js/Express app that connects to the [WHOOP Developer API](https://developer.whoop.com) via OAuth 2.0 and serves a live personal health dashboard.

**Live:** [whoop-gray.vercel.app](https://whoop-gray.vercel.app)

## Features

- OAuth 2.0 authorization with WHOOP
- Auto-refreshes access tokens on expiry
- Live dashboard showing today's recovery, sleep, HRV, resting HR, SpO₂, and workouts
- REST endpoints to query individual WHOOP data streams
- Webhook receiver with HMAC signature validation

## Tech stack

| Layer     | Choice                        |
|-----------|-------------------------------|
| Runtime   | Node.js (CommonJS)            |
| Server    | Express 4                     |
| Database  | Postgres via Neon (Sequelize) |
| Hosting   | Vercel (serverless)           |
| HTTP client | Axios                       |

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/siddhantj45/whoop.git
cd whoop
npm install
```

### 2. Create a WHOOP developer app

Register at [developer.whoop.com](https://developer.whoop.com) and set your redirect URI to `http://localhost:3333/whoop/callback`.

### 3. Configure environment variables

Create a `.env` file:

```env
WHOOP_CLIENT_ID=your_client_id
WHOOP_CLIENT_SECRET=your_client_secret
WHOOP_REDIRECT_URI=http://localhost:3333/whoop/callback
DATABASE_URL=your_postgres_connection_string
```

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3333/whoop/connect` to authorize WHOOP, then visit `http://localhost:3333` for the dashboard.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/whoop/connect` | Redirects to WHOOP OAuth authorization |
| `GET` | `/whoop/callback` | OAuth callback — exchanges code for tokens |
| `GET` | `/whoop/status` | Returns connection status and token expiry |
| `GET` | `/whoop/dashboard/data` | All today's data in one response |
| `GET` | `/whoop/profile` | Basic profile (name only, no email) |
| `GET` | `/whoop/recovery` | Recovery scores |
| `GET` | `/whoop/sleep` | Sleep records |
| `GET` | `/whoop/workouts` | Workout records |
| `GET` | `/whoop/cycles` | Cycle strain data |
| `GET` | `/whoop/body` | Body measurements |
| `POST` | `/whoop/webhook` | WHOOP webhook receiver |

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables: `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI`, `DATABASE_URL`
4. Deploy, then update your WHOOP app's redirect URI to `https://<your-vercel-url>/whoop/callback`
5. Visit `https://<your-vercel-url>/whoop/connect` to authorize
