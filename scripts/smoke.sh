#!/usr/bin/env bash
set -euo pipefail

API_URL=${API_URL:-"http://localhost:4000/v1"}
RECIPE_URL=${RECIPE_URL:-"http://localhost:5000"}
WEB_URL=${WEB_URL:-"http://localhost:3000"}
BAR_SLUG=${BAR_SLUG:-"demo-bar"}

newline() { printf '\n'; }

check_endpoint() {
  local name="$1"
  local url="$2"
  if curl --fail --silent --show-error "$url" >/dev/null; then
    printf '✅ %s (%s)\n' "$name" "$url"
  else
    local status=$?
    printf '❌ %s (%s)\n' "$name" "$url" >&2
    exit "$status"
  fi
}

printf 'Running smoke checks against:\n'
printf '  API_URL    = %s\n' "$API_URL"
printf '  RECIPE_URL = %s\n' "$RECIPE_URL"
printf '  WEB_URL    = %s\n' "$WEB_URL"
printf '  BAR_SLUG   = %s\n' "$BAR_SLUG"
newline

check_endpoint "API health" "$API_URL/health"
check_endpoint "Recipe health" "$RECIPE_URL/health"
check_endpoint "Web root" "$WEB_URL"

newline
printf 'Inspecting bar settings for %s...\n' "$BAR_SLUG"
settings_json=$(curl --fail --silent --show-error "$API_URL/bars/$BAR_SLUG/settings")
if python3 - "$settings_json" <<'PY' >/dev/null; then
PY
import json
import sys
settings = json.loads(sys.argv[1])
required = ["pricingPounds", "theme"]
missing = [field for field in required if field not in settings]
if missing:
    raise SystemExit(f"missing fields: {missing}")
theme = settings.get("theme", {})
if not theme:
    raise SystemExit("theme payload empty")
print("Theme ok")
PY
  printf '✅ Bar settings payload looks good\n'
else
  printf '❌ Unable to validate bar settings payload\n' >&2
  exit 1
fi

newline
cat <<INFO
Next steps:
  • Complete a quiz flow and Stripe payment using the deployed frontend.
  • Confirm the Stripe webhook updates the order to paid.
  • Use the staff dashboard to mark the order as served.
INFO
newline
printf 'Smoke checks complete.\n'
