/**
 * Epic Tech AI Cinematic Studio
 * Main Multi-Agent Cinematic Pipeline
 * 
 * POST /api/cinematic
 * Body: { prompt: string, userId?: string }
 * 
 * Orchestrates:
 * 1. WRITER (Llama 3.3 70B) — rich scene script
 * 2. DIRECTOR — cinematic prompt engineering
 * 3. EDITOR — Highest quality FLUX.1-dev generation + R2 upload (Vectorize memory optional)
 */

interface Env {
  AI: any;                    // Cloudflare AI binding
  MEDIA?: R2Bucket;           // R2 for permanent public assets (binding name "MEDIA" in wrangler.toml)
  KV?: KVNamespace;
  VECTORIZE_INDEX?: VectorizeIndex;   // Optional - not available on free plan
}

interface CinematicRequest {
  prompt: string;
  userId?: string;
}

export async function onRequestPost(context: EventContext<Env>) {
  const { request, env } = context;
  
  try {
    const body: CinematicRequest = await request.json();
    const { prompt } = body;

    if (!prompt || prompt.trim().length < 8) {
      return new Response(JSON.stringify({ error: 'Prompt too short' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // =====================================================
    // 1. WRITER AGENT — Llama 3.3
    // =====================================================
    const writerPrompt = `You are an elite Hollywood screenwriter and visual storyteller working for a world-class cinematic AI studio.

User vision: "${prompt}"

Write a rich, highly-detailed cinematic scene description (3-5 sentences). Focus on:
- Emotional core and narrative weight
- Specific visual texture, lighting, time of day, weather
- Character micro-expressions or environmental storytelling
- Cinematic references without copying (think Villeneuve, Deakins, Nolan, Refn)

Return ONLY the scene prose. No intro, no labels.`;

    const writerResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
      messages: [
        { role: 'system', content: 'You are a master cinematic writer. Be vivid, concise, and emotionally precise.' },
        { role: 'user', content: writerPrompt }
      ],
      max_tokens: 420,
      temperature: 0.78,
    });

    const writerText = writerResponse?.response || writerResponse?.result || 'A hauntingly beautiful scene unfolds.';

    // =====================================================
    // 2. DIRECTOR AGENT — Cinematic Enhancement
    // =====================================================
    const directorPrompt = `You are an award-winning film director and cinematographer.

Take this scene description and transform it into an ultra-cinematic prompt optimized for FLUX.1 image generation:

SCENE: ${writerText}

Enhance with:
- Specific lens (35mm, anamorphic, 70mm IMAX)
- Lighting approach (volumetric god rays, neon practicals, chiaroscuro)
- Camera angle & movement implication
- Color grade direction (teal-orange, cyberpunk magenta-teal, etc.)
- Mood keywords (melancholic, electric, oppressive grandeur...)

Return a SINGLE dense, powerful paragraph ready for an image model. Maximum 85 words.`;

    const directorResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
      messages: [
        { role: 'system', content: 'You are a master cinematographer. Turn prose into visually perfect prompts.' },
        { role: 'user', content: directorPrompt }
      ],
      max_tokens: 280,
      temperature: 0.65,
    });

    const directorText = directorResponse?.response || directorResponse?.result || writerText;

    // Final visual prompt for FLUX
    const finalVisualPrompt = `${directorText} Highly detailed, cinematic masterpiece, 8k, film still, professional photography, sharp focus.`;
    // =====================================================
    // 3. EDITOR — Generate with highest quality FLUX.1-dev
    // =====================================================

    // Using the highest quality image model available
    const fluxResponse = await env.AI.run('@cf/black-forest-labs/flux-1-dev', {
      prompt: finalVisualPrompt,
      num_steps: 28,          // Higher quality settings
      guidance: 3.5,
    });

    // The response contains image as base64 or blob depending on version
    let imageBase64: string;
    if (fluxResponse?.image) {
      imageBase64 = fluxResponse.image;
    } else if (fluxResponse?.result?.image) {
      imageBase64 = fluxResponse.result.image;
    } else {
      // Fallback: we'll use a placeholder for now (in production this should never happen)
      throw new Error('FLUX generation failed to return image data');
    }

    // =====================================================
    // 4. STORE IN R2 (optional - graceful if binding missing or fails)
    // =====================================================
    const imageId = `cinematic/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
    let publicImageUrl = `data:image/jpeg;base64,${imageBase64}`; // Default to inline for reliability

    if (env.MEDIA) {
      try {
        const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
        await env.MEDIA.put(imageId, imageBuffer, {
          httpMetadata: { contentType: 'image/jpeg' },
          customMetadata: {
            prompt: prompt.substring(0, 500),
            generatedAt: new Date().toISOString(),
          }
        });
        // If you configure a public R2 domain, replace this with your actual public URL pattern
        publicImageUrl = `https://cinematic-ai-media.r2.dev/${imageId}`; // Update to your real public R2 domain when ready
      } catch (r2Err) {
        console.warn('R2 upload skipped or failed (using inline base64 for display):', r2Err);
      }
    }

    // =====================================================
    // 5. INDEX IN VECTORIZE (Memory Vault) - optional
    // =====================================================
    if (env.VECTORIZE_INDEX) {
      try {
        const embeddingPrompt = `${prompt} — ${writerText}`;
        const embeddingResp = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: [embeddingPrompt]
        });
        const embedding = embeddingResp?.data?.[0] || embeddingResp?.result?.data?.[0];
        if (embedding) {
          await env.VECTORIZE_INDEX.upsert([{
            id: imageId,
            values: embedding,
            metadata: {
              prompt: prompt,
              imageUrl: publicImageUrl,
              created: Date.now(),
              type: 'cinematic-generation'
            }
          }]);
        }
      } catch (e) {
        console.log("Vectorize indexing skipped (not available on current plan)");
      }
    }

    // =====================================================
    // 6. STORE METADATA IN KV (optional)
    // =====================================================
    if (env.KV) {
      try {
        const metadata = {
          id: imageId,
          prompt,
          writer: writerText,
          director: directorText,
          imageUrl: publicImageUrl,
          created: new Date().toISOString(),
          model: 'flux-1-dev + llama-3.3-70b',
        };
        await env.KV.put(`gen:${imageId}`, JSON.stringify(metadata), {
          expirationTtl: 60 * 60 * 24 * 365,
        });
      } catch (kvErr) {
        console.warn('KV metadata store skipped:', kvErr);
      }
    }

    // Return the beautiful result to the frontend
    // Always include base64 so the frontend can display reliably even without public R2 domain
    return new Response(JSON.stringify({
      success: true,
      generation: {
        id: imageId,
        prompt,
        imageUrl: publicImageUrl,
        imageBase64: imageBase64,   // NEW: reliable inline display data
        agents: {
          writer: writerText,
          director: directorText,
        },
        metadata: {
            model: 'FLUX.1-dev + Llama-3.3-70B',
          style: 'Cinematic',
        }
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error: any) {
    console.error('Cinematic pipeline error:', error);
    return new Response(JSON.stringify({ 
      error: 'Generation pipeline failed', 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequest = onRequestPost; // Pages Functions convention
