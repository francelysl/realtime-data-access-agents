#!/usr/bin/env bash
set -euo pipefail

BROKERS="${BROKERS:-localhost:9092}"
TOPIC="${TOPIC:-trades.events}"
PARTITIONS="${PARTITIONS:-3}"
REPLICAS="${REPLICAS:-1}"

echo "Creating topic: $TOPIC (partitions=$PARTITIONS, replicas=$REPLICAS) on $BROKERS"

docker compose -f docker-compose.yml -f docker-compose.kafka.yml exec redpanda \
  rpk topic create "$TOPIC" -p "$PARTITIONS" -r "$REPLICAS" -X brokers=redpanda:9092 || true

echo "Listing topics:"
docker compose -f docker-compose.yml -f docker-compose.kafka.yml exec redpanda \
  rpk topic list -X brokers=redpanda:9092
