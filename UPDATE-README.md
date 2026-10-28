# Update the existing Teddyxautoping repository

This is an overlay update for `Teddytech2/Teddyxautoping`, not a separate replacement project.

## Apply it
1. Extract this ZIP.
2. Copy `vercel.json`, `lib/`, and `api/` into the repository root, and overwrite `public/app.js`.
3. Keep the existing `public/index.html`, `public/style.css`, `package.json`, and `server.js`.
4. In `lib/monitor.js`, replace `https://EDIT-SECOND-WEBSITE-HERE.com/` with your second website URL.
5. Commit the changes to the existing `main` branch and let Vercel redeploy.

## What this fixes
- Removes the legacy `builds`/`routes` rules that were directing requests to `/public/...`.
- Publishes the existing `public/` folder as the static website output.
- Adds Vercel serverless handlers for `/api/status`, `/api/ping-now`, and `/api/cron`.
- Leaves `server.js` in place for a persistent Node.js host such as Railway.

## Important scheduling note
The dashboard triggers a check when it loads and then refreshes every 60 seconds while the page remains open. `/api/cron` can be called by an external scheduler, but the availability of one-minute schedules depends on the scheduler/hosting plan. Vercel serverless functions do not run a permanent `setInterval` in the background. Use a persistent Node.js host if you need guaranteed continuous one-minute checks without the dashboard open.
