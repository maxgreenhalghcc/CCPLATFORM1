#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
BAR_SLUG="${2:-sample-bar}"
EXPECTED_VERSION="${3:-}"

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

status_json="$(curl -fsSL "$BASE_URL/status" || true)"
if [[ -z "$status_json" ]]; then
  echo "API status response empty" >&2
  exit 1
fi

echo "API /status: $status_json"

echo "$status_json" | jq -e '.ok == true' >/dev/null || {
  echo "API status not ok" >&2
  exit 1
}

echo "$status_json" | jq -e 'has("version") and .version != ""' >/dev/null || {
  echo "API status missing version" >&2
  exit 1
}

if [[ -n "$EXPECTED_VERSION" ]]; then
  echo "$status_json" | jq -e --arg v "$EXPECTED_VERSION" '.version == $v' >/dev/null || {
    echo "API version \"$(echo "$status_json" | jq -r .version)\" did not match expected $EXPECTED_VERSION" >&2
    exit 1
  }
fi

echo "$status_json" | jq -e '.sentry.enabled == true' >/dev/null || {
  echo "Sentry not enabled according to /status" >&2
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
