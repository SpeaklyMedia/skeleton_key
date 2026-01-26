import { readJson, json } from '../_lib/http.js';
import { requireAuth } from '../_lib/auth.js';
import { getGateData, getValidKeyForEntry } from '../_lib/gateData.js';
import { getGateState, saveGateState } from '../_lib/gateState.js';
import { persistGateState } from '../_lib/wp.js';

const MAX_ATTEMPTS_PER_HOUR = 3;
const WINDOW_MS = 60 * 60 * 1000;
const COOLDOWN_MS = 15 * 60 * 1000;

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

  const { partsOrdered, entriesByPart, entryIds, keyData, keyStatus } = getGateData();

  if (keyStatus.key_status !== 'KEYED') {
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

  attempt.count += 1;
  if (attempt.count > MAX_ATTEMPTS_PER_HOUR) {
    attempt.lockedUntil = Math.max(attempt.lockedUntil || 0, attempt.windowStart + WINDOW_MS);
    attempts[entryId] = attempt;
    state.attempts = attempts;
    saveGateState(auth.secret, res, state);
    const waitSec = Math.ceil((attempt.lockedUntil - now) / 1000);
    return json(res, 429, { error: 'RATE_LIMIT', retry_after_seconds: waitSec });
  }

  const keyEntry = getValidKeyForEntry(keyData, entryId);
  if (!keyEntry) {
    return json(res, 423, { error: 'KEY_INVALID' });
  }

  const correct = choiceId === keyEntry.correct_choice_id;
  if (!correct) {
    attempt.lockedUntil = Math.max(attempt.lockedUntil || 0, now + COOLDOWN_MS);
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
    const completedAt = new Date().toISOString();
    const wp = await persistGateState({
      access_gate_status: 'COMPLETE',
      access_gate_score: state.access_gate_score,
      access_gate_completed_at: completedAt,
      session_id: auth.session.sid
    });
    if (!wp.ok) {
      saveGateState(auth.secret, res, state);
      return json(res, 403, { error: wp.reason || 'WP_BLOCKED' });
    }
    state.access_gate_status = 'COMPLETE';
    state.access_gate_completed_at = completedAt;
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
