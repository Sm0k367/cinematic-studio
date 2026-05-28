/**
 * Epic Tech AI Cinematic Studio - Reliable Backend
 * Uses only stable, available Cloudflare models
 */

interface Env {
  AI: any;
  MEDIA?: R2Bucket;
}

export async function onRequestPost(context: EventContext<Env>) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const userPrompt = body.prompt?.trim();

    if (!userPrompt || userPrompt.length < 5) {
      return new Response(JSON.stringify({ error: "Prompt too short" }), { status: 400 });
    }

    // 1. Writer Agent (reliable model)
    const writerResponse = await env.AI.run("@cf/moonshotai/kimi-k2.6", {
      messages: [
        { role: "system", content: "You are a world-class cinematic screenwriter." },
        { role: "user", content: `Write a vivid, cinematic scene description for this idea: "${userPrompt}". Keep it under 60 words, focus on atmosphere, lighting and mood.` }
      ],
      max_tokens: 200,
      temperature: 0.75,
    });
    const writerText = writerResponse?.response || "A powerful cinematic scene unfolds.";

    // 2. Director Agent
    const directorResponse = await env.AI.run("@cf/moonshotai/kimi-k2.6", {
      messages: [
        { role: "system", content: "You are an award-winning cinematographer." },
        { role: "user", content: `Turn this scene into a highly optimized prompt for FLUX image generation:\n\n${writerText}\n\nAdd lens, lighting, color grade and cinematic details. Max 65 words.` }
      ],
      max_tokens: 180,
      temperature: 0.65,
    });
    const directorText = directorResponse?.response || writerText;

    const finalPrompt = `${directorText}, cinematic masterpiece, film still, dramatic lighting, highly detailed, professional photography`;

    // 3. Image Generation (most reliable model)
    const imageResponse = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt: finalPrompt,
    });

    const imageBase64 = imageResponse?.image || imageResponse?.result?.image;
    if (!imageBase64) throw new Error("Image generation failed");

    // 4. Store in R2
    let imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    if (env.MEDIA) {
      try {
        const buffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
        const id = `cinematic/${Date.now()}.jpg`;
        await env.MEDIA.put(id, buffer, { httpMetadata: { contentType: "image/jpeg" } });
        imageUrl = `https://cinematic-ai-media.r2.dev/${id}`;
      } catch (e) {}
    }

    return new Response(JSON.stringify({
      success: true,
      generation: {
        id: Date.now().toString(),
        prompt: userPrompt,
        imageUrl,
        agents: { writer: writerText, director: directorText },
        model: "Kimi K2.6 + FLUX.1-schnell"
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Pipeline error:", error);
    return new Response(JSON.stringify({
      error: "Generation failed",
      details: error.message
    }), { status: 500 });
  }
}

export const onRequest = onRequestPost;
