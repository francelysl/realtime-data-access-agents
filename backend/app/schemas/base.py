from pydantic import BaseModel
from typing import Union

class QueryRequest(BaseModel):
    sql: str
    preview: Union[bool, None] 

class QueryResponse(BaseModel):
    result: Union[str, None] 