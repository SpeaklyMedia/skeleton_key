# locks.md
locks:
  canonical_gate_pdf:
    path: "/mnt/data/🗝️ The Skeleton Key — Access Gate (complete Story Summaries • Full Text).pdf"
    editable: false
  gating:
    fail_closed: true
    completion:
      required_accuracy_percent: 100
      required_validations_total: 19
    partial_credit: false
    brute_force_retries: prohibited
    per_part_progression: required
  persistence:
    authority: "WordPress + Restrict Content Pro (membership)"
    wp_user_meta:
      - access_gate_status
      - access_gate_score
      - access_gate_completed_at
    missing_or_unknown_state: "BLOCK"
  visuals:
    per_entry:
      hero_required: 1
      inline_required: 1
      inline_optional_preferred: 1
    delivery: "supplemental assets + placement metadata (no edits to canonical PDF)"
  governance:
    no_filename_reuse_for_lockables: true
