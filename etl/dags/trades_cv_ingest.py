# Placeholder DAG; real DAG added next commit
from datetime import datetime
from airflow import DAG

with DAG(
    dag_id="trades_csv_ingest",
    start_date=datetime(2025, 8, 1),
    schedule=None,  # manual for now
    catchup=False,
    description="Ingest trades from CSV into SRTA Postgres",
):
    pass
