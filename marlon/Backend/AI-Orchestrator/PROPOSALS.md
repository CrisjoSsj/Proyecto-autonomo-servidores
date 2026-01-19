Propose/Confirm (Proposals) and Idempotency

This document explains how the Orchestrator and Django tools implement the propose/confirm flow and idempotency semantics.

Overview
- POST /api/tools/propose {"tool": "crear_reserva", "params": {...}} → returns {"proposal_id": "<id>", "proposal": {...}}
- POST /api/tools/confirm {"proposal_id": "<id>"} → executes the previously proposed action and returns the result.

Idempotency
- For mutative operations you can provide an `Idempotency-Key` header on the confirm call (or include `idempotency_key` in params).
- The server uses `ToolActionLog` to persist proposal and confirmation records and avoids duplicate side effects.
- Usage example (curl):

  # Propose
  curl -X POST http://localhost:8080/api/tools/propose -H "Content-Type: application/json" -d '{"tool":"crear_reserva","params":{"cliente_id":1,"fecha":"2025-12-26","hora":"12:00","total_estimado":100}}'

  # Confirm (include Idempotency-Key to avoid duplicates)
  curl -X POST "http://localhost:8080/api/tools/confirm" -H "Content-Type: application/json" -H "Idempotency-Key: abc-123" -d '{"proposal_id":"<id>"}'

Configuration
- PROPOSAL_REDIS_URL: optional. If set (e.g. redis://redis:6379/2) the Orchestrator uses Redis to persist proposals so they survive restarts and scale across instances.
- PROPOSAL_TTL_SECONDS: TTL in seconds for proposals in Redis (default 3600).

Notes
- A database UniqueConstraint is used to prevent duplicate confirmed actions with the same (action, idempotency_key).
- The Orchestrator forwards `Idempotency-Key` header when performing confirmed actions.
