# PEW Access Gate — Full Artifact Travel ZIP (2026-01-25) — R1

## Purpose
Single, VS Code–ingestible, deterministic travel bundle for implementing the Access Gate MCQ engine in the Prompt Engineering Workbook project.

## Phase Status
- PHASE 1 — Ingest & Lock: PASS
- PHASE 2 — MCQ Gate Implementation: READY (implementation-only)
- PHASE 3+ — Deferred (lesson intro alignment, visuals, QA lock)

## STOP Conditions (Fail the run if any occur)
- Any missing file listed in MANIFEST.json
- Any SHA256 mismatch against the included SHA256SUMS.txt (ship pack) or top-level SHA256SUMS.txt (this travel zip)
- Any attempt to rewrite or modify canonical story content or collapse PART structure
- Any gating logic that is not fail-closed (must require 19/19 @ 100%)
- Any implementation that allows brute-force retries or bypass paths
- Any filename reuse for lockable artifacts after hashes/proofs are published

## Contents
- /access-gate: canonical inputs (ship pack zip, transport zip, canonical PDF copy)
- /schemas: MCQ schema extracted for direct use
- /indexes: story index + MCQ keying TODO list
- /manifests: ship pack manifest + checksums
- /receipts: ship receipts
- /governance: classification + locks
