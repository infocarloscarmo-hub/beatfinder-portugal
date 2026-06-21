#!/usr/bin/env bash
# Testa o endpoint de ingestão localmente.
# Uso: INGEST_API_KEY=xxx ./scripts/test-ingest.sh
set -e
: "${BASE_URL:=http://localhost:3000}"
: "${INGEST_API_KEY:?Define INGEST_API_KEY}"
curl -sS -X POST "$BASE_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $INGEST_API_KEY" \
  --data @scripts/n8n-sample-payload.json | jq .
