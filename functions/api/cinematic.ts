/**
 * Epic Tech AI Cinematic Studio
 * Reliable, premium cinematic image generation
 * Uses only stable Cloudflare models
 */

interface Env {
  AI: any;
  MEDIA?: R2Bucket;
}

export async function onRequestPost(context: EventContext<Env>) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const userPrompt = (body.prompt || '').trim();

    if (!userPrompt || userPrompt.length < 8) {
      return new Response(JSON.stringify({ error: "Please enter a more detailed prompt" }), { status: 400 });
    }

    // Light cinematic enhancement (no heavy LLM to avoid model errors)
    const enhancedPrompt = `${userPrompt}, cinematic masterpiece, film still, dramatic lighting, highly detailed, professional photography, anamorphic lens, moody atmosphere`;

    // Generate with the most reliable image model
    const imageResponse = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt: enhancedPrompt,
    });

    const imageBase64 = imageResponse?.image || imageResponse?.result?.image;

    if (!imageBase64) {
      throw new Error("Image generation failed");
    }

    // Store in R2 if available
    let imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    if (env.MEDIA) {
      try {
        const buffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
        const id = `cinematic/${Date.now()}.jpg`;
        await env.MEDIA.put(id, buffer, {
          httpMetadata: { contentType: "image/jpeg" },
        });
        imageUrl = `https://cinematic-ai-media.r2.dev/${id}`;
      } catch (e) {
        console.warn("R2 upload skipped");
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generation: {
        id: Date.now().toString(),
        prompt: userPrompt,
        imageUrl,
        model: "FLUX.1-schnell",
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Generation error:", error);
    return new Response(JSON.stringify({
      error: "Generation failed",
      details: error.message || "Please try a different prompt"
    }), { status: 500 });
  }
}

export const onRequest = onRequestPost;
