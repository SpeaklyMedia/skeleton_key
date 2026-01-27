# QA Hooks — Phase 2

1) Perfect pass (19/19)
- Authenticate, answer all entries correctly in order across parts I→VIII.
- Expected: access_gate_status becomes COMPLETE; score = 19; completed_at set.

2) Fail on ENTRY_05 reset
- Complete Part I and Part II correctly.
- In Part III, answer ENTRY_05 incorrectly.
- Expected: Part III progress resets to 0; cooldown enforced; score reduced accordingly; gate remains INCOMPLETE.

3) Brute-force blocked
- For a single entry, submit wrong answers repeatedly beyond max attempts.
- Expected: 429 RATE_LIMIT with retry_after_seconds; further attempts blocked until window reset.
