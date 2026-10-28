TEDDY-XMD AutoPing — clean three-file setup

Files:
- server.js: API handler and optional local development server.
- index.html: dashboard.
- vercel.json: Vercel routing/build configuration.

Deploy:
1. Put all three files in the ROOT of the GitHub repository (not inside public/).
2. Commit to the branch connected to Vercel.
3. In Vercel Project Settings, set Root Directory to "." and Framework Preset to "Other".
4. Redeploy the newest commit.

Test:
- /                 dashboard
- /api/status       checks configured targets and returns JSON
- /api/cron         same check endpoint for a scheduler

Add a target by editing the TARGETS array near the top of server.js.

Important:
Vercel functions do not run setInterval in the background. To perform checks every minute while nobody visits the dashboard, configure an external scheduler to call /api/cron once per minute, or use a persistent Node.js host. This setup is prepared for Vercel routing but has not been deployed to your account from here.
