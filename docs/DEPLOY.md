# CoreIQ CRM Deployment Guide (Render Free Tier & Cloud Run)

This document outlines the deployment configuration, environment variables, and execution architecture for CoreIQ CRM.

## 1. Hosting Architecture
- **Environment**: Render Web Service (Free Tier) or GCP Cloud Run.
- **Node.js Runtime**: Node.js 22 (Linux x64).
- **Process Characteristics**: Stateless, scale-to-zero. No persistent disks exist across instance restarts or sleeping cycles. All state is maintained in PostgreSQL (Supabase) or serialized in-memory.

## 2. Build & Start Commands
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start` (or `node dist/server.cjs`)
- **Port Binding**: Binds automatically to `0.0.0.0:$PORT` (defaults to port `3000`).

## 3. Cold Start Considerations
- When deployed on scale-to-zero infrastructure (Render Free or Cloud Run), inactive containers sleep after 15 minutes of inactivity.
- First inbound request incurs a ~15-30s container spin-up (cold start).
- The SPA bundle is cached by service workers; backend routes must not rely on long-lived in-process timers. Scheduled recurring tasks are driven externally via GitHub Actions (`.github/workflows/crm-jobs.yml`).

## 4. Required Environment Variables (Names Only — No Secrets Committed)
| Variable Name | Scope | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Server | Set to `production` in live deployments. |
| `PORT` | Server | Server port provided by runtime host (defaults to `3000`). |
| `APP_URL` | Server | Canonical public URL of the application. |
| `SUPABASE_URL` | Server | Supabase project URL (`https://<project-ref>.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Server-side elevated Supabase key for RBAC and row level security enforcement. |
| `SUPABASE_ANON_KEY` | Server | Supabase public anonymous key. |
| `VITE_SUPABASE_URL` | Client | Browser-accessible Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Client | Browser-accessible Supabase anonymous key. |
| `DEMO_MODE` | Server | Set to `false` in production. Demo mode is strictly rejected in production. |
| `VITE_DEMO_MODE` | Client | Set to `false` in production to prevent demo shortcuts. |
| `GEMINI_API_KEY` | Server | Server-side Gemini API key for governor and brief generation. |
| `RESEND_API_KEY` | Server | API key for transactional emails and outbound notifications. |
| `EMAIL_WEBHOOK_SIGNING_SECRET` | Server | Secret for validating incoming Resend webhooks. |
| `VAPID_PUBLIC_KEY` | Server/Client | Web Push public key generated via `npm run vapid`. |
| `VAPID_PRIVATE_KEY` | Server | Web Push private key for signing push payloads. |
| `VAPID_SUBJECT` | Server | Contact email for Web Push notifications (`mailto:...`). |
