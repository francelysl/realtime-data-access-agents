import redis
from ..settings import settings

_redis = None

def get_redis():
    global _redis
    if _redis is None:
        _redis = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis
