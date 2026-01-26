import { json } from '../_lib/http.js';
import { requireAuth } from '../_lib/auth.js';
import { getGateData } from '../_lib/gateData.js';

export default async (req, res) => {
  const auth = requireAuth(req);
  if (!auth.ok) return json(res, auth.code, { error: auth.error, message: 'Locked' });

  try {
    const { schema, partsOrdered, items, keyStatus } = getGateData();
    return json(res, 200, {
      schema_id: schema.schema_id || null,
      version: schema.version || null,
      entry_count: schema.entry_count ?? items.length,
      part_count: partsOrdered.length,
      parts: partsOrdered,
      key_status: keyStatus.key_status,
      keys_present: keyStatus.keys_present,
      keyed_entries_count: keyStatus.keyed_entries_count
    });
  } catch (e) {
    const code = String(e?.message || '').includes('SCHEMA_NOT_FOUND') ? 500 : 500;
    return json(res, code, { error: 'SCHEMA_READ_FAILED' });
  }
};
