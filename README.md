# Cinematic AI Studio

A premium AI-powered cinematic creation studio built on Cloudflare.

Describe scenes. Collaborate with AI agents (Writer → Director → Editor). Generate studio-quality images with FLUX.1-dev (highest quality). Experience a live 3D cyberpunk environment. Store everything permanently in R2.

**Tech Stack:** React + TypeScript + Vite + Three.js + Tailwind + Cloudflare Pages + Workers AI + R2 + Vectorize

## Features

- Multi-agent cinematic pipeline (Llama 3.3-70B + FLUX.1-dev highest quality)
- Immersive 3D environment
- Clean, cinematic UI
- Voice input
- Memory Vault with Vectorize
- R2 permanent storage

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Cloudflare (Recommended)

This repo is set up for automatic deployment via GitHub Actions.

### One-time Setup

1. In your GitHub repo, go to **Settings → Secrets and variables → Actions**
2. Add these two secrets:
   - `CLOUDFLARE_API_TOKEN` → Your Cloudflare API token (with Pages + Workers permissions)
   - `CLOUDFLARE_ACCOUNT_ID` → `4f00441f1f72053ee62f67d115615dc2`

3. In Cloudflare Dashboard, create these resources (use exact names):
   - R2 bucket: `cinematic-ai-media`
   - Vectorize index: `cinematic-memory-vault` (768 dimensions, cosine)
   - KV namespace (note the ID)
   - (Optional) D1 database

4. Update `wrangler.toml` with your KV ID.

5. Connect the repo in Cloudflare Pages (or just push — the workflow will deploy).

Every push to `main` will automatically build and deploy.

## Manual Deploy (if needed)

```bash
npm run deploy
```

## License

MIT
