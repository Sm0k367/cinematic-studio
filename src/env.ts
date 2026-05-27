/**
 * Cinematic AI Studio
 * Cloudflare Environment Bindings (Future-Proof)
 *
 * This provides the shape of all Cloudflare bindings.
 * In production (Pages Functions / Workers) these are provided by the platform.
 * For local Vite dev, we use the simulation mode.
 */

export interface CloudflareEnv {
  // Core AI
  AI: any;

  // Storage
  MEDIA: any;           // R2
  KV: any;

  // Databases
  DB: any;              // D1
  MEMORY: any;          // Vectorize

  // Async + Real-time (future)
  QUEUE?: any;
  STUDIO_SESSIONS?: any;

  // Media optimization
  IMAGES?: any;

  // Environment flag
  ENVIRONMENT?: 'development' | 'staging' | 'production';
}

// For local development we don't need the full types
export type Env = CloudflareEnv;
