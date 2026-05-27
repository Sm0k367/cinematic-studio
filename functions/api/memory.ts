// Memory Vault API — temporarily disabled (free plan limitation)
export async function onRequestPost(context: EventContext<any>) {
  return Response.json({ 
    success: false, 
    message: "Memory Vault is not available on the free plan. Upgrade required." 
  });
}
