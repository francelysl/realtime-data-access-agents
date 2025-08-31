# etl/dags/trades_to_s3_parquet.py
from __future__ import annotations
import os
from datetime import datetime
import boto3
import pandas as pd
import psycopg
import pyarrow as pa
import pyarrow.parquet as pq
from airflow import DAG
from airflow.decorators import task

# Read SQLAlchemy-style env var (may be "postgresql+psycopg://...")
SRTA_DB_URI_ENV = os.environ.get("SRTA_DB_URI", "postgresql://srta:srta_pw@postgres:5432/srta")
# psycopg driver expects "postgresql://..." (no "+psycopg")
PSYCOPG_URI = SRTA_DB_URI_ENV.replace("+psycopg", "")

S3_BUCKET = os.environ.get("S3_BUCKET", "srta-demo-bucket")
S3_PREFIX = os.environ.get("S3_PREFIX", "exports/trades")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")  # set when using LocalStack

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "your-access-key-id")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "your-secret-access-key")