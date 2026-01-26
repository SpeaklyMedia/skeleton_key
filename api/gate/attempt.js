import { readJson, json } from '../_lib/http.js';
import { requireAuth } from '../_lib/auth.js';
import { getGateData, getCorrectOptionId } from '../_lib/gateData.js';
import { getGateState, saveGateState } from '../_lib/gateState.js';

const WINDOW_MS = 60 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function computeActivePart(partsOrdered, entriesByPart, state) {
  for (const part of partsOrdered) {
    const label = part.label;
    const entries = entriesByPart[label] || [];
    const progress = state.part_progress?.[label]?.correct_entries || [];
    if (progress.length < entries.length) return label;
  }
  return null;
}

function countScore(partsOrdered, state) {
  let score = 0;
  for (const part of partsOrdered) {
    const entries = state.part_progress?.[part.label]?.correct_entries || [];
    score += entries.length;
  }
  return score;
}

export default async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const auth = requireAuth(req);
  if (!auth.ok) return json(res, auth.code, { error: auth.error, message: 'Locked' });

  let body = {};
  try { body = await readJson(req); }
  catch { return json(res, 400, { error: 'INVALID_JSON' }); }

  const entryId = String(body.entry_id || '');
  const choiceId = String(body.choice_id || '');

  const { partsOrdered, entriesByPart, entryIds, keyStatus, items } = getGateData();

  if (!keyStatus.keys_present) {
    return json(res, 423, {
      error: 'KEYS_NOT_READY',
      key_status: keyStatus.key_status,
      keys_present: keyStatus.keys_present,
      keyed_entries_count: keyStatus.keyed_entries_count
    });
  }

  if (!entryIds.includes(entryId)) return json(res, 400, { error: 'ENTRY_INVALID' });
  if (!['A','B','C','D'].includes(choiceId)) return json(res, 400, { error: 'CHOICE_INVALID' });

  const state = getGateState(auth.secret, req, auth.session.sid);
  if (state.access_gate_status === 'COMPLETE') {
    return json(res, 409, { error: 'ALREADY_COMPLETE' });
  }

  const activePartLabel = computeActivePart(partsOrdered, entriesByPart, state);
  const entryPart = Object.keys(entriesByPart).find(k => (entriesByPart[k] || []).includes(entryId));
  if (!entryPart || entryPart !== activePartLabel) {
    return json(res, 409, { error: 'PART_LOCKED', active_part_label: activePartLabel });
  }

  const now = nowMs();
  const attempts = state.attempts || {};
  const attempt = attempts[entryId] || { count: 0, windowStart: now, lockedUntil: 0, lastFailAt: 0 };

  if (now - attempt.windowStart >= WINDOW_MS) {
    attempt.count = 0;
    attempt.windowStart = now;
    attempt.lockedUntil = 0;
    attempt.lastFailAt = 0;
  }

  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const waitSec = Math.ceil((attempt.lockedUntil - now) / 1000);
    return json(res, 429, { error: 'COOLDOWN', retry_after_seconds: waitSec });
  }

  const anti = items.find(it => it?.id === entryId)?.validation?.anti_bruteforce || {};
  const cooldownSeconds = Number(anti.cooldown_seconds || 60);
  const maxAttempts = Number(anti.max_attempts_before_lock || 5);

  attempt.count += 1;
  if (attempt.count > maxAttempts) {
    attempt.lockedUntil = Math.max(attempt.lockedUntil || 0, attempt.windowStart + WINDOW_MS);
    attempts[entryId] = attempt;
    state.attempts = attempts;
    saveGateState(auth.secret, res, state);
    const waitSec = Math.ceil((attempt.lockedUntil - now) / 1000);
    return json(res, 429, { error: 'RATE_LIMIT', retry_after_seconds: waitSec });
  }

  const correctOption = getCorrectOptionId(items, entryId);
  if (!correctOption) return json(res, 423, { error: 'KEY_INVALID' });

  const correct = choiceId === correctOption;
  if (!correct) {
    attempt.lockedUntil = Math.max(attempt.lockedUntil || 0, now + cooldownSeconds * 1000);
    attempt.lastFailAt = now;
    attempts[entryId] = attempt;
    state.attempts = attempts;
    state.part_progress[entryPart] = { correct_entries: [] };
    state.access_gate_score = countScore(partsOrdered, state);
    saveGateState(auth.secret, res, state);
    const waitSec = Math.ceil((attempt.lockedUntil - now) / 1000);
    return json(res, 401, {
      error: 'INCORRECT',
      reset: 'PART',
      active_part_label: entryPart,
      retry_after_seconds: waitSec,
      access_gate_score: state.access_gate_score,
      access_gate_status: state.access_gate_status
    });
  }

  attempts[entryId] = attempt;
  state.attempts = attempts;
  const partProgress = state.part_progress[entryPart] || { correct_entries: [] };
  if (!partProgress.correct_entries.includes(entryId)) partProgress.correct_entries.push(entryId);
  state.part_progress[entryPart] = partProgress;
  state.access_gate_score = countScore(partsOrdered, state);

  const nextActive = computeActivePart(partsOrdered, entriesByPart, state);
  const isComplete = !nextActive;

  if (isComplete) {
    state.access_gate_status = 'COMPLETE';
    state.access_gate_completed_at = new Date().toISOString();
    saveGateState(auth.secret, res, state);
    return json(res, 200, {
      ok: true,
      access_gate_status: state.access_gate_status,
      access_gate_score: state.access_gate_score,
      access_gate_completed_at: state.access_gate_completed_at
    });
  }

  saveGateState(auth.secret, res, state);
  return json(res, 200, {
    ok: true,
    correct: true,
    active_part_label: nextActive,
    access_gate_score: state.access_gate_score,
    access_gate_status: state.access_gate_status
  });
};
