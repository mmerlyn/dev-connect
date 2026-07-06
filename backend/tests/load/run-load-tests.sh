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
    "ws"|"concurrency")
        # Requires the 3-gateway + Nginx stack from docker-compose.yml (API_URL
        # should point at nginx, e.g. http://localhost:8090, not a single gateway).
        k6 run --env API_URL="$API_URL" tests/load/ws-concurrency.test.js
        ;;
    "failover")
        # Runs ws-failover.test.js in the background, kills one gateway
        # container partway through, restarts it, then waits for k6 to finish.
        # GATEWAY_TO_KILL defaults to the container least likely to be nginx's
        # first pick; override if needed.
        GATEWAY_TO_KILL="${GATEWAY_TO_KILL:-devconnect-gateway2}"
        k6 run --env API_URL="$API_URL" tests/load/ws-failover.test.js &
        K6_PID=$!
        sleep 20
        echo "Killing $GATEWAY_TO_KILL mid-run..."
        docker kill "$GATEWAY_TO_KILL" > /dev/null
        sleep 10
        echo "Restarting $GATEWAY_TO_KILL..."
        docker start "$GATEWAY_TO_KILL" > /dev/null
        wait $K6_PID
        ;;
    "all")
        k6 run --env API_URL="$API_URL" tests/load/events-throughput.test.js
        k6 run --env API_URL="$API_URL" tests/load/api-load.test.js
        ;;
    *)
        echo "Usage: $0 [concurrent|throughput|quick|ws|failover|all]"
        exit 1
        ;;
esac

echo "Results: $RESULTS_DIR/"
ls -la "$RESULTS_DIR"/*.json 2>/dev/null | tail -5
