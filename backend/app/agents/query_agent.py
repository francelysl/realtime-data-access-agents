from dataclasses import dataclass
from typing import Union  

@dataclass
class AgentSuggestion:
    rewritten_sql: Union[str, None]  
    rationale: str

def suggest_rewrite(sql: str, *, preview: bool) -> AgentSuggestion:
    """
    Deterministic agent:
    - If preview=True and query lacks LIMIT, append LIMIT 50.
    - Otherwise no change.
    This is dependency-free and safe; swap with an LLM later.
    """
    norm = sql.strip()
    lower = norm.lower()
    if preview and " limit " not in f" {lower} ":
        return AgentSuggestion(
            rewritten_sql=norm.rstrip(";") + " LIMIT 50",
            rationale="Agent added LIMIT 50 for safe preview."
        )
    return AgentSuggestion(rewritten_sql=None, rationale="No changes suggested.")