#!/usr/bin/env bash
# Pull latest code, rebuild, and restart the API on the server.
# Usage (on the Lightsail instance):  bash deploy/redeploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."   # repo/school-erp-api

echo "→ Pulling latest code"
git pull

echo "→ Installing dependencies"
npm ci

echo "→ Building"
npm run build

echo "→ Restarting PM2 process"
pm2 restart quilo-api || pm2 start ecosystem.config.js
pm2 save

echo "✓ Deployed. Health check:"
sleep 2
curl -s http://localhost:7002/health || echo "(health check failed — check: pm2 logs quilo-api)"
