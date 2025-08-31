# Real-Time Data Access Platform with Intelligent Query Agents v2










### Live Streaming (Kafka-compatible via Redpanda)

1. Start broker & console:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.kafka.yml up -d redpanda redpanda-console
   open http://localhost:8081
