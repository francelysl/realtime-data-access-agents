from __future__ import annotations
import os
from datetime import datetime, timedelta, timezone
import boto3
import pandas as pd
import psycopg
import pyarrow as pa
import pyarrow.parquet as pq
from airflow import DAG
from airflow.decorators import task

SRTA_DB_URI_ENV = os.environ.get("SRTA_DB_URI", "postgresql://srta:srta_pw@postgres:5432/srta")
PSYCOPG_URI = SRTA_DB_URI_ENV.replace("+psycopg", "")

S3_BUCKET = os.environ.get("S3_BUCKET", "srta-demo-bucket-fl")
S3_PREFIX = os.environ.get("S3_PREFIX", "exports/trades")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")

LOCAL_EXPORT_DIR = "/opt/airflow/data/exports"
os.makedirs(LOCAL_EXPORT_DIR, exist_ok=True)

def s3_client():
    return boto3.client("s3", endpoint_url=AWS_ENDPOINT_URL) if AWS_ENDPOINT_URL else boto3.client("s3")

with DAG(
    dag_id="trades_to_s3_parquet",
    start_date=datetime(2025, 8, 1),
    schedule=None,
    catchup=False,
    description="Export trades to Parquet → S3, verify, and prune old partitions",
    tags=["srta", "etl", "s3", "parquet"],
):
    @task
    def extract_trades(limit: int | None = None) -> str:
        """Query Postgres and write a local Parquet file (optionally limit rows)."""
        with psycopg.connect(PSYCOPG_URI) as conn:
            sql = """
                SELECT id, COALESCE(ext_id,'') AS ext_id, symbol, price, qty, ts
                FROM trades
                WHERE ts >= NOW() - INTERVAL '1 day'
                ORDER BY id DESC
            """
            if limit:
                sql += f" LIMIT {int(limit)}"
            df = pd.read_sql_query(sql, conn)
        out_path = os.path.join(LOCAL_EXPORT_DIR, "trades_extracted.parquet")
        pq.write_table(pa.Table.from_pandas(df), out_path)
        return out_path

    @task
    def upload_to_s3(parquet_path: str | None = None) -> str:
        """Upload Parquet to partitioned key."""
        if not parquet_path or not isinstance(parquet_path, str):
            parquet_path = os.path.join(LOCAL_EXPORT_DIR, "trades_extracted.parquet")
        dt_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        key = f"{S3_PREFIX}/dt={dt_str}/trades_{dt_str}.parquet"
        s3 = s3_client()
        s3.upload_file(parquet_path, S3_BUCKET, key)
        return f"s3://{S3_BUCKET}/{key}"

    @task
    def verify_s3_object(s3_uri: str) -> str:
        """Ensure the uploaded object exists and is > 0 bytes."""
        assert s3_uri.startswith("s3://")
        _, rest = s3_uri.split("s3://", 1)
        bucket, key = rest.split("/", 1)
        s3 = s3_client()
        head = s3.head_object(Bucket=bucket, Key=key)
        size = head["ContentLength"]
        if size <= 0:
            raise ValueError(f"S3 object is empty: {s3_uri}")
        return s3_uri

    @task
    def prune_old_partitions(days_to_keep: int = 7) -> int:
        """Delete S3 partitions older than N days: s3://bucket/prefix/dt=YYYY-MM-DD/"""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days_to_keep)).date()
        s3 = s3_client()
        # list common prefixes (dt= partitions)
        paginator = s3.get_paginator("list_objects_v2")
        deleted = 0
        # We list all objects and filter by dt=… path. (Simple and robust for demo)
        for page in paginator.paginate(Bucket=S3_BUCKET, Prefix=S3_PREFIX + "/"):
            for obj in page.get("Contents", []):
                key = obj["Key"]
                # expect .../dt=YYYY-MM-DD/...
                if "/dt=" in key:
                    try:
                        dt_seg = key.split("/dt=", 1)[1].split("/", 1)[0]
                        dt = datetime.strptime(dt_seg, "%Y-%m-%d").date()
                        if dt < cutoff:
                            s3.delete_object(Bucket=S3_BUCKET, Key=key)
                            deleted += 1
                    except Exception:
                        # ignore keys that don't match pattern
                        pass
        return deleted

    p = extract_trades(limit=10000)
    uri = upload_to_s3(p)
    _ = verify_s3_object(uri)
    _ = prune_old_partitions(days_to_keep=7)
