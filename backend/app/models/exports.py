from pydantic import BaseModel
from datetime import datetime

class ExportItem(BaseModel):
    key: str
    size: int
    last_modified: datetime

class ExportListResponse(BaseModel):
    items: list[ExportItem]
