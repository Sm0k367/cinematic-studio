/**
 * Simple Chat Assistant for prompt refinement
 * POST /api/chat
 */

export async function onRequestPost(context: EventContext<any>) {
  const { request, env } = context;

  try {
    const { message } = await request.json();

    const res = await env.AI.run("@cf/meta/llama-3.3-70b-instruct", {
      messages: [
        {
          role: "system",
          content: "You are a helpful cinematic prompt engineer. Help users improve their prompts for AI image generation. Be concise and specific."
        },
        { role: "user", content: message }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return new Response(JSON.stringify({
      response: res?.response || "Try adding more details about lighting, camera angle, and mood."
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ response: "Sorry, the assistant is temporarily unavailable." }), { status: 500 });
  }
}

export const onRequest = onRequestPost;
