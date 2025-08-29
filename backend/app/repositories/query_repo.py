import re
from typing import List
from sqlalchemy import text
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

def _validate_and_extract_table(sql: str) -> str:
    if SEMICOLON_RE.search(sql):
        raise UnsafeQueryError("Semicolons are not allowed.")
    if not SELECT_RE.match(sql):
        raise UnsafeQueryError("Only SELECT queries are allowed.")
    m = FROM_RE.search(sql)
    if not m:
        raise UnsafeQueryError("Query must include a FROM <table> clause.")
    table = m.group(1)
    allowed = set(settings.ALLOWED_TABLES)
    if table not in allowed:
        raise UnsafeQueryError(f"Table '{table}' is not allowed. Allowed: {sorted(allowed)}")
    return table

def _apply_limit(sql: str, limit: int) -> str:
    # Note: For demo purposes, production: use a SQL parser.
    sql_no_limit = re.sub(r"\blimit\s+\d+\b", "", sql, flags=re.IGNORECASE)
    return sql_no_limit.rstrip() + f" LIMIT {limit}"

class QueryRepo:
    def __init__(self, db: Session):
        self.db = db

    def preview(self, sql: str) -> List[dict]:
        _validate_and_extract_table(sql)
        limit = min(settings.PREVIEW_LIMIT, settings.HARD_LIMIT)
        limited_sql = _apply_limit(sql, limit)
        result = self.db.execute(text(limited_sql))
        rows = [dict(row._mapping) for row in result]
        return rows

    def run(self, sql: str) -> List[dict]:
        _validate_and_extract_table(sql)
        # Even in "run", enforce hard cap
        limited_sql = _apply_limit(sql, settings.HARD_LIMIT)
        result = self.db.execute(text(limited_sql))
        rows = [dict(row._mapping) for row in result]
        return rows
