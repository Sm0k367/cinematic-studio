/// <reference types="@cloudflare/workers-types" />
// @ts-nocheck

// POST /api/auth — minimal email+password account stored in KV.
// Passwords are SHA-256 hashed at rest. Legacy plaintext records are migrated
// transparently on first successful login.

import {
  Env,
  json,
  readJson,
  hashPassword,
  normEmail,
} from "../_lib/shared";

interface Body {
  action?: "register" | "login";
  email?: string;
  password?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { action, email, password } = await readJson<Body>(request);

  const normalizedEmail = normEmail(email);
  if (!normalizedEmail || !password || typeof password !== "string") {
    return json(
      { success: false, message: "Valid email and password required" },
      400
    );
  }
  if (password.length < 6) {
    return json(
      { success: false, message: "Password must be at least 6 characters" },
      400
    );
  }

  const key = `user:${normalizedEmail}`;

  if (action === "register") {
    const existing = await env.KV.get(key);
    if (existing) {
      return json({ success: false, message: "Account already exists" }, 409);
    }
    const passwordHash = await hashPassword(password);
    await env.KV.put(
      key,
      JSON.stringify({ passwordHash, created: Date.now() })
    );
    return json({
      success: true,
      message: "Account created successfully!",
      email: normalizedEmail,
    });
  }

  if (action === "login") {
    const raw = await env.KV.get(key);
    if (!raw)
      return json({ success: false, message: "Invalid email or password" }, 401);

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ success: false, message: "Account record corrupted" }, 500);
    }

    const inputHash = await hashPassword(password);
    const validHashed = parsed.passwordHash && parsed.passwordHash === inputHash;
    const validLegacy = parsed.password && parsed.password === password;

    if (validHashed || validLegacy) {
      // Migrate legacy plaintext records on successful login.
      if (validLegacy && !validHashed) {
        await env.KV.put(
          key,
          JSON.stringify({
            passwordHash: inputHash,
            created: parsed.created || Date.now(),
            migratedAt: Date.now(),
          })
        );
      }
      return json({ success: true, email: normalizedEmail });
    }
    return json({ success: false, message: "Invalid email or password" }, 401);
  }

  return json({ success: false, message: "Unknown action" }, 400);
};
