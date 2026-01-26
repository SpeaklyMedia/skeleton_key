import { json } from '../_lib/http.js';
import { requireAuth } from '../_lib/auth.js';
import { getGateData } from '../_lib/gateData.js';

export default async (req, res) => {
  const auth = requireAuth(req);
  if (!auth.ok) return json(res, auth.code, { error: auth.error, message: 'Locked' });

  try {
    const { schema, keyStatus } = getGateData();
    const payload = {
      ...schema,
      key_status: keyStatus.key_status,
      keys_present: keyStatus.keys_present,
      keyed_entries_count: keyStatus.keyed_entries_count
    };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload, null, 2));
  } catch {
    return json(res, 500, { error: 'SCHEMA_READ_FAILED' });
  }
};
