#!/bin/bash
set -e

API_URL="${API_URL:-http://localhost:4000}"
RESULTS_DIR="tests/load/results"

if ! command -v k6 &> /dev/null; then
    echo "Error: k6 is not installed"
    echo "Install: brew install k6"
    exit 1
fi

mkdir -p "$RESULTS_DIR"

case "${1:-all}" in
    "concurrent"|"users"|"load")
        k6 run --env API_URL="$API_URL" tests/load/api-load.test.js
        ;;
    "throughput"|"events")
        k6 run --env API_URL="$API_URL" tests/load/events-throughput.test.js
        ;;
    "quick")
        k6 run --env API_URL="$API_URL" --duration 30s --vus 100 tests/load/api-load.test.js
        ;;
    "all")
        k6 run --env API_URL="$API_URL" tests/load/events-throughput.test.js
        k6 run --env API_URL="$API_URL" tests/load/api-load.test.js
        ;;
    *)
        echo "Usage: $0 [concurrent|throughput|quick|all]"
        exit 1
        ;;
esac

echo "Results: $RESULTS_DIR/"
ls -la "$RESULTS_DIR"/*.json 2>/dev/null | tail -5
