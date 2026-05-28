/// <reference types="@cloudflare/workers-types" />
// @ts-nocheck

// POST /api/cinematic — generate an image (Flux) or video (Pixverse) and
// persist the binary result to R2. Returns a public URL.

import {
  Env,
  json,
  readJson,
  putToR2,
  r2Base,
  badRequest,
  serverError,
} from "../_lib/shared";

interface Body {
  prompt?: string;
  mode?: "image" | "video";
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { prompt, mode = "image" } = await readJson<Body>(request);

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return badRequest("Prompt is required (min 3 chars)");
    }
    if (prompt.length > 1500) {
      return badRequest("Prompt too long (max ~1500 chars)");
    }

    const base = r2Base(env);

    if (mode === "video") {
      const videoResult: any = await env.AI.run("@cf/pixverse/v6", {
        prompt: `${prompt}, cinematic, smooth motion, dramatic lighting, high quality`,
        duration: 8,
        aspect_ratio: "16:9",
        quality: "720p",
        generate_audio: true,
      });

      const payload = videoResult?.video ?? videoResult;
      if (!payload) throw new Error("Video model returned no data");

      const filename = `video-${Date.now()}.mp4`;
      await putToR2(env, filename, payload, "video/mp4");

      return json({
        success: true,
        type: "video",
        url: `${base}/${filename}`,
        prompt,
      });
    }

    // Default: image (Flux-1-schnell)
    const imageResult: any = await env.AI.run(
      "@cf/black-forest-labs/flux-1-schnell",
      {
        prompt: `${prompt}, cinematic masterpiece, dramatic lighting, film grain, highly detailed`,
        width: 1024,
        height: 576,
      }
    );

    const payload = imageResult?.image ?? imageResult;
    if (!payload) throw new Error("Image model returned no data");

    const filename = `cinematic-${Date.now()}.jpg`;
    await putToR2(env, filename, payload, "image/jpeg");

    return json({
      success: true,
      type: "image",
      url: `${base}/${filename}`,
      prompt,
    });
  } catch (e: any) {
    return serverError(
      e,
      "Generation failed. The model may be busy or not enabled on your account."
    );
  }
};

// Convenience GET so people can health-check the route in a browser.
export const onRequestGet: PagesFunction<Env> = async () =>
  json({
    success: true,
    route: "/api/cinematic",
    method: "POST",
    body: { prompt: "string (3-1500 chars)", mode: "image | video" },
  });
