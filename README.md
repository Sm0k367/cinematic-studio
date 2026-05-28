# Epic Tech AI Cinematic Studio

A premium, professional AI-powered **universal media creation studio** built on Cloudflare.

Describe anything. The smart router (powered by Kimi K2.6 + specialized models) detects the best medium and generates:
- **Images** — Flux.1-dev (highest quality)
- **Video** — Partner text-to-video / image-to-video models (Vidu, HappyHorse-class)
- **Voice / Audio** — Inworld TTS-2 (expressive cinematic narration)
- **Scripts / Storyboards / Text** — Rich directed output

Clean, fast, production-grade UX. Real generations across media types. No fluff.

**Tech Stack:** React + TypeScript + Vite + Tailwind + Framer Motion + Cloudflare Pages + Workers AI (Kimi K2.6, Flux, Inworld TTS, partner video) + R2

## Features

- Universal any-media router (Auto + explicit Image/Video/Audio/Script modes)
- Clean, dynamic, easy-to-use professional interface
- Live agent direction + reliable inline delivery (base64)
- Download, regenerate, persistent gallery
- Works great even on free plan (graceful degradation)

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
   - **Project name on Cloudflare**: `epic-tech-ai-cinematic-studio` (or connect to existing)

4. Click **Save and Deploy**

5. After the first successful deployment, go to **Settings → Bindings** and add:
   - AI → `AI`
   - R2 Bucket → `cinematic-ai-media` (binding name: `MEDIA`)
   - KV Namespace (binding name: `KV`)
   - Vectorize (binding name: `MEMORY`) ← Only if you have a paid plan

Every future push to `main` will automatically redeploy.

## Deployment & Configuration

After first deploy, in Cloudflare Pages → Settings → Bindings add:
- AI (Workers AI) → binding name `AI`
- R2 Bucket → `cinematic-ai-media` (binding name `MEDIA`)
- (Optional) KV and Vectorize for full memory features on paid plans.

The pipeline now gracefully degrades and always returns usable images via base64 even if R2/KV are not fully configured.

## License

MIT
