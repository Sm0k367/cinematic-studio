#!/bin/bash
set -e

echo "🎬 Epic Tech AI Cinematic Studio"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Deploying to Cloudflare Pages..."
echo ""

# Check for KV ID in wrangler.toml
if grep -q "YOUR_REAL_KV_ID_HERE" wrangler.toml; then
  echo "⚠️  WARNING: You still have the placeholder KV ID in wrangler.toml"
  echo "   Edit wrangler.toml and paste your real KV namespace ID before deploying."
  echo ""
fi

wrangler pages deploy . --project-name=epic-tech-ai-cinematic-studio

echo ""
echo "✅ Deploy complete!"
echo "   Visit your Pages URL and enjoy the studio."
echo ""
echo "Next steps if you see errors:"
echo "  • Make sure your R2 bucket 'epic-ai-media' is public"
echo "  • Confirm Workers AI is enabled on your account"
echo "  • Check that the KV namespace ID is correct"

