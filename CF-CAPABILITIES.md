# Cloudflare Ultimate Architecture — Epic Tech AI Cinematic Studio

**Goal**: Make this the most powerful, future-proof cinematic AI studio possible using **every relevant Cloudflare capability**.

This document defines the complete technical architecture for the new repository.

---

## 1. Core Philosophy

We treat Cloudflare as a **complete platform**, not just hosting:

- **Edge-first** everything (compute, storage, AI, database, real-time)
- **Zero cold starts** where possible (Durable Objects + smart caching)
- **Pay-per-use** model (R2 + AI + Queues + D1 are extremely cheap at scale)
- **Built for collaboration** (real-time studios via Durable Objects)
- **Future video + film pipeline ready** (Stream + Queues + Browser Rendering)

---

## 2. Full Cloudflare Service Map (2026)

| Service                    | Purpose in Studio                                      | Priority | Status in Current Build |
|---------------------------|-------------------------------------------------------|----------|-------------------------|
| **Pages + Functions**     | Frontend + all API routes                             | Core     | ✅ Active              |
| **Workers AI**            | FLUX.1, Llama 3.3, BGE embeddings                     | Core     | ✅ Active              |
| **R2**                    | Permanent storage of all generated images + video     | Core     | ✅ Active              |
| **Vectorize**             | Semantic long-term Memory Vault                       | Core     | ✅ Active              |
| **KV**                    | Fast metadata, rate limits, sessions                  | Core     | ✅ Active              |
| **D1**                    | Relational data (users, scenes, credits, history)     | High     | Planned                |
| **Durable Objects**       | Live collaborative studios, real-time agent state     | High     | Planned                |
| **Queues**                | Async video gen, batch embeddings, notifications      | High     | Planned                |
| **Images**                | On-the-fly optimization, variants, WebP/AVIF          | High     | Planned                |
| **Browser Rendering**     | Storyboard PDFs, frame extraction, future video tools | Medium   | Planned                |
| **Stream**                | Video hosting + delivery when we add video gen        | Medium   | Future                 |
| **Cron Triggers**         | Nightly maintenance, analytics rollups, credit resets | Medium   | Planned                |
| **Turnstile**             | Protect expensive generation endpoints                | High     | Recommended            |
| **Email Workers**         | Generation complete, billing, weekly cinematic digest | Low      | Future                 |
| **Hyperdrive**            | Low-latency connections to external DBs (if needed)   | Low      | Future                 |
| **Logpush + Analytics**   | Full observability + usage analytics                  | High     | Recommended            |
| **R2 + Cache API**        | Aggressive edge caching of generated media            | High     | Recommended            |

---

## 3. Recommended Binding Names (New Repo Standard)

```toml
[ai]
binding = "AI"

[[r2_buckets]]
binding = "MEDIA"                    # All generated images + future video

[[kv_namespaces]]
binding = "KV"

[[d1_databases]]
binding = "DB"                       # Primary relational store

[[vectorize]]
binding = "MEMORY"                   # Semantic vault

[[queues.producers]]
binding = "QUEUE"
queue = "cinematic-jobs"

[[durable_objects.bindings]]
name = "STUDIO_SESSIONS"
class_name = "StudioSession"

[images]
binding = "IMAGES"                   # On-the-fly optimization

[vars]
ENVIRONMENT = "production"
```

---

## 4. D1 Database Schema (Core Tables)

```sql
-- Users & Authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  credits INTEGER DEFAULT 100,
  plan TEXT DEFAULT 'free'           -- free | pro | studio
);

-- Creative Projects / Films
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  style_guide TEXT,                  -- JSON of director preferences
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Individual Generations (images + future video)
CREATE TABLE generations (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,              -- After Writer + Director
  image_url TEXT NOT NULL,           -- R2 public URL
  r2_key TEXT NOT NULL,
  model TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  metadata JSON,                     -- full agent outputs
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Memory Vault Entries (linked to Vectorize + D1)
CREATE TABLE memory_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                -- character | location | motif | scene
  content TEXT NOT NULL,
  embedding_id TEXT,                 -- Vectorize ID
  usage_count INTEGER DEFAULT 1,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Usage & Billing
CREATE TABLE usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,          -- generation | video | embedding
  cost_credits INTEGER NOT NULL,
  metadata JSON,
  created_at INTEGER NOT NULL
);
```

---

## 5. Durable Objects — Live Collaborative Studios

**Class**: `StudioSession`

Use cases:
- Multiple people in the same "film project" directing together in real-time
- Live agent workflow visualization shared across clients
- Presence (who is currently in the studio)
- Temporary shared state before committing to D1/R2

Implementation pattern (future):
```ts
export class StudioSession extends DurableObject {
  async fetch(request: Request) {
    // WebSocket upgrade for real-time
    // Broadcast agent status, new generations, chat
  }
}
```

---

## 6. Queues — Cinematic Job Pipeline

**Queue name**: `cinematic-jobs`

Message types:
- `generate-video`
- `batch-embed-memories`
- `create-storyboard-pdf`
- `send-email-digest`

This will be critical when we add Runway/Kling/Luma video generation.

---

## 7. Images Binding — Automatic Optimization

Every generated frame should go through the Images binding:

```ts
// Example future usage
const optimized = env.IMAGES.input(imageStream)
  .transform({ width: 1280, quality: 85, format: 'webp' })
```

Benefits:
- Automatic WebP / AVIF delivery
- Smart compression
- Variants for thumbnails, gallery, full-res

---

## 8. Future-Proofing Decisions

1. **Everything goes through R2 first**, then Images for delivery variants.
2. **D1 is the source of truth** for relationships and billing.
3. **Vectorize is the brain** for creative memory.
4. **Durable Objects** will power the "Live Directing Room" feature.
5. **Queues** decouple expensive/long-running work from the user request.
6. **Cron + D1 + Vectorize** will run nightly "memory consolidation" jobs.
7. **Browser Rendering** will power beautiful export features (PDF lookbooks, animated storyboards).

---

## 9. Deployment & Environments Strategy (New Repo)

- `production` → main branch
- `staging` → staging branch
- Preview deployments on every PR (Cloudflare Pages native)
- Separate D1 / Vectorize / R2 instances per environment where possible

---

## 10. Next Implementation Order (Recommended)

1. Upgrade `wrangler.toml` with all bindings + environments
2. Add D1 + run initial schema
3. Add `@cloudflare/workers-types` + proper `Env` interface
4. Add Images binding + integrate into generation flow
5. Add Turnstile protection on generation endpoint
6. Stub Durable Objects + Queues
7. Add Cron trigger for maintenance
8. Update frontend to support new D1-backed features (projects, credits, etc.)

---

**This architecture makes the studio one of the most advanced AI creative tools running entirely on Cloudflare's edge.**

When you're ready, we can start implementing these one by one.
