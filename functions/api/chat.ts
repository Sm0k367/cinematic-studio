/// <reference types="@cloudflare/workers-types" />
// @ts-nocheck

// POST /api/chat — quick Kimi K2.6 chat assistant.

import { Env, json, readJson } from "../_lib/shared";

interface Body {
  message?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { message } = await readJson<Body>(request);
    if (!message || typeof message !== "string") {
      return json({ success: false, reply: "Message required" }, 400);
    }
    if (message.length > 2000) {
      return json({ success: false, reply: "Message too long" }, 400);
    }

    const result: any = await env.AI.run("@cf/moonshotai/kimi-k2.6", {
      messages: [
        {
          role: "system",
          content:
            "You are a helpful, creative cinematic AI assistant for Epic Tech AI Studio. Keep answers concise and inspiring.",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      (typeof result === "string" && result) ||
      result?.response ||
      result?.result ||
      "(no reply)";
    return json({ success: true, reply });
  } catch (e: any) {
    console.error("Chat error:", e);
    return json({
      success: false,
      reply:
        "The assistant is taking a creative break. The Kimi model may not be enabled on this account yet.",
    });
  }
};
