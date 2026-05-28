/// <reference types="@cloudflare/workers-types" />
// @ts-nocheck

// Shared types + helpers for Pages Functions.
// Pages Functions use the PagesFunction<Env> handler signature with onRequest*.

export interface Env {
  KV: KVNamespace;
  R2: R2Bucket;
  AI: any;
  PUBLIC_R2_BASE?: string;
}

// JSON response with sensible defaults + CORS-friendly headers (same-origin in
// practice, but harmless if a custom domain is added later).
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function readJson<T = any>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Workers AI commonly returns base64 strings for image (and sometimes video) bytes.
// If we store that string directly into R2, the resulting object is text — broken
// when served as image/jpeg. This converts whatever the model returns into proper
// binary bytes.
export function toBinary(media: unknown): Uint8Array {
  if (media instanceof Uint8Array) return media;
  if (media instanceof ArrayBuffer) return new Uint8Array(media);
  if (Array.isArray(media)) return new Uint8Array(media as number[]);
  if (typeof media === "string") {
    const clean = media.replace(/^data:[^;]+;base64,/, "");
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // Some models wrap the payload in { data: ... } or similar
  if (media && typeof media === "object") {
    const anyMedia = media as any;
    if (anyMedia.data) return toBinary(anyMedia.data);
    if (anyMedia.image) return toBinary(anyMedia.image);
    if (anyMedia.video) return toBinary(anyMedia.video);
  }
  console.warn("toBinary: unexpected media payload", typeof media);
  return new Uint8Array();
}

export async function putToR2(
  env: Env,
  filename: string,
  media: unknown,
  contentType: string
): Promise<void> {
  const bytes = toBinary(media);
  if (bytes.length === 0) throw new Error("Empty media payload from model");
  await env.R2.put(filename, bytes, {
    httpMetadata: { contentType },
  });
}

export function r2Base(env: Env): string {
  // Always read from env. If unset or placeholder, we log loudly so it's
  // obvious in Workers logs why image URLs are broken.
  const raw = (env.PUBLIC_R2_BASE || "").trim().replace(/\/+$/, "");
  if (!raw || raw.includes("YOUR-PUB-URL")) {
    console.warn(
      "[shared] PUBLIC_R2_BASE not configured. Set it in wrangler.toml [vars] " +
        "to your R2 bucket's public URL."
    );
    return "https://PUBLIC_R2_BASE-not-configured.example.com";
  }
  return raw;
}

export function badRequest(message: string): Response {
  return json({ success: false, error: message }, 400);
}

export function serverError(e: any, fallback = "Internal error"): Response {
  const msg = (e && (e.message || e.toString())) || fallback;
  console.error("Error:", msg, e);
  return json({ success: false, error: msg }, 500);
}

// Normalise & validate the email key we use for KV.
export function normEmail(email: string | undefined | null): string | null {
  if (!email || typeof email !== "string") return null;
  const e = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}
