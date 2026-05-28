# Epic Tech AI Cinematic Studio

Premium, minimal, self-contained AI cinematic image & video studio powered by Cloudflare.

**One file. Zero bloat. Ready to deploy.**

## What you get

- Beautiful dark cinematic + neon cyberpunk UI (glassmorphism)
- Reliable image generation (Flux-1-schnell)
- Video generation (Pixverse v6)
- In-studio Chat Assistant (Kimi K2.6)
- Memory Vault + Generation History
- Simple email/password accounts (stored in KV)
- Direct download of every generation
- Fully self-contained in a single `functions/api/cinematic.ts`

## 5-Minute Setup

### 1. Cloudflare prerequisites

- Workers AI enabled on your account
- Create an **R2 bucket** named `epic-ai-media`
  - Go to the bucket → Settings → **Public Access** → Enable (or attach a custom domain)
- Create a **KV namespace** (any name)
  - Note the **ID** (you will need it)

### 2. Configure the project

Edit `wrangler.toml` and uncomment + paste your KV ID:

```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_REAL_KV_ID_HERE"
```

(Also update the R2 bucket name if you used something different.)

### 3. Deploy

```bash
# Make sure you're logged in
wrangler login

# Deploy (the easy way)
bash deploy.sh

# Or manually
wrangler pages deploy . --project-name=cinematic-studio
```

### 4. (Optional) Local development

```bash
wrangler pages dev .
```

---

## Important Notes

- The first generation may be slow while models warm up.
- Video generation can be flaky depending on your account's model access.
- If you see 500 errors on chat or video, it usually means that specific model is not enabled for your account yet — image generation is the most reliable path.
- All generations are stored in your R2 bucket.

## Tech

- Cloudflare Pages + Functions (no separate frontend build)
- Workers AI (Flux + Pixverse + Kimi)
- R2 for media storage
- KV for auth + future persistence

Built to feel expensive. Built to actually work.

---

**Support the work**: https://buy.stripe.com/7sI3dlgcQ4uL0gMeUW
