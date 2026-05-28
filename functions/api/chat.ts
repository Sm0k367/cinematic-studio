/// <reference types="@cloudflare/workers-types" />
// @ts-nocheck

// POST /api/chat — cinematic AI muse "NOVA" (Kimi K2.6 powered).
//
// Body:
//   {
//     message: string                 — current user turn (required)
//     history?: {role, content}[]     — recent turns for context (last ~10 turns)
//     persona?: "nova" | "sage" | "chaos" | "pro"   — persona override
//     mode?:    "chat" | "prompt"      — when "prompt" we return a single
//                                        cinematic prompt string ready to feed
//                                        straight into image generation
//   }

import { Env, json, readJson } from "../_lib/shared";

interface Msg {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Body {
  message?: string;
  history?: Msg[];
  persona?: "nova" | "sage" | "chaos" | "pro";
  mode?: "chat" | "prompt";
}

// ---------------- Personas ----------------
// Each persona is just a system prompt. Keep them tight and punchy — long
// system prompts pollute small chat windows and slow the model.
const PERSONAS: Record<string, string> = {
  nova: [
    "You are NOVA — a cinematic AI muse with the confidence of a veteran",
    "director and the warmth of a great cinematographer at 2am over coffee.",
    "You think in shots, not sentences. You reference films, lighting, lenses,",
    "and color palettes naturally. You are witty, never pretentious, and",
    "treat every user message like a pitch meeting where the next great",
    "image is one suggestion away. You speak in short, punchy paragraphs.",
    "When the user types a /slash command, follow its specific format.",
    "When you suggest a prompt for image generation, wrap it in",
    "[PROMPT]…[/PROMPT] so the UI can lift it out cleanly.",
  ].join(" "),

  sage: [
    "You are SAGE — a calm, classical art historian and film theorist.",
    "You speak slowly, in measured cadence. You reference Tarkovsky, Kubrick,",
    "Caravaggio, Rembrandt's light. You guide the user toward depth over",
    "spectacle. When suggesting an image prompt, wrap it in [PROMPT]…[/PROMPT].",
  ].join(" "),

  chaos: [
    "You are CHAOS — a manic, hyperactive creative engine. You ALL CAPS",
    "important nouns. You mash genres violently. You suggest the unhinged.",
    "Emoji okay 🔥. Keep replies under 4 lines but BOLD. When suggesting an",
    "image prompt, wrap it in [PROMPT]…[/PROMPT].",
  ].join(" "),

  pro: [
    "You are a professional prompt engineer for cinematic image generation.",
    "Concise, technical, terse. You always end with a single suggested",
    "prompt in [PROMPT]…[/PROMPT] format. No fluff.",
  ].join(" "),
};

// "Prompt mode" — when the UI just wants a single cinematic prompt back
// (used by /roll, /seed, etc), bypass the persona and force a one-shot.
const PROMPT_MODE_SYSTEM = [
  "You are a cinematic prompt generator. Reply with EXACTLY ONE concrete,",
  "evocative image prompt (40-80 words). No preamble. No 'Here's a prompt:'.",
  "Just the prompt itself. Include subject, environment, lighting, mood,",
  "color, camera/lens hint, and a film grain / cinematic anchor.",
].join(" ");

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await readJson<Body>(request);
    const { message, history = [], persona = "nova", mode = "chat" } = body;

    if (!message || typeof message !== "string") {
      return json({ success: false, reply: "Message required" }, 400);
    }
    if (message.length > 2000) {
      return json({ success: false, reply: "Message too long (max 2000 chars)" }, 400);
    }

    const systemContent =
      mode === "prompt"
        ? PROMPT_MODE_SYSTEM
        : PERSONAS[persona] || PERSONAS.nova;

    // Sanitize history: only role+content strings, last 10 turns.
    const sanitizedHistory: Msg[] = (Array.isArray(history) ? history : [])
      .slice(-10)
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    const messages: Msg[] = [
      { role: "system", content: systemContent },
      ...sanitizedHistory,
      { role: "user", content: message },
    ];

    const result: any = await env.AI.run("@cf/moonshotai/kimi-k2.6", {
      messages,
      max_tokens: mode === "prompt" ? 220 : 600,
      temperature: mode === "prompt" ? 0.9 : 0.75,
    });

    // Kimi K2.6 returns OpenAI-shaped output.
    const reply =
      result?.choices?.[0]?.message?.content ||
      result?.response ||
      (typeof result === "string" ? result : "") ||
      result?.result ||
      "(no reply)";

    // Pull any [PROMPT]…[/PROMPT] block out so the UI can show a "Use as
    // prompt" button without having to regex client-side.
    const m = String(reply).match(/\[PROMPT\]([\s\S]*?)\[\/PROMPT\]/i);
    const extractedPrompt = m ? m[1].trim() : null;

    return json({
      success: true,
      reply: String(reply).trim(),
      prompt: extractedPrompt,
      persona,
    });
  } catch (e: any) {
    console.error("Chat error:", e);
    return json({
      success: false,
      reply:
        "NOVA is rebooting her camera — try again in a moment. " +
        "(Underlying model error: " +
        (e?.message || "unknown") +
        ")",
    });
  }
};
