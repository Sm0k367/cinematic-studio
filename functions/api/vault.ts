/// <reference types="@cloudflare/workers-types" />
// @ts-nocheck

// POST /api/vault — user's memory vault (per-email, last 24 items in KV).
// Intentionally trust-on-frontend for now (no session token). This matches the
// original product's "premium-feel demo" scope. Real session auth is a future
// enhancement and is noted in the README.

import { Env, json, readJson, normEmail } from "../_lib/shared";

interface VaultItem {
  url: string;
  prompt: string;
  type: "image" | "video";
  ts: number;
}

interface Body {
  action?: "save" | "load";
  email?: string;
  item?: VaultItem;
}

const MAX_ITEMS = 24;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { action, email, item } = await readJson<Body>(request);
  const normalizedEmail = normEmail(email);
  if (!normalizedEmail) {
    return json({ success: false, message: "Valid email required" }, 400);
  }
  const key = `vault:${normalizedEmail}`;

  if (action === "save") {
    if (!item || typeof item.url !== "string") {
      return json({ success: false, message: "Invalid item" }, 400);
    }
    const existing = JSON.parse((await env.KV.get(key)) || "[]");
    existing.unshift(item);
    await env.KV.put(key, JSON.stringify(existing.slice(0, MAX_ITEMS)));
    return json({ success: true });
  }

  if (action === "load") {
    const items = JSON.parse((await env.KV.get(key)) || "[]");
    return json({ success: true, items });
  }

  return json({ success: false, message: "Unknown action" }, 400);
};
