from __future__ import annotations
import os
from datetime import datetime
import pandas as pd
import psycopg
from airflow import DAG
from airflow.decorators import task

SRTA_DB_URI_ENV = os.environ.get("SRTA_DB_URI", "postgresql://srta:srta_pw@postgres:5432/srta")
# psycopg expects 'postgresql://...' (no '+psycopg')
PSYCOPG_URI = SRTA_DB_URI_ENV.replace("+psycopg", "")

CSV_PATH = "/opt/airflow/data/trades_seed.csv"

with DAG(
    dag_id="trades_csv_ingest",
    start_date=datetime(2025, 8, 1),
    schedule=None,  # manual trigger for demo
    catchup=False,
    description="Ingest trades from CSV into SRTA Postgres",
    tags=["srta", "etl", "demo"],
):

    @task
    def ensure_table():
        ddl = """
        CREATE TABLE IF NOT EXISTS trades (
            id BIGSERIAL PRIMARY KEY,
            ext_id TEXT,
            symbol TEXT NOT NULL,
            price NUMERIC(12,4) NOT NULL,
            qty   INT NOT NULL,
            ts    TIMESTAMP NOT NULL
        );
        """
        with psycopg.connect(PSYCOPG_URI) as conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
                conn.commit()

    @task
    def load_csv() -> int:
        df = pd.read_csv(CSV_PATH)
        df = df[["symbol", "price", "qty", "ts"]]
        with psycopg.connect(PSYCOPG_URI, autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.executemany(
                    "INSERT INTO trades (symbol, price, qty, ts) VALUES (%s, %s, %s, %s);",
                    list(df.itertuples(index=False, name=None)),
                )
        return len(df)

    @task
    def count_rows() -> int:
        with psycopg.connect(PSYCOPG_URI) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM trades;")
                (n,) = cur.fetchone()
                return int(n)

    t1 = ensure_table()
    t2 = load_csv()
    t3 = count_rows()
    t1 >> t2 >> t3
