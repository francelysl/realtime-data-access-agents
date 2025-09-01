from typing import Optional, List
import os
import boto3
from fastapi import APIRouter, HTTPException, Query
from ..models.exports import ExportItem, ExportListResponse

router = APIRouter(prefix="/exports", tags=["exports"])

S3_BUCKET = os.environ.get("S3_BUCKET")
S3_PREFIX = os.environ.get("S3_PREFIX", "")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")

def _s3():
    return boto3.client("s3", endpoint_url=AWS_ENDPOINT_URL) if AWS_ENDPOINT_URL else boto3.client("s3")

@router.get("/presign")
def presign(key: str = Query(..., description="Key under the bucket/prefix"),
            expires_in: int = Query(900, ge=60, le=86400)):
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

@router.get("/list", response_model=ExportListResponse)
def list_exports(
    date: Optional[str] = Query(None, description="YYYY-MM-DD; if omitted, list all under prefix (may be large)"),
    limit: int = Query(1000, ge=1, le=5000)
):
    """
    List S3 objects under S3_PREFIX (or S3_PREFIX/dt=DATE/ if date is provided).
    Returns: [{ key, size, last_modified }]
    """
    if not S3_BUCKET:
        raise HTTPException(500, "S3_BUCKET env not set")
    if S3_PREFIX is None:
        raise HTTPException(500, "S3_PREFIX env not set")

    prefix = S3_PREFIX
    if date:
        prefix = f"{S3_PREFIX}/dt={date}"

    s3 = _s3()
    paginator = s3.get_paginator("list_objects_v2")
    items: list[ExportItem] = []
    # Ensure trailing slash to only list within the “folder”
    list_prefix = prefix + "/"
    for page in paginator.paginate(Bucket=S3_BUCKET, Prefix=list_prefix, PaginationConfig={"MaxItems": limit}):
        for obj in page.get("Contents", []):
            items.append(ExportItem(
                key=obj["Key"],
                size=int(obj.get("Size", 0)),
                last_modified=obj.get("LastModified"),
            ))
        # Stop if we collected up to the limit quickly
        if len(items) >= limit:
            items = items[:limit]
            break

    return ExportListResponse(items=items)
