from ..services.cache import get_redis
from redis.exceptions import RedisError

BUDGET_KEY = "budget:{user_id}"
DEFAULT_DAILY_BUDGET = 10000

_fallback_budget: dict[str, int] = {}

def _fb_get(user_id: str) -> int:
    return _fallback_budget.get(user_id, DEFAULT_DAILY_BUDGET)

def _fb_consume(user_id: str, amount: int) -> int:
    remaining = _fallback_budget.get(user_id, DEFAULT_DAILY_BUDGET) - amount
    _fallback_budget[user_id] = remaining
    return remaining

def get_remaining(user_id: str) -> int:
    try:
        r = get_redis()
        key = BUDGET_KEY.format(user_id=user_id)
        v = r.get(key)
        return int(v) if v is not None else DEFAULT_DAILY_BUDGET
    except RedisError:
        return _fb_get(user_id)

def consume(user_id: str, amount: int) -> int:
    """
    Ensure a default budget exists,
    then decrement atomically with DECRBY.
    """
    try:
        r = get_redis()
        key = BUDGET_KEY.format(user_id=user_id)
    
        r.setnx(key, DEFAULT_DAILY_BUDGET)

        remaining = r.decrby(key, amount)
        return int(remaining)
    except RedisError:
        return _fb_consume(user_id, amount)
