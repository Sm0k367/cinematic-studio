/**
 * Epic Tech AI Cinematic Studio
 * Clean + Reliable Multi-Agent Cinematic Generation
 */

interface Env {
  AI: any;
  MEDIA?: R2Bucket;
  KV?: KVNamespace; // optional for user history
}

export async function onRequestPost(context: EventContext<Env>) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const userPrompt = body.prompt?.trim();
    const isVariation = body.variation === true;
    const isUpscale = body.upscale === true;
    const userId = body.userId || 'anonymous';

    if (!userPrompt || userPrompt.length < 5) {
      return new Response(JSON.stringify({ error: "Prompt is too short" }), { status: 400 });
    }

    // 1. Writer Agent
    const writerRes = await env.AI.run("@cf/meta/llama-3.3-70b-instruct", {
      messages: [
        { role: "system", content: "You are an elite Hollywood screenwriter. Write vivid cinematic scene descriptions." },
        { role: "user", content: `Create a rich, detailed cinematic scene based on: "${userPrompt}". Focus on mood, lighting, camera, and atmosphere. Max 70 words.` }
      ],
      max_tokens: 280,
      temperature: 0.78,
    });
    const writerText = writerRes?.response || "A powerful cinematic scene unfolds with dramatic tension.";

    // 2. Director Agent
    const directorRes = await env.AI.run("@cf/meta/llama-3.3-70b-instruct", {
      messages: [
        { role: "system", content: "You are a master cinematographer. Turn descriptions into perfect FLUX image prompts." },
        { role: "user", content: `Convert this into an optimized, highly detailed prompt for FLUX:\n\n${writerText}\n\nAdd lens, lighting, color grade, and filmic details. Max 65 words.` }
      ],
      max_tokens: 220,
      temperature: 0.65,
    });
    const directorText = directorRes?.response || writerText;

    let finalPrompt = `${directorText}, cinematic masterpiece, film still, dramatic lighting, highly detailed, professional photography`;

    if (isVariation) {
      finalPrompt += ", alternative composition, new camera angle, different mood and lighting";
    }
    if (isUpscale) {
      finalPrompt += ", ultra high resolution, 8k, extremely sharp, intricate details, masterpiece quality";
    }

    // 3. Image Generation - Using the most reliable model
    const imageRes = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt: finalPrompt,
    });

    const imageBase64 = imageRes?.image || imageRes?.result?.image;
    if (!imageBase64) throw new Error("Image generation failed");

    // 4. Store in R2 (optional but recommended)
    let imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    const genId = Date.now().toString();

    if (env.MEDIA) {
      try {
        const buffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
        const id = `cinematic/${genId}.jpg`;
        await env.MEDIA.put(id, buffer, {
          httpMetadata: { contentType: "image/jpeg" },
        });
        imageUrl = `https://cinematic-ai-media.r2.dev/${id}`;
      } catch (e) {
        console.warn("R2 upload skipped, using inline image");
      }
    }

    // 5. Save to KV for user history (if bound)
    if (env.KV) {
      try {
        const historyKey = `user:${userId}:history`;
        const existing = await env.KV.get(historyKey, { type: 'json' }) || [];
        const newEntry = {
          id: genId,
          prompt: userPrompt,
          imageUrl,
          created: Date.now(),
        };
        const updated = [newEntry, ...existing].slice(0, 50); // keep last 50
        await env.KV.put(historyKey, JSON.stringify(updated));
      } catch (e) {
        console.warn("KV history save failed");
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generation: {
        id: genId,
        prompt: userPrompt,
        enhancedPrompt: directorText,
        imageUrl,
        agents: {
          writer: writerText,
          director: directorText,
        },
        model: "Llama-3.3-70B + FLUX.1-schnell",
        userId,
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Pipeline error:", error);
    return new Response(JSON.stringify({
      error: "Generation pipeline failed",
      details: error.message
    }), { status: 500 });
  }
}

export const onRequest = onRequestPost;
