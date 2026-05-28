# Epic Tech AI Cinematic Studio

A premium, professional AI-powered cinematic creation studio built on Cloudflare.

Describe your vision. Multi-agent pipeline (Writer → Director → Editor) crafts the perfect prompt and renders with FLUX.1-dev. Clean, fast, production-grade UX. Real generations. No fluff.

**Tech Stack:** React + TypeScript + Vite + Tailwind + Framer Motion + Cloudflare Pages + Workers AI + R2

## Features

- Professional multi-agent cinematic pipeline (Llama 3.3-70B + FLUX.1-dev)
- Clean, dynamic, easy-to-use studio interface (no animated 3D background in this release)
- Prompt suggestions, live gallery, agent insights
- Reliable image delivery (inline base64 + optional R2)
- Download, regenerate, history persistence

> The studio is now focused on a clean professional experience. The previous heavy 3D background has been removed for performance and clarity.

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
