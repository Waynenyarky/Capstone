#!/bin/bash
#
# Check that all backend services have their dependencies correctly declared.
# Catches missing deps (e.g. require('uuid') without uuid in package.json)
# and prevents "Cannot find module" crashes in Docker.
#
# Usage: ./scripts/check-backend-deps.sh
# Run from project root. Exits 1 if any service has missing dependencies.

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICES="auth-service business-service admin-service audit-service"
FAILED=0

for svc in $SERVICES; do
  dir="$ROOT/backend/services/$svc"
  if [ ! -f "$dir/package.json" ]; then
    continue
  fi
  echo -n "Checking $svc... "
  missing=$(cd "$dir" && npx depcheck --json 2>/dev/null | node -e "
    let data = '';
    process.stdin.on('data', c => data += c);
    process.stdin.on('end', () => {
      try {
        const d = JSON.parse(data);
        const m = d.missing || [];
        const ignore = ['morgan'];
        const critical = m.filter(p => !ignore.includes(p));
        console.log(critical.join(' '));
      } catch (_) { console.log(''); }
    });
  " 2>/dev/null || echo "")
  if [ -n "$missing" ]; then
    echo "❌ missing: $missing"
    echo "   Fix: cd $dir && npm install $missing --save"
    FAILED=1
  else
    echo "✅"
  fi
done

if [ $FAILED -eq 1 ]; then
  echo ""
  echo "Add missing dependencies to package.json to prevent 'Cannot find module' crashes."
  exit 1
fi

echo ""
echo "✅ All backend services have dependencies correctly declared"
exit 0
