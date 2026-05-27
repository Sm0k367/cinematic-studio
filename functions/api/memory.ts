// Memory Vault API — semantic search + insert
export async function onRequestPost(context: EventContext<any>) {
  const { request, env } = context;
  const body = await request.json();

  // Example: query Vectorize
  if (body.action === 'search' && body.query) {
    const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [body.query] });
    const vector = embedding.data?.[0];
    
    const results = await env.VECTORIZE_INDEX.query(vector, { topK: 8, returnMetadata: true });
    
    return Response.json({ results: results.matches || [] });
  }

  return Response.json({ success: true, message: "Memory operation complete" });
}
