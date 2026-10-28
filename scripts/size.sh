#!/bin/sh
# Size guard for what a visitor downloads (DESIGN.md §Size). Raising it needs a reason there.
LIMIT=76000
cd "$(dirname "$0")/.." || exit 2
TOTAL=$(cat index.html playground.css playground.js duo-flags.js | wc -c | tr -d ' ')
echo "page: $TOTAL bytes (limit $LIMIT)"
[ "$TOTAL" -le "$LIMIT" ] || { echo "over the size guard"; exit 1; }
