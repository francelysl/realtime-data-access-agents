from pydantic import BaseModel, Field
from typing import Union, List, Dict

class QueryRequest(BaseModel):
    user_id: str = Field(..., description="Auth user identifier")
    sql: str = Field(..., description="User-provided SQL or DSL")
    preview: bool = Field(True, description="If true, limit rows")

class QueryResponse(BaseModel):
    allowed: bool
    reason: str
    rows: int = 0
    data_preview: Union[List[Dict], None] = None  
    agent_rationale: Union[str, None] = None  