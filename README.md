# Cinematic AI Studio

A premium AI-powered cinematic creation studio built on Cloudflare.

Describe scenes. Collaborate with AI agents (Writer → Director → Editor). Generate studio-quality images with FLUX.1. Experience a live 3D cyberpunk environment. Store everything permanently in R2 with semantic memory via Vectorize.

**Tech Stack:** React + TypeScript + Vite + Three.js + Tailwind + Cloudflare Pages + Workers AI + R2 + Vectorize + D1 (ready)

## Features

- Multi-agent cinematic pipeline (Llama 3.3 + FLUX.1)
- Immersive 3D environment with floating reels, cameras, and neon
- Glassmorphism + neon cyberpunk UI
- Voice input
- Memory Vault with Vectorize
- R2 permanent storage

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Cloudflare

1. Create resources (R2, Vectorize, D1, KV)
2. Update `wrangler.toml` with your IDs
3. Run `npm run deploy`

See `CF-CAPABILITIES.md` for the full future-proof architecture.

## License

MIT
