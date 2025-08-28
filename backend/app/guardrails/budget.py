from ..services.cache import get_redis

BUDGET_KEY = "budget:{user_id}"
DEFAULT_DAILY_BUDGET = 10000 

def get_remaining(user_id: str) -> int:
    r = get_redis()
    key = BUDGET_KEY.format(user_id=user_id)
    v = r.get(key)
    return int(v) if v is not None else DEFAULT_DAILY_BUDGET

def consume(user_id: str, amount: int) -> int:
    r = get_redis()
    key = BUDGET_KEY.format(user_id=user_id)
    pipe = r.pipeline()
    if r.get(key) is None:
        pipe.set(key, DEFAULT_DAILY_BUDGET)
    pipe.decrby(key, amount)
    (_, remaining) = pipe.execute()
    return int(remaining)
