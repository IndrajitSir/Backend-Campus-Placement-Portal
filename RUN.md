# Backend — Run Locally & Production

Express + MongoDB (Mongoose) + Socket.io API. Port **6005**.

---

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.x (LTS) | ESM project — `"type": "module"` |
| npm | 9+ | |
| MongoDB | 7+ | Local install **or** Docker |
| Redis | 7 | Optional but used for caching/presence |
| Docker | 24+ | Only needed for the containerized stack |
| ClamAV, Piston, Judge0 | — | Only via Docker (see below) |

---

## 2. Local development (bare metal)

### 2.1 Install dependencies

```bash
cd Backend-Campus-Placement-Portal
npm install
```

### 2.2 Environment file

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
# Required
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=campusplace
FRONTEND_URL=http://localhost:5173        # your Vite dev-server origin
SESSION_SECRET=long-random-string
ACCESS_TOKEN_SECRET=long-random-string
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=long-random-string
REFRESH_TOKEN_EXPIRY=7d

# Optional integrations (leave blank to disable)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LOGTAIL_SOURCE_TOKEN=

# Code execution — in the Docker stack these point at the bundled containers;
# for bare-metal dev, set your own or leave blank and rely on Judge0 (self-hosted
# or public with PISTON_API_KEY).
PISTON_API_URL=
PISTON_API_KEY=
JUDGE0_API_URL=

# File scanning — CLAMAV_HOST unset ⇒ scanning disabled
CLAMAV_HOST=
CLAMAV_FAIL_OPEN=false
MAX_UPLOAD_MB=10
```

> Generate secrets with `openssl rand -base64 64` (or PowerShell `[Convert]::ToBase64String((1..64 | % { Get-Random -Max 256 }))`).

### 2.3 Run

```bash
npm run dev      # nodemon, hot reload
# or
npm start        # single run
```

Server listens on `http://localhost:6005`. Healthcheck: `GET http://localhost:6005/api/v1/healthcheck`.

---

## 3. Local development (Docker stack)

Brings up backend + MongoDB + Redis + **Piston** + **Judge0** + **ClamAV** with hot reload (bind-mount of `./src`).

```bash
cd Backend-Campus-Placement-Portal
cp judge0.conf.example judge0.conf        # Judge0 needs its config
cp .env.example .env                      # optional, for overrides
docker compose up --build -d              # --build after compose/Dockerfile edits
```

- Backend: `http://localhost:6005` (nodemon inside the container)
- Mongo: `localhost:27017`, Redis: `localhost:6379`, Piston: `localhost:2000`, Judge0: `localhost:2358`, ClamAV: `localhost:3310`
- Logs: `docker compose logs -f backend`
- ClamAV downloads its virus DB on first start (a few minutes) — uploads are **fail-closed** until it's healthy.

> Port conflicts with a host MongoDB/Redis? `MONGO_PORT=27018 REDIS_PORT=6380 docker compose up -d --build`

---

## 4. Production (Docker, full self-host)

Production stack: frontend (nginx) + backend + Piston + Judge0 + ClamAV. **No MongoDB/Redis images** — the app connects to **MongoDB Atlas** and **Upstash Redis**.

### 4.1 Prepare config files

```bash
cd Backend-Campus-Placement-Portal
cp env.production.example .env.production   # fill in real values (see §5)
cp judge0.conf.example judge0.conf          # Judge0 config (POSTGRES/REDIS passwords, SECRET_KEY_BASE)
chmod 600 .env.production judge0.conf
```

### 4.2 Build & start

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Verify:

```bash
docker compose -f docker-compose.prod.yml ps                 # all services Up/healthy
curl -s http://localhost:6005/api/v1/healthcheck             # backend ok
```

Stop: `docker compose -f docker-compose.prod.yml down` (add `-v` to wipe volumes).

### 4.3 Deploying to Render / Railway instead

