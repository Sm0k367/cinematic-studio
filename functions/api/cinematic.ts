/**
 * Epic Tech AI Cinematic Studio
 * Clean, reliable multi-agent cinematic image generation
 * 
 * POST /api/cinematic
 * Body: { prompt: string }
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
      return new Response(JSON.stringify({ error: "Prompt is too short" }), { status: 400 });
    }

    // ============================================
    // 1. WRITER AGENT (Llama 3.3 70B)
    // ============================================
    const writerResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct", {
      messages: [
        {
          role: "system",
          content: "You are a world-class Hollywood screenwriter. Write vivid, cinematic scene descriptions.",
        },
        {
          role: "user",
          content: `Write a rich, detailed cinematic scene description based on this idea: "${userPrompt}". 
          Focus on lighting, mood, camera angle, and visual atmosphere. Keep it under 80 words.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.75,
    });

    const writerText = writerResponse?.response || "A powerful cinematic scene unfolds.";

    // ============================================
    // 2. DIRECTOR AGENT (same model)
    // ============================================
    const directorResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct", {
      messages: [
        {
          role: "system",
          content: "You are an award-winning film director. Turn scene descriptions into optimized prompts for FLUX image generation.",
        },
        {
          role: "user",
          content: `Transform this scene into a highly detailed, cinematic prompt for an AI image generator:\n\n"${writerText}"\n\nAdd specific lens, lighting, color grade, and filmic details. Maximum 70 words.`,
        },
      ],
      max_tokens: 250,
      temperature: 0.65,
    });

    const directorText = directorResponse?.response || writerText;

    const finalImagePrompt = `${directorText}, cinematic masterpiece, film still, highly detailed, professional photography, dramatic lighting`;

    // ============================================
    // 3. EDITOR - Generate with FLUX.1-schnell (reliable & fast)
    // ============================================
    const imageResponse = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt: finalImagePrompt,
    });

    const imageBase64 = imageResponse?.image || imageResponse?.result?.image;

    if (!imageBase64) {
      throw new Error("FLUX did not return an image");
    }

    // ============================================
    // 4. Store in R2 (optional)
    // ============================================
    let imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    if (env.MEDIA) {
      try {
        const buffer = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
        const id = `cinematic/${Date.now()}.jpg`;
        await env.MEDIA.put(id, buffer, {
          httpMetadata: { contentType: "image/jpeg" },
        });
        // You can replace this with your actual R2 public domain later
        imageUrl = `https://cinematic-ai-media.r2.dev/${id}`;
      } catch (r2Err) {
        console.warn("R2 upload failed, using inline base64 instead");
      }
    }

    // ============================================
    // Return clean result
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        generation: {
          id: Date.now().toString(),
          prompt: userPrompt,
          enhancedPrompt: directorText,
          imageUrl: imageUrl,
          agents: {
            writer: writerText,
            director: directorText,
          },
          model: "FLUX.1-schnell + Llama-3.3-70B",
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Cinematic pipeline error:", error);
    return new Response(
      JSON.stringify({
        error: "Generation pipeline failed",
        details: error.message || "Unknown error",
      }),
      { status: 500 }
    );
  }
}

export const onRequest = onRequestPost;
