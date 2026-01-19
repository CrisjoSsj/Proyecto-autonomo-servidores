from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Dict
from app.tools import get_default_registry, ToolError
from app.tool_proposals import get_default_store, ProposalNotFound
from app.config import settings
from app.jwks import verify_jwt_token

router = APIRouter()


async def get_caller(request: Request):
    """Authenticate request via ApiKey or Bearer JWT. Returns a simple identity dict."""
    auth = request.headers.get('Authorization') or request.headers.get('authorization')
    if not auth:
        raise HTTPException(status_code=401, detail='Authorization required')

    if auth.startswith('ApiKey '):
        key = auth.split(' ', 1)[1].strip()
        expected = settings.TOOLS_API_KEY
        if not expected:
            raise HTTPException(status_code=500, detail='TOOLS_API_KEY not configured')
        if key != expected:
            raise HTTPException(status_code=401, detail='Invalid API Key')
        return {'api_key': key}

    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1].strip()
        try:
            payload = verify_jwt_token(token)
        except HTTPException:
            raise
        except Exception as e:
            # Misconfiguration or JWKS access error
            raise HTTPException(status_code=500, detail=f"JWKS verification error: {e}")
        return {'jwt_payload': payload}

    raise HTTPException(status_code=401, detail='Invalid Authorization header')


class ProposeRequest(BaseModel):
    tool: str
    params: Dict | None = None


class ConfirmRequest(BaseModel):
    proposal_id: str


@router.post("/propose")
async def propose(req: ProposeRequest, caller=Depends(get_caller)):
    registry = get_default_registry()
    store = get_default_store()

    try:
        # Ask the tool for a proposal (confirm=false)
        res = await registry.execute(req.tool, req.params or {}, confirm=False)
    except ToolError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Store the proposed params and tool so it can be confirmed later
    p = await store.create_proposal(req.tool, req.params or {})
    return {"proposal_id": p["id"], "proposal": res}


@router.post("/confirm")
async def confirm(req: ConfirmRequest, caller=Depends(get_caller)):
    registry = get_default_registry()
    store = get_default_store()

    try:
        proposal = await store.pop_proposal(req.proposal_id)
    except ProposalNotFound:
        raise HTTPException(status_code=404, detail="Proposal not found or expired")

    try:
        # Execute with confirm=True to persist
        # If caller provided a JWT payload, try to forward identity via params or headers if needed
        res = await registry.execute(proposal["tool"], proposal["params"], confirm=True)
    except ToolError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"result": res}


@router.get("/proposals/{proposal_id}")
async def get_proposal(proposal_id: str, caller=Depends(get_caller)):
    store = get_default_store()
    try:
        proposal = await store.get_proposal(proposal_id)
    except ProposalNotFound:
        raise HTTPException(status_code=404, detail="Proposal not found or expired")
    return proposal
