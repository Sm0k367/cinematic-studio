// Simple direct generation endpoint (used by some flows)
export async function onRequestPost(context: EventContext<any>) {
  const { request, env } = context;
  const body = await request.json();

  // For now delegate to main cinematic pipeline logic
  // In future this can be a lighter direct FLUX call
  return Response.json({ message: "Use /api/cinematic for full multi-agent experience", body });
}
