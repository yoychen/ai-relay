#!/usr/bin/env bash
set -e

ENTRY="dist/index.js"
SHEBANG="#!/usr/bin/env node"

# 如果第一行不是 shebang 才加
if [ "$(head -1 "$ENTRY")" != "$SHEBANG" ]; then
  tmp=$(mktemp)
  echo "$SHEBANG" | cat - "$ENTRY" > "$tmp"
  mv "$tmp" "$ENTRY"
fi

chmod +x "$ENTRY"
echo "✅ shebang injected: $ENTRY"
