import { getSignedCookie, setSignedCookie } from './auth.js';

const STATE_COOKIE = 'sk_gate_state';

export function defaultGateState(sid) {
  return {
    sid,
    access_gate_status: 'INCOMPLETE',
    access_gate_score: 0,
    access_gate_completed_at: null,
    part_progress: {},
    attempts: {}
  };
}

export function getGateState(secret, req, sid) {
  const state = getSignedCookie(secret, req, STATE_COOKIE);
  if (!state || state.sid !== sid) return defaultGateState(sid);
  if (!state.part_progress) state.part_progress = {};
  if (!state.attempts) state.attempts = {};
  return state;
}

export function saveGateState(secret, res, state) {
  setSignedCookie(secret, res, STATE_COOKIE, state, { maxAge: 60 * 60 * 24 });
}

export function getStateCookieName() {
  return STATE_COOKIE;
}
