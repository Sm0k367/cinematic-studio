// Gallery — list recent generations from KV or R2 metadata
export async function onRequestGet(context: EventContext<any>) {
  const { env } = context;
  
  // In production you would list keys with prefix "gen:" from KV
  // For now return a helpful message
  return Response.json({
    message: "Gallery powered by R2 + KV. Use the /api/cinematic endpoint to create new frames.",
    demo: true
  });
}
