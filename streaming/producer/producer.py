import asyncio, os, random, time, ujson
from aiokafka import AIOKafkaProducer

BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "redpanda:9092")
TOPIC = os.getenv("KAFKA_TOPIC", "trades.events")
SYMBOLS = ["AAPL","MSFT","GOOG","AMZN","NVDA"]

async def run():
    producer = AIOKafkaProducer(bootstrap_servers=BOOTSTRAP, value_serializer=lambda v: ujson.dumps(v).encode())
    await producer.start()
    try:
        i = 0
        while True:
            sym = random.choice(SYMBOLS)
            price = round(random.uniform(50, 500), 2)
            qty = random.choice([1,5,10,20,50])
            ts = int(time.time()*1000)
            event = {"id": f"evt-{ts}-{i}", "symbol": sym, "price": price, "qty": qty, "ts_ms": ts}
            await producer.send_and_wait(TOPIC, event, key=str(sym).encode())
            i += 1
            await asyncio.sleep(0.5)  
    finally:
        await producer.stop()

if __name__ == "__main__":
    asyncio.run(run())