Skip the compose file and set every key from §5 as environment variables in the platform dashboard; `npm start` runs the server, and the platform injects `PORT`.

---

## 5. API keys & secrets — set BEFORE building the production image

| Variable | Required | Where to get it |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB Atlas → Database → Connect → drivers → SRV string (`mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority`). Do **not** append the DB name. |
| `DB_NAME` | ✅ | Any name, e.g. `campusplace`. |
| `REDIS_URL` | ✅ | Upstash → your database → REST/Redis URL (`rediss://default:TOKEN@instance.upstash.io:6379` — TLS is native). |
| `ACCESS_TOKEN_SECRET` | ✅ | `openssl rand -base64 64` |
| `REFRESH_TOKEN_SECRET` | ✅ | `openssl rand -base64 64` |
| `SESSION_SECRET` | ✅ | `openssl rand -base64 64` |
| `FRONTEND_URL` / `CORS_ORIGIN` | ✅ | Public origin of the deployed frontend (must match exactly, incl. `https://`). |
| `VITE_API_URL` | ✅ | Public backend URL — passed as a **build arg** to the frontend image. |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ | Cloudinary dashboard — resume/avatar uploads break without it. |
| `CLOUDINARY_API_KEY` | ⚠️ | Cloudinary dashboard. |
| `CLOUDINARY_API_SECRET` | ⚠️ | Cloudinary dashboard. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ◻️ | Google Cloud Console → OAuth credentials (callback `{BACKEND}/auth/google/callback`). |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | ◻️ | GitHub → Settings → Developer settings → OAuth Apps. |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | ◻️ | LinkedIn Developer portal. |
| `LOGTAIL_SOURCE_TOKEN` | ◻️ | Logtail source token. Leave **unset** if unused — an invalid token hangs the server. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | ◻️ | Your email provider (deadline-reminder job; disabled when blank). |
| `JUDGE0_AUTH_TOKEN` | ◻️ | `printf "user:pass" | base64` — only if you enable auth in `judge0.conf`. |
| `PISTON_API_KEY` | ◻️ | Authorization key for the **public/community** Piston endpoints. The public `emkc.org` API has required one since Feb 2026 (obtain from the Piston maintainers). Blank ⇒ public fallbacks are skipped; self-hosted Piston/Judge0 still work. |
| `CODE_EXECUTION_ENGINES` | ◻️ | Default `self_piston,judge0,public_piston,community_piston` — fine as-is. |
| `CLAMAV_FAIL_OPEN` | ◻️ | `false` (secure default). |
| `MAX_UPLOAD_MB` | ◻️ | `10` default. |
| `judge0.conf`: `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `SECRET_KEY_BASE` | ⚠️ | Random values (`openssl rand -base64 32` / `-hex 64`). |

✅ = must set · ⚠️ = strongly recommended · ◻️ = optional

### 5.1 Docker secrets hygiene

- `.env.production` and `judge0.conf` are excluded from images via `.dockerignore` and from Git via `.gitignore` (`.env.*`). Don't force-add them.
- The production `Dockerfile.prod` runs as the unprivileged `node` user.

---

## 6. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Backend boots then exits immediately | Bad `MONGODB_URI` — the DB-name append is Atlas-safe now (query strings handled). |
| Uploads rejected 422 | ClamAV still downloading its DB on first boot, or a real infection. Check `docker compose logs clamav`. |
| Code execution 503 | All engines failed — check Piston (`node -e "require('http').get('http://localhost:2000/',r=>console.log(r.statusCode))"` — returns 200 when up) and Judge0 (`curl http://localhost:2358/about`) are up; if using public fallbacks, set `PISTON_API_KEY` (emkc.org requires one since Feb 2026). |
| CORS errors in the browser | `FRONTEND_URL` doesn't match the origin you're browsing from. |
| OAuth "redirect_uri_mismatch" | Callback URL in the provider dashboard must match `${FRONTEND_URL}/auth/.../callback` used in `.env`. |
