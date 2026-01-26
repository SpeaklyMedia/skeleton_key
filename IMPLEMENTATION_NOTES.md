# Phase 2 MCQ Engine — Implementation Notes

## Server
- Schema source: `api/_lib/gateData.js` reads R2_1 schema at
  `artifacts/access-gate/PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R2_1/PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R2_1/schemas/ACCESS_GATE_MCQ_SCHEMA.json`.
- Key readiness: derived from `validation.mcq.options` + `validation.mcq.correct_option_id` for all 19 entries.
- Auth: `/api/session` delegates to `/api/auth/session` (cookie + rate-limit).
- Gate state cookie: `sk_gate_state` (signed), stored via `api/_lib/gateState.js`.
- Attempt endpoint: `/api/gate/attempt` enforces:
  - per-part progression (I→VIII)
  - deterministic reset of the active part on any wrong answer
  - cooldown + attempt cap from schema anti_bruteforce (defaults to 60s, 5 attempts)
  - 100% required; score updates only on correct entries
- Schema/meta endpoints: `/api/gate/schema` and `/api/gate/meta` expose key status counts post-auth.

## Client
- UI gated behind auth; MCQ rendered from schema (no content rewrites).
- Part progression rail; only active part is actionable.
- Submission disabled when keys are not ready or when gate is complete.

## Persistence
- No external persistence is performed in Phase 2 (cookie-only state).
