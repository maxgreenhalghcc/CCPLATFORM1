#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
BAR_SLUG="${2:-sample-bar}"

if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <BASE_URL> [BAR_SLUG]"
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for smoke checks" >&2
  exit 3
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for smoke checks" >&2
  exit 3
fi

echo "== Smoke: $BASE_URL (bar: $BAR_SLUG)"

api_health="$(curl -fsSL "$BASE_URL/health" || true)"
if [[ -z "$api_health" ]]; then
  echo "API health response empty" >&2
  exit 1
fi

echo "API /health: $api_health"

echo "$api_health" | jq -e '.status == "ok"' >/dev/null || {
  echo "API health status not ok" >&2
  exit 1
}

echo "$api_health" | jq -e 'has("version") and .version != ""' >/dev/null || {
  echo "API health missing version" >&2
  exit 1
}

echo "$api_health" | jq -e 'has("commit") and .commit != ""' >/dev/null || {
  echo "API health missing commit" >&2
  exit 1
}

bar_json="$(curl -fsSL "$BASE_URL/bars/$BAR_SLUG/settings" || true)"
if [[ -z "$bar_json" ]]; then
  echo "Bar settings response empty" >&2
  exit 1
fi

echo "Bar settings: $(echo "$bar_json" | jq -c '{slug, name}')"

echo "$bar_json" | jq -e --arg slug "$BAR_SLUG" '.slug == $slug' >/dev/null || {
  echo "Bar slug mismatch" >&2
  exit 1
}

echo "$bar_json" | jq -e 'has("theme") and (.theme | type == "object")' >/dev/null || {
  echo "Bar theme missing" >&2
  exit 1
}

echo "✅ Smoke OK"
