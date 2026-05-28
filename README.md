# Epic Tech AI Cinematic Studio

Premium, minimal, self-contained AI cinematic image & video studio powered by Cloudflare.

**Static `index.html` + Pages Functions. Zero bundler. One command to deploy.**

---

## What you get

- Beautiful dark cinematic + neon cyberpunk UI (glassmorphism)
- Reliable image generation (`@cf/black-forest-labs/flux-1-schnell`)
- Video generation (`@cf/pixverse/v6`)
- In-studio chat assistant (`@cf/moonshotai/kimi-k2.6`)
- Memory vault + generation history (KV)
- Email / password accounts with **SHA-256 hashed** passwords at rest
- Direct download of every generation
- Binary-safe R2 storage (base64 payloads from Workers AI are decoded before write — no more broken images)

## Architecture (1 minute read)

```
/
├── index.html              ← served statically by Pages (fast, free)
├── _routes.json            ← tells Pages: only /api/* hits Functions
├── wrangler.toml           ← bindings + PUBLIC_R2_BASE var
├── deploy.sh               ← guarded deploy script
└── functions/
    ├── _lib/shared.ts      ← shared helpers (hash, base64→binary, R2 write)
    └── api/
        ├── cinematic.ts    ← POST /api/cinematic  (image | video)
        ├── chat.ts         ← POST /api/chat
        ├── auth.ts         ← POST /api/auth       (register | login)
        └── vault.ts        ← POST /api/vault      (save | load)
```

Each file under `functions/api/` exports `onRequestPost` — the Cloudflare Pages
Functions convention. Pages auto-routes URL paths to files; we don't write any
router code ourselves.

---

## 5-minute setup

### 1. Cloudflare prerequisites

- **Workers AI** enabled on your account
- **R2 bucket** named `cinematic-ai-media`
  - Enable **Public Development URL** (you'll get a `https://pub-XXXX.r2.dev`)
  - For production, attach a **custom domain** instead — pub URLs are rate-limited
- **KV namespace** (any name) — note the ID

### 2. Configure `wrangler.toml`

```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"

[[r2_buckets]]
binding = "R2"
bucket_name = "cinematic-ai-media"

[vars]
PUBLIC_R2_BASE = "https://pub-XXXXXXXX.r2.dev"   # or your custom domain
```

The repo ships with the original author's KV id + R2 public URL already filled
in. Replace them with yours.

### 3. Deploy

You have two options.

#### Option A — CLI (recommended, most reliable)

```bash
wrangler login         # one-time
bash deploy.sh         # or: npm run deploy:direct
```

`deploy.sh` refuses to push if it spots placeholder KV / R2 values.

#### Option B — Cloudflare dashboard auto-deploys from Git

If you connect this repo via the Cloudflare dashboard, **set these exactly**
under your Pages project → Settings → Builds & deployments:

| Field                 | Value                       |
| --------------------- | --------------------------- |
| Framework preset      | **None**                    |
| Build command         | *(leave blank)*             |
| Build output directory| `/` *(or leave blank)*      |
| Deploy command        | *(leave blank)*             |
| Root directory        | *(leave blank)*             |

> ⚠️ **Important:** If your Pages project's "Deploy command" is set to
> `npx wrangler deploy`, builds will fail with
> *"It looks like you've run a Workers-specific command in a Pages project."*
> That command is for **Workers**, not Pages. Either clear the field (Pages
> auto-deploys static + Functions with zero config) or replace it with
> `npx wrangler pages deploy .`.

Cloudflare Pages auto-detects:
- Static assets in the repo root (`index.html`, etc.)
- Pages Functions in `functions/`
- Bindings + vars from `wrangler.toml`

No build step is needed.

### 4. Local dev

```bash
npm install   # optional, only needed for the wrangler devDependency
wrangler pages dev .
```

Workers AI + R2 require real Cloudflare bindings — local dev proxies to your
real account, so generations still cost real model usage.

---

## API surface

All routes accept `POST` with `Content-Type: application/json`.

| Route             | Body                                                       | Notes                                  |
| ----------------- | ---------------------------------------------------------- | -------------------------------------- |
| `/api/cinematic`  | `{ prompt: string, mode?: "image" \| "video" }`            | Returns `{ success, type, url }`       |
| `/api/chat`       | `{ message: string }`                                      | Returns `{ success, reply }`           |
| `/api/auth`       | `{ action: "register" \| "login", email, password }`       | SHA-256 hashed; min 6 chars            |
| `/api/vault`      | `{ action: "save" \| "load", email, item? }`               | Last 24 items per user                 |

`/api/cinematic` also accepts `GET` for a simple JSON health check.

---

## Notes & gotchas

- **First generation is slow** — models cold-start.
- **Video / chat may 500 on fresh accounts** — those models aren't enabled
  by default for every account. Image gen is the reliable path; the UI shows
  a friendly error when a model isn't available.
- **R2 must be public.** If you see broken `<img>` previews, your bucket's
  Public Development URL is off or `PUBLIC_R2_BASE` doesn't match.
- **Binary safety.** Workers AI returns base64 strings for Flux output. We
  decode to `Uint8Array` before `R2.put()` — see `functions/_lib/shared.ts`'s
  `toBinary()`. This is the #1 reason the original "broken JPEG" bug existed.
- **Passwords are hashed.** Legacy plaintext records (from older versions)
  are migrated transparently on first successful login.
- **Auth is trust-on-client.** The vault endpoints accept `email` from the
  client without a session token — fine for a demo, NOT fine for sensitive
  data. Add Cloudflare Access or JWT sessions before treating this as a
  multi-tenant product.

## Tech

- Cloudflare Pages + Functions (no separate frontend build)
- Workers AI (Flux + Pixverse + Kimi)
- R2 for media storage
- KV for auth + memory vault

Built to feel expensive. Built to actually work.

---

**Support the work:** https://buy.stripe.com/7sI3dlgcQ4uL0gMeUW
