#!/bin/bash
set -e

echo "🚀 Deploying Epic Tech AI Cinematic Studio..."
echo "Project: cinematic-studio"
echo ""

wrangler pages deploy . --project-name=cinematic-studio
