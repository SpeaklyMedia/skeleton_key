# 🗝️ Skeleton Key — Access Gate

**Repo Seed:** `PEW_ACCESS_GATE_DEPLOY_REPO_SEED_20260125_R1`  
**Purpose:** Deployable baseline for Prompt Engineering Workbook → **Front-Matter → Access Gate → Prelude**.

This repo is a **Codex-ready seed** intended to be pushed to a **NEW deploy repo** and deployed to Vercel. It is designed to remain **fail-closed** at all times.

---

## Locked truths (do not deviate)
- **Artifact-only repo lock:** `SpeaklyMedia/skeleton_key` (a.k.a. `skeleton_key_app`) is **ARTIFACT-ONLY** and MUST NOT be deployed or reconnected to Vercel.
- **Canonical Access Gate input (read-only):** `artifacts/access-gate/PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R1.zip`
- **Fail-closed:** No lesson access until MCQ completion = **100% (19/19)**.

---

## Deterministic build requirements (Vercel)
Vercel settings (explicit):
- Root Directory: `.`
- Install: `npm ci --include=dev --no-audit --no-fund`
- Build: `npm run build`
- Output: `dist`
- **Node: 22.x REQUIRED**

Repo enforces build commands via `vercel.json`.

---

## VS Code terminal CWD fix (required for local npm)
If `npm` runs from `~` instead of this repo root, it will fail with `ENOENT` because `package.json` is missing.

Set VS Code **User Settings (JSON)**:
```json
{
  "terminal.integrated.cwd": "${workspaceFolder}",
  "terminal.integrated.splitCwd": "inherited"
}
```

Then:
- Kill all terminals (trash can)
- Open a new terminal

Find conflicts:
- Settings search: `@modified`
- Inspect/remove/neutralize:
  - `terminal.integrated.cwd`
  - `terminal.integrated.splitCwd`
  - `terminal.integrated.env.*`
  - `terminal.integrated.profiles.*`

Guardrail before any npm command:
```sh
test -f package.json || { echo "FAIL: not in repo root (package.json missing). cd into repo first."; exit 2; }

set -e
set -o pipefail
```

Correct run procedure:
```sh
pwd
ls -la package.json
# then run install/build
```

--- 

## Password/data gate (mandatory)
Even if Vercel Password Protection is unavailable, the app includes an **app-level gate**:
- **NO Access Gate data loads** until password auth succeeds.
- API is fail-closed if required env vars are missing.

Required env vars:
- `ACCESS_GATE_APP_SECRET` (HMAC signing secret)
- `ACCESS_GATE_PASSWORD_HASH` (preferred) OR `ACCESS_GATE_PASSWORD` (fallback)

Endpoints (serverless stubs):
- `POST /api/auth/session` → sets httpOnly cookie on success; rate-limited; fail-closed if secret missing
- `GET /api/gate/meta` → counts only (parts/entries) if auth cookie valid
- `GET /api/gate/schema` → canonical schema JSON if auth cookie valid

---

## Artifacts (embedded, unchanged)
Artifacts are stored outside `/public` (server-read only):
- `artifacts/access-gate/PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R1.zip` (unchanged)
- `artifacts/access-gate/PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R1/PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R1/` (extracted, unchanged)

Integrity proof:
- `receipts/SHA_VERIFY_TRAVEL_PACK.log`

---

## Stop conditions
STOP and fail-closed if:
- Any attempt is made to deploy or reconnect Vercel to the artifact-only repo (`SpeaklyMedia/skeleton_key`).
- Access Gate env vars are missing → API returns 403 and UI stays locked.
- Any content edits occur inside `artifacts/access-gate/...`.
- Lockfile is missing or install omits devDependencies.

---

## Proof logs (generated before zipping)
- `PROOF__npm_ci.log`
- `PROOF__npm_run_build.log`

---

## Phase status
- Phase 0: deterministic scaffold ✅
- Phase 1: artifact ingest + fail-closed API gate ✅
- Phase 2 MCQ engine: **stubbed UI shell** (keys TBD; cannot complete gate yet) ✅
