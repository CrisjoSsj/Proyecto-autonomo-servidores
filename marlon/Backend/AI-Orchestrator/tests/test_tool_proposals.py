import pytest
from httpx import AsyncClient
from app.main import app
import asyncio


class DummyRegistry:
    def __init__(self):
        self.calls = []

    async def execute(self, tool_name, params, confirm=None):
        self.calls.append((tool_name, params, confirm))
        if confirm is False:
            return {'proposal': {'summary': 'preview for ' + tool_name}}
        if confirm is True:
            return {'result': 'executed ' + tool_name}
        # direct call
        return {'result': 'called ' + tool_name}


@pytest.mark.asyncio
async def test_propose_and_confirm_flow(monkeypatch):
    dummy = DummyRegistry()

    # Patch registry factory to return our dummy
    import app.routes.tools as tools_routes

    monkeypatch.setattr('app.routes.tools.get_default_registry', lambda: dummy)

    async with AsyncClient(app=app, base_url='http://test') as ac:
        # Propose
        resp = await ac.post('/api/tools/propose', json={'tool': 'crear_reserva', 'params': {'cliente_id': 1}})
        assert resp.status_code == 200
        data = resp.json()
        assert 'proposal_id' in data
        assert 'proposal' in data

        proposal_id = data['proposal_id']

        # Confirm
        confirm_resp = await ac.post('/api/tools/confirm', json={'proposal_id': proposal_id})
        assert confirm_resp.status_code == 200
        cdata = confirm_resp.json()
        assert 'result' in cdata
        assert cdata['result'] == {'result': 'executed crear_reserva'}


@pytest.mark.asyncio
async def test_redis_proposal_store_with_fakeredis():
    try:
        import fakeredis.aioredis as faker
    except Exception:
        pytest.skip('fakeredis not installed')

    from app.tool_proposals import RedisProposalStore, ProposalNotFound
    store = RedisProposalStore(redis_url='redis://localhost:6379/3', ttl_seconds=2)

    # monkeypatch underlying redis client to fakeredis
    store._redis = await faker.create_redis_pool()

    p = await store.create_proposal('t1', {'a': 1})
    got = await store.get_proposal(p['id'])
    assert got['id'] == p['id']

    popped = await store.pop_proposal(p['id'])
    assert popped['id'] == p['id']

    with pytest.raises(ProposalNotFound):
        await store.get_proposal(p['id'])

    # TTL expiry
    p2 = await store.create_proposal('t2', {'b': 2})
    await asyncio.sleep(3)
    with pytest.raises(ProposalNotFound):
        await store.get_proposal(p2['id'])
