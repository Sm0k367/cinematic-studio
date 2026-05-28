# Cinematic AI Studio

A premium AI-powered cinematic creation studio built on Cloudflare.

Describe scenes. Collaborate with AI agents (Writer → Director → Editor). Generate studio-quality images with FLUX.1-dev (highest quality). Experience a live 3D cyberpunk environment. Store everything permanently in R2.

**Tech Stack:** React + TypeScript + Vite + Three.js + Tailwind + Cloudflare Pages + Workers AI + R2

## Features

- Multi-agent cinematic pipeline (Llama 3.3-70B + FLUX.1-dev)
- Immersive 3D environment
- Clean, cinematic UI
- Voice input
- R2 permanent storage

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Cloudflare Pages (Easiest Method)

This repo is optimized for direct Git deployment via Cloudflare Pages.

### Steps

1. In Cloudflare Dashboard → **Pages** → **Create a project** → **Connect to Git**

2. Select the repository `Sm0k367/cinematic-studio`

3. Use these exact build settings:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: Leave as `/`

4. Click **Save and Deploy**

5. After the first successful deployment, go to **Settings → Bindings** and add:
   - AI → `AI`
   - R2 Bucket → `cinematic-ai-media` (binding name: `MEDIA`)
   - KV Namespace (binding name: `KV`)
   - Vectorize (binding name: `MEMORY`) ← Only if you have a paid plan

Every future push to `main` will automatically redeploy.

## Notes for Free Plan Users

- Memory Vault is temporarily disabled (requires Vectorize, which needs a paid plan).
- The rest of the studio works normally.

## License

MIT
