from typing import Optional
import os
import boto3
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/exports", tags=["exports"])

S3_BUCKET = os.environ.get("S3_BUCKET")
S3_PREFIX = os.environ.get("S3_PREFIX", "")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")  # for LocalStack

def _s3():
    return boto3.client("s3", endpoint_url=AWS_ENDPOINT_URL) if AWS_ENDPOINT_URL else boto3.client("s3")

@router.get("/presign")
def presign(
    key: str = Query(..., description="Key under the bucket/prefix"),
    expires_in: int = Query(900, ge=60, le=86400),
):
    if not S3_BUCKET:
        raise HTTPException(500, "S3_BUCKET env not set")
    if S3_PREFIX and not key.startswith(S3_PREFIX + "/"):
        raise HTTPException(400, f"key must start with '{S3_PREFIX}/'")
    try:
        url = _s3().generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": S3_BUCKET, "Key": key},
            ExpiresIn=int(expires_in),
        )
        return {"bucket": S3_BUCKET, "key": key, "url": url, "expires_in": expires_in}
    except Exception as e:
        raise HTTPException(500, f"presign failed: {e}")
