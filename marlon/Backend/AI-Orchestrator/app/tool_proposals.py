from typing import Dict, Optional
import time
import uuid
import asyncio
import json

from app.config import settings


class ProposalNotFound(Exception):
    pass


import logging

logger = logging.getLogger(__name__)


class ProposalStore:
    """In-memory store for proposals with TTL and simple concurrency control.

    This is intentionally simple for the initial implementation. For production, use
    a persistent store (Redis, DB) to survive restarts and to support multiple instances.
    """

    def __init__(self, ttl_seconds: int = 3600):
        self._ttl = ttl_seconds
        self._store: Dict[str, Dict] = {}
        self._lock = asyncio.Lock()

    async def create_proposal(self, tool_name: str, params: Dict) -> Dict:
        async with self._lock:
            pid = str(uuid.uuid4())
            now = int(time.time())
            self._store[pid] = {
                "id": pid,
                "tool": tool_name,
                "params": params,
                "created_at": now,
            }
            logger.info("Created in-memory proposal %s for tool %s", pid, tool_name)
            return self._store[pid]

    async def get_proposal(self, pid: str) -> Dict:
        async with self._lock:
            item = self._store.get(pid)
            if not item:
                logger.debug("Proposal %s not found", pid)
                raise ProposalNotFound(pid)
            # Check TTL
            if int(time.time()) - item["created_at"] > self._ttl:
                # expired
                del self._store[pid]
                logger.info("Proposal %s expired and removed", pid)
                raise ProposalNotFound(pid)
            return item

    async def pop_proposal(self, pid: str) -> Dict:
        async with self._lock:
            item = await self.get_proposal(pid)
            # remove it from store
            self._store.pop(pid, None)
            logger.info("Popped proposal %s", pid)
            return item


class RedisProposalStore(ProposalStore):
    """Redis-backed proposal store using redis.asyncio.

    Keys are stored as JSON blobs under `proposal:<id>` with an expiry equal to TTL.
    """

    def __init__(self, redis_url: str, ttl_seconds: int = 3600):
        super().__init__(ttl_seconds=ttl_seconds)
        try:
            import redis.asyncio as aioredis
        except Exception as e:
            raise RuntimeError("redis.asyncio is required for RedisProposalStore") from e
        self._redis = aioredis.from_url(redis_url)
        self._prefix = "proposal:"

    def _key(self, pid: str) -> str:
        return f"{self._prefix}{pid}"

    async def create_proposal(self, tool_name: str, params: Dict) -> Dict:
        pid = str(uuid.uuid4())
        now = int(time.time())
        payload = {
            "id": pid,
            "tool": tool_name,
            "params": params,
            "created_at": now,
        }
        key = self._key(pid)
        await self._redis.set(key, json.dumps(payload), ex=self._ttl)
        return payload

    async def get_proposal(self, pid: str) -> Dict:
        key = self._key(pid)
        data = await self._redis.get(key)
        if not data:
            raise ProposalNotFound(pid)
        payload = json.loads(data)
        return payload

    async def pop_proposal(self, pid: str) -> Dict:
        key = self._key(pid)
        # Try atomic GETDEL (available on recent Redis versions and redis-py)
        try:
            val = await self._redis.getdel(key)
            if not val:
                raise ProposalNotFound(pid)
            return json.loads(val)
        except AttributeError:
            # Fallback: get and delete with Lua script for atomicity
            script = """
            local v = redis.call('GET', KEYS[1])
            if v then
                redis.call('DEL', KEYS[1])
                return v
            end
            return nil
            """
            val = await self._redis.eval(script, 1, key)
            if not val:
                raise ProposalNotFound(pid)
            return json.loads(val)


_default_store: Optional[ProposalStore] = None


def get_default_store() -> ProposalStore:
    global _default_store
    if _default_store is None:
        # Prefer Redis if a Redis URL is available (use Celery broker if provided)
        redis_url = None
        if getattr(settings, 'PROPOSAL_REDIS_URL', None):
            redis_url = settings.PROPOSAL_REDIS_URL
        elif getattr(settings, 'CELERY_BROKER_URL', None) and str(settings.CELERY_BROKER_URL).startswith('redis'):
            redis_url = settings.CELERY_BROKER_URL

        if redis_url:
            _default_store = RedisProposalStore(redis_url, ttl_seconds=getattr(settings, 'PROPOSAL_TTL_SECONDS', 3600))
        else:
            _default_store = ProposalStore(ttl_seconds=getattr(settings, 'PROPOSAL_TTL_SECONDS', 3600))
    return _default_store
