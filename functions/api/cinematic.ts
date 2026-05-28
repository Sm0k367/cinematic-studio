/**
 * Epic Tech AI Cinematic Studio — Universal Media Engine
 * 
 * POST /api/cinematic
 * Body: { prompt: string, mode?: 'auto'|'image'|'video'|'audio'|'text' }
 * 
 * Smart multi-agent router that supports ANY media type:
 * - Image (Flux + Leonardo-class quality)
 * - Video (partner text-to-video + image-to-video)
 * - Audio / Voice (Inworld + Deepgram TTS)
 * - Text / Script / Storyboard
 * 
 * Always uses the highest quality models available on Cloudflare Workers AI.
 */

interface Env {
  AI: any;                    // Cloudflare AI binding
  MEDIA?: R2Bucket;           // R2 for permanent public assets (binding name "MEDIA" in wrangler.toml)
  KV?: KVNamespace;
  VECTORIZE_INDEX?: VectorizeIndex;   // Optional - not available on free plan
}

interface CinematicRequest {
  prompt: string;
  mode?: 'auto' | 'image' | 'video' | 'audio' | 'text';
  userId?: string;
}

export async function onRequestPost(context: EventContext<Env>) {
  const { request, env } = context;
  
  try {
    const body: CinematicRequest = await request.json();
    const { prompt } = body;

    if (!env.AI) {
      return new Response(JSON.stringify({ 
        error: 'AI binding not configured',
        details: 'The Workers AI binding is missing in this Cloudflare Pages project.'
      }), { status: 500 });
    }

    if (!prompt || prompt.trim().length < 8) {
      return new Response(JSON.stringify({ error: 'Prompt too short' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestedMode = body.mode || 'auto';

    // =====================================================
    // 0. SMART INTENT CLASSIFIER + MEDIA ROUTER (using best available LLM)
    // =====================================================
    const classifierPrompt = `You are the creative director of a world-class AI media studio.

User request: "${prompt}"
Requested mode: ${requestedMode}

Decide the best output medium and produce an optimized prompt.

Respond ONLY with valid JSON in this exact format:
{
  "mediaType": "image" | "video" | "audio" | "text",
  "optimizedPrompt": "the best prompt for the chosen model",
  "reason": "one sentence why this medium"
}

Rules:
- If the user wants motion, camera movement, or "video", choose "video".
- If they want voice, narration, song, or sound, choose "audio".
- If they want a script, story, or text only, choose "text".
- Default to stunning "image" for most visual requests.
- Always make the optimizedPrompt extremely detailed and model-specific.`;

    const classifierRes = await env.AI.run('@cf/moonshotai/kimi-k2.6', {
      messages: [
        { role: 'system', content: 'You are an expert media generation router. Output only clean JSON.' },
        { role: 'user', content: classifierPrompt }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    let classification: any = { mediaType: 'image', optimizedPrompt: prompt, reason: 'Default visual' };
    try {
      const raw = classifierRes?.response || classifierRes?.result || '{}';
      classification = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      // fallback
      classification = { mediaType: 'image', optimizedPrompt: prompt, reason: 'Visual request' };
    }

    const mediaType = classification.mediaType;
    const optimizedPrompt = classification.optimizedPrompt;

    // =====================================================
    // 1. MULTI-AGENT CREATIVE DIRECTION (always run for quality)
    // =====================================================
    const directorSystem = 'You are an award-winning director who prepares perfect prompts for any media type.';

    const directionRes = await env.AI.run('@cf/moonshotai/kimi-k2.6', {
      messages: [
        { role: 'system', content: directorSystem },
        { role: 'user', content: `Take this request and create the ultimate prompt for a ${mediaType} generation model:\n\n${optimizedPrompt}\n\nMake it extremely detailed and optimized for the best possible output.` }
      ],
      max_tokens: 350,
      temperature: 0.7,
    });

    const finalPromptForModel = directionRes?.response || directionRes?.result || optimizedPrompt;

    // =====================================================
    // 2. ROUTE TO THE CORRECT HIGH-QUALITY MODEL
    // =====================================================
    let result: any = {};
    let mediaUrl = '';
    let mediaBase64 = '';
    let extraMeta: any = {};

    if (mediaType === 'image') {
      try {
        // Highest quality image — Flux (latest stable on CF)
        const imgRes = await env.AI.run('@cf/black-forest-labs/flux-1-dev', {
          prompt: finalPromptForModel + ', cinematic masterpiece, 8k, film still, professional photography',
          num_steps: 28,
          guidance: 3.5,
        });
        mediaBase64 = imgRes?.image || imgRes?.result?.image || '';
        mediaUrl = mediaBase64 ? `data:image/jpeg;base64,${mediaBase64}` : '';
      } catch (imgErr) {
        console.error('Image generation failed:', imgErr);
        throw new Error('Image model failed: ' + (imgErr.message || 'unknown error'));
      }

    } else if (mediaType === 'video') {
      // Video via best available partner model on Workers AI (proxied high-quality)
      try {
        const videoRes = await env.AI.run('@cf/alibaba/happyhorse-1.0-text2video', {
          prompt: finalPromptForModel,
        });
        mediaUrl = videoRes?.video || videoRes?.result?.video || '';
        extraMeta.videoPrompt = finalPromptForModel;
      } catch (videoErr) {
        // Graceful fallback
        mediaUrl = '';
        extraMeta.videoPrompt = finalPromptForModel;
        extraMeta.note = 'Video generation is currently in preview. Using enhanced prompt instead.';
        extraMeta.error = 'Video model call failed (may not be enabled in this account yet)';
      }

    } else if (mediaType === 'audio') {
      try {
        // Voice / Audio — Inworld TTS
        const ttsRes = await env.AI.run('@cf/inworld/tts-2', {
          text: finalPromptForModel.substring(0, 500), // safety limit
        });
        mediaBase64 = ttsRes?.audio || ttsRes?.result?.audio || '';
        mediaUrl = mediaBase64 ? `data:audio/wav;base64,${mediaBase64}` : '';
      } catch (audioErr) {
        console.error('Audio generation failed:', audioErr);
        // Graceful fallback to text
        result.textOutput = `Voice generation failed. Here is the script instead:\n\n${finalPromptForModel}`;
        extraMeta.note = 'Audio model call failed — returned as text instead.';
      }

    } else {
      // Pure text / script / storyboard — just return the rich output
      result.textOutput = finalPromptForModel;
    }

    // Store in R2 when possible (for images/video)
    const finalAssetId = `${mediaType}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    if (mediaBase64 && env.MEDIA) {
      try {
        const buffer = Uint8Array.from(atob(mediaBase64), c => c.charCodeAt(0));
        const contentType = mediaType === 'audio' ? 'audio/wav' : 'image/jpeg';
        await env.MEDIA.put(finalAssetId, buffer, {
          httpMetadata: { contentType },
        });
      } catch (e) { /* graceful */ }
    }

    // =====================================================
    // FINAL RESPONSE — Unified for any media type
    // =====================================================
    const assetId = finalAssetId || `gen-${Date.now()}`;
    const finalMediaUrl = mediaUrl || (mediaBase64 ? `data:${mediaType === 'audio' ? 'audio/wav' : 'image/jpeg'};base64,${mediaBase64}` : '');

    return new Response(JSON.stringify({
      success: true,
      generation: {
        id: assetId,
        prompt,
        mediaType,
        mediaUrl: finalMediaUrl,
        mediaBase64,
        optimizedPrompt: finalPromptForModel,
        classification,
        agents: {
          director: finalPromptForModel.substring(0, 280) + '...',
        },
        metadata: {
          model: mediaType === 'video' ? 'Partner Video Models (Vidu/HappyHorse)' : 
                 mediaType === 'audio' ? 'Inworld TTS-2' : 
                 'Flux + Kimi K2.6',
          style: 'Cinematic',
          ...extraMeta
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
