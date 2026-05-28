#!/usr/bin/env bash
set -euo pipefail

echo "🎬  Epic Tech AI Cinematic Studio"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# --- Pre-flight checks --------------------------------------------------------

if ! command -v wrangler >/dev/null 2>&1; then
  if command -v npx >/dev/null 2>&1; then
    WRANGLER="npx --yes wrangler@latest"
    echo "ℹ️  Using 'npx wrangler' (no global install detected)."
  else
    echo "❌  wrangler is not installed and npx is unavailable."
    echo "    Install with:  npm install -g wrangler"
    exit 1
  fi
else
  WRANGLER="wrangler"
fi

if grep -qE "YOUR_KV_NAMESPACE_ID|YOUR_REAL_KV_ID_HERE" wrangler.toml 2>/dev/null; then
  echo "❌  Placeholder KV id found in wrangler.toml."
  echo "    Create a KV namespace and paste its id under [[kv_namespaces]]:"
  echo "      wrangler kv:namespace create CINEMATIC_KV"
  exit 1
fi

if grep -q "pub-YOUR-PUB-URL-HERE" wrangler.toml 2>/dev/null; then
  echo "⚠️  PUBLIC_R2_BASE still has a placeholder. Update it under [vars] before deploying."
  echo "    Dashboard → R2 → cinematic-ai-media → Settings → Public Development URL"
  exit 1
fi

PROJECT_NAME="${PAGES_PROJECT:-epic-tech-ai-cinematic-studio}"
BRANCH="${PAGES_BRANCH:-main}"

echo "Project: $PROJECT_NAME"
echo "Branch:  $BRANCH"
echo ""
echo "Deploying to Cloudflare Pages..."
echo ""

# --- Deploy -------------------------------------------------------------------
# Pages will pick up:
#   - static assets from the repo root (index.html, etc.)
#   - functions/ for Pages Functions
#   - wrangler.toml for bindings + vars

$WRANGLER pages deploy . \
  --project-name="$PROJECT_NAME" \
  --branch="$BRANCH" \
  --commit-dirty=true

echo ""
echo "✅  Deploy complete."
echo ""
echo "Post-deploy checklist:"
echo "  • Open your Pages URL and try generating an image (most reliable)."
echo "  • Verify R2 bucket 'cinematic-ai-media' has Public Development URL enabled,"
echo "    OR a custom domain attached. PUBLIC_R2_BASE in wrangler.toml must match it."
echo "  • Confirm Workers AI is enabled on your account."
echo "  • If chat or video 500s, the model isn't enabled for your account yet."
echo ""
