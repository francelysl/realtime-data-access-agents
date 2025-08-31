import asyncio, os, ujson, logging
from aiokafka import AIOKafkaConsumer
import psycopg

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("consumer")

BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "redpanda:9092")
TOPIC = os.getenv("KAFKA_TOPIC", "trades.events")
GROUP = os.getenv("KAFKA_GROUP", "trades-consumers")
PG_URI = os.getenv("SRTA_DB_URI", "postgresql://srta:srta_pw@postgres:5432/srta")

UPSERT_SQL = """
INSERT INTO trades (ext_id, symbol, price, qty, ts)
VALUES (%s, %s, %s, %s, to_timestamp(%s/1000.0))
ON CONFLICT (ext_id) DO UPDATE SET
  price = EXCLUDED.price,
  qty   = EXCLUDED.qty,
  ts    = EXCLUDED.ts;
"""

async def run():
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=BOOTSTRAP,
        group_id=GROUP,
        value_deserializer=lambda m: ujson.loads(m),
        enable_auto_commit=True,
        auto_offset_reset="latest",
    )
    await consumer.start()
    log.info("Consumer started")
    # Single connection reused
    with psycopg.connect(PG_URI, autocommit=True) as conn:
        async for msg in consumer:
            evt = msg.value
            ext_id = evt.get("id")
            sym = evt.get("symbol")
            price = evt.get("price")
            qty = evt.get("qty")
            ts_ms = evt.get("ts_ms")
            try:
                with conn.cursor() as cur:
                    cur.execute(UPSERT_SQL, (ext_id, sym, price, qty, ts_ms))
            except Exception as e:
                log.exception("UPSERT failed: %s", e)

if __name__ == "__main__":
    asyncio.run(run())
