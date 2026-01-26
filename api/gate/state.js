import { json } from '../_lib/http.js';
import { requireAuth } from '../_lib/auth.js';
import { getGateState } from '../_lib/gateState.js';
import { getGateData } from '../_lib/gateData.js';

export default async (req, res) => {
  const auth = requireAuth(req);
  if (!auth.ok) return json(res, auth.code, { error: auth.error, message: 'Locked' });

  const state = getGateState(auth.secret, req, auth.session.sid);
  const { partsOrdered, entriesByPart } = getGateData();

  const progress = {};
  for (const part of partsOrdered) {
    const label = part.label;
    const entries = entriesByPart[label] || [];
    const correct = state.part_progress?.[label]?.correct_entries || [];
    progress[label] = { total: entries.length, correct: correct.length };
  }

  return json(res, 200, {
    access_gate_status: state.access_gate_status,
    access_gate_score: state.access_gate_score,
    access_gate_completed_at: state.access_gate_completed_at,
    progress
  });
};
