# Automation Builder Web App (with real scheduler)

This project now includes a real backend scheduler.

## What works now

- Create automation from free text (including time like `15:30`).
- Backend cron scheduling (daily/weekly detection).
- Real execution stages: queued → collecting → analyzing → sending → done/failed.
- Manual **Run now** button.
- Email delivery through SMTP.
- Hebrew/English + Dark Mode settings.

## Run

```bash
npm install
npm start
```

Open: `http://localhost:8000`

## SMTP configuration (required for email)

Set environment variables before starting:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- optional: `TZ` (default: `Asia/Jerusalem`)

Example:

```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-user
export SMTP_PASS=your-pass-or-app-password
export SMTP_FROM="Automation Bot <bot@example.com>"
export TZ=Asia/Jerusalem
npm start
```

## Important

Opening with `file://` will not run server-side automations.
Use `http://localhost:8000` with the Node server running.
