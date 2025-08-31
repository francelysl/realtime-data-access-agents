#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET env required}"
ENDPOINT="${AWS_ENDPOINT_URL:-http://localhost:4566}"

echo "Creating bucket: s3://${S3_BUCKET} on ${ENDPOINT}"
aws --endpoint-url "${ENDPOINT}" s3 mb "s3://${S3_BUCKET}" || true
aws --endpoint-url "${ENDPOINT}" s3 ls
