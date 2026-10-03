#!/bin/bash
set -e
LATEST_ZIP=$(ls -t ~/Downloads/vitaflex-intelligence-corp*.zip 2>/dev/null | head -1)
if [ -z "$LATEST_ZIP" ]; then
  echo "Error: vitaflex-intelligence-corp.zip not found in ~/Downloads"
  exit 1
fi
echo "Extracting $LATEST_ZIP..."
unzip -o "$LATEST_ZIP" -d .
git add -A
git commit -m "fix: resolve satellite radar map dark screen" || true
npx wrangler pages deploy . --project-name=vitaflex-intelligence-corp --commit-dirty=true
git push origin main
echo "Deployment Complete!"
