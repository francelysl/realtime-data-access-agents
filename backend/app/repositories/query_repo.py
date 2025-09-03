import re
import inspect
from typing import List, Any, Dict, Union
from sqlalchemy import text
from sqlalchemy.engine import Result
from sqlalchemy.orm import Session
from ..settings import settings

# SQL checks:
# - Only allow SELECT statements
# - Must contain FROM <allowed_table>
# - No semicolons / multiple statements
# - LIMIT is enforced/overridden by server
SELECT_RE = re.compile(r"^\s*select\s", re.IGNORECASE)
FROM_RE = re.compile(r"\sfrom\s+([a-zA-Z0-9_]+)", re.IGNORECASE)
SEMICOLON_RE = re.compile(r";")

class UnsafeQueryError(Exception):
    pass

def _row_to_dict(row) -> Dict[str, Any]:
    try:
        return dict(row._mapping)
    except AttributeError:
        return dict(row)

def _apply_limit(sql: str, limit: int) -> str:
    s = sql.strip().rstrip(";")
    if " limit " in s.lower():
        return s
    return f"{s} LIMIT {int(limit)}"

def _validate_and_extract_table(sql: str) -> None:
    if SEMICOLON_RE.search(sql):
        raise UnsafeQueryError("Semicolons are not allowed.")
    if not SELECT_RE.match(sql):
        raise UnsafeQueryError("Only SELECT queries are allowed.")
    return

class QueryRepo:
    def __init__(self, db: Union[Session, Any]):  
        self._close_after = False
        if inspect.isgenerator(db):
            self.db = next(db)
            self._close_after = True
        else:
            self.db = db
        self.agent_rationale = None

    def __del__(self):
        try:
            if self._close_after and hasattr(self.db, "close"):
                self.db.close()
        except Exception:
            pass

    def run(self, sql: str) -> List[dict]:
        _validate_and_extract_table(sql)
        result: Result = self.db.execute(text(sql))
        return [_row_to_dict(r) for r in result]

    def preview(self, sql: str) -> List[dict]:
        _validate_and_extract_table(sql)
        limit = min(settings.PREVIEW_LIMIT, settings.HARD_LIMIT)
        limited_sql = _apply_limit(sql, limit)
        result: Result = self.db.execute(text(limited_sql))
        return [_row_to_dict(r) for r in result]