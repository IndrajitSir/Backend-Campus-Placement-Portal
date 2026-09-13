# Deployment — Production

Two production paths are supported:

| Path | Backend | Frontend | Sidecars (Piston/Judge0/ClamAV) |
| --- | --- | --- | --- |
| **A. Render Blueprint** (`render.yaml`) | Render web service (Docker) | Vercel (or anything static) | ❌ none — features degrade (see §1.4) |
| **B. Docker images** (`docker-compose.prod.yml`) | Node container on your VPS | nginx container on your VPS | ✅ full stack, same host |

> MongoDB is Atlas and Redis is Upstash in **both** paths — no DB images are
> used. All secrets live in environment variables, never in the image
> (`.dockerignore` excludes `.env*`).

---

## 0. The env vars you asked about

| In `.env.production` | Works? | Explanation |
| --- | --- | --- |
| `FRONTEND_URL=https://campus-placement-portal.vercel.app` | ✅ | This is the **exact** variable the backend reads for CORS (`src/app.js`) — comma-separated allowed origins. |
| `CORS_ORIGIN=https://campus-placement-portal.vercel.app` | ⚠️ No effect | The backend never reads `CORS_ORIGIN`. Harmless, but delete it to avoid confusion — `FRONTEND_URL` is the real one. |
| `VITE_API_URL=https://backend-campus-placement-portal.onrender.com` | ✅ with caveats | Baked into the **frontend bundle at build time**. Must be set wherever the frontend image is built (compose arg / Vercel env). The browser calls the backend directly (nginx does not proxy `/api`), so `FRONTEND_URL` must match the browser origin (it does), and the Render service name must be exactly `backend-campus-placement-portal` — Render URLs are `<service-name>.onrender.com` and service names must be globally unique. |

Also set `PORT=6005` (already in `env.production.example`) for the Docker path —
the app binds `process.env.PORT` (falls back to 8000). Render injects its own
`PORT` automatically and you must **not** hard-code it there.

---

## 1. Path A — Render Blueprint (backend only)

### 1.1 One-time setup
1. Push the repo (root must contain `render.yaml`).
2. Render → **New +** → **Blueprint** → connect the repo → **Apply**.
3. On the **Sync** screen, fill the secrets marked `sync: false` in `render.yaml`:
   `MONGODB_URI`, `REDIS_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`,
   `SESSION_SECRET`, `PISTON_API_KEY`, SMTP/RESEND vars (optional).
4. First deploy starts automatically. It runs `npm ci --omit=dev` — a few minutes.

### 1.2 Confirm it's live
```bash
curl -s https://backend-campus-placement-portal.onrender.com/api/v1/healthcheck
```
→ `200` JSON. Instance health is also visible in the Render dashboard
(`healthCheckPath: /api/v1/healthcheck`).

### 1.3 Redeploy
Push to the default branch (auto-deploy) or **Manual Deploy** → **Deploy latest
commit** in the dashboard.

### 1.4 What degrades on Render (no sidecars)
- **Code execution**: only the public/community Piston endpoints exist. Set
  `PISTON_API_KEY` (emkc.org requires one since Feb 2026) or expect the
  endpoint to 503 after all engines fail.
- **File scanning**: `CLAMAV_HOST` unset → the ClamAV step is skipped; the
  `file-type` signature check + `sharp` EXIF stripping still run.
- **Deadline reminders**: same as compose — enabled if SMTP or Resend is set.
- Render free instances **sleep** after ~15 min of inactivity (cold start on
  next request). Use a `starter`+ plan for a real production feel.

---

## 2. Path B — Docker images on a VPS (full stack)

Builds the backend image (`Backend-Campus-Placement-Portal/Dockerfile.prod`)
and the frontend/nginx image (`Frontend-Campus-Placement-Portal/Dockerfile`).

### 2.1 On the VPS, first time
```bash
git clone <your-repo-url> campusplace && cd campusplace

cd Backend-Campus-Placement-Portal
cp env.production.example .env.production
nano .env.production        # fill every value, incl. PORT=6005
# optional for Judge0 auth:
cp judge0.conf.example judge0.conf
```

### 2.2 Build & start
```bash
cd Backend-Campus-Placement-Portal
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production ps   # all Up
```

First boot: ClamAV downloads its virus DB (5–10 min) — uploads are fail-closed
(422) until clamd is ready. This is expected; later boots reuse `clamav_db`.

### 2.3 Verify
```bash
curl http://localhost:6005/api/v1/healthcheck          # backend
curl -I http://localhost/                              # nginx → frontend
# Piston/Judge0/ClamAV (bound to 127.0.0.1 on the VPS):
curl http://localhost:2000/                            # Piston vX.Y.Z
curl http://localhost:2358/about                       # Judge0
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f backend
```

### 2.4 Updates
```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### 2.5 Put it behind a domain (recommended)
Put nginx/Caddy on the host, or a load balancer in front:
- `https://api.yourdomain.com` → `127.0.0.1:6005`
- `https://yourdomain.com` → `127.0.0.1:80`
- Then change `FRONTEND_URL` to `https://yourdomain.com` and rebuild the
  frontend with `VITE_API_URL=https://api.yourdomain.com`.

---

## 3. Frontend

### 3.1 Vercel (already used: `campus-placement-portal.vercel.app`)
1. Vercel → your project → **Settings → Environment Variables**:
   - `VITE_API_URL=https://backend-campus-placement-portal.onrender.com`
   - `VITE_API_VERSION=2`
2. **Redeploy** (`npm run build` bakes the values in).
3. Backend CORS: `FRONTEND_URL` already allows the Vercel origin (the backend
   also allows any `*.vercel.app` by default).

### 3.2 Via the compose stack (Path B)
The frontend image is built with `VITE_API_URL`/`VITE_API_VERSION` args in
`docker-compose.prod.yml` — no extra step, but changing them requires
`--build` again.

---

## 4. Quick secret checklist (before ANY production build)

| Key | Needed for | Where |
| --- | --- | --- |
| `MONGODB_URI` | Database (Atlas) | Render dashboard / `.env.production` |
| `REDIS_URL` | Cache + sessions (Upstash) | Render dashboard / `.env.production` |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `SESSION_SECRET` | Auth/sessions | Render dashboard / `.env.production` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | File uploads | `.env.production` / dashboard |
| Google/GitHub/LinkedIn OAuth keys | Social login | `.env.production` / dashboard |
| `PISTON_API_KEY` | Public Piston (since Feb 2026) | optional |
| `RESEND_API_KEY` or SMTP_* | Deadline emails | optional |
| `LOGTAIL_SOURCE_TOKEN` | Logging | leave unset if unused |
