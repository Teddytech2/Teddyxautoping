# TEDDY-XMD AutoPing

A small Node.js website with a dashboard that checks URLs listed in `TARGETS` inside `server.js` immediately on startup and every 60 seconds afterward.

## Configure targets

Edit `server.js` and add your own websites inside the array:

```js
const TARGETS = [
  "https://your-site.example/",
  "https://your-api.example/health"
];
```

Use only websites you own or are authorized to monitor. Save the file and restart the app.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Deploying

Deploy on an always-on Node.js host such as Railway, Render (a paid always-on service if required by the current plan), or a VPS/Pterodactyl Node.js server. Set the start command to `npm start`; the host should provide `PORT` automatically.

**Important:** This uses a long-running Node.js process and `setInterval`. Serverless hosting such as Vercel Functions does not guarantee a process stays alive every minute, so this scheduler should not be hosted as a Vercel-only serverless app. Use a persistent Node.js service or a real external scheduler instead.

## Endpoints

- `GET /` — dashboard
- `GET /api/status` — current in-memory status
- `POST /api/ping-now` — manually ping all configured targets
- `GET /health` — simple health check

## Notes

- Status and recent logs are kept in memory and reset when the server restarts.
- HTTP responses below 500 are treated as reachable; HTTP 5xx and network errors are shown as issues.
- The monitor does not guarantee that a third-party hosting provider will keep a target awake. Some providers intentionally sleep free services or disallow keep-alive pings; follow their terms and use their supported always-on options when available.
