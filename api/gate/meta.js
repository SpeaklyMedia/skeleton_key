const fs = require('fs');
const path = require('path');
const { json } = require('../_lib/http');
const { requireAuth } = require('../_lib/auth');

function schemaPath() {
  return path.join(
    process.cwd(),
    'artifacts','access-gate',
    'PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R1',
    'PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R1',
    'schemas','ACCESS_GATE_MCQ_SCHEMA.json'
  );
}

module.exports = async (req, res) => {
  const auth = requireAuth(req);
  if (!auth.ok) return json(res, auth.code, { error: auth.error, message: 'Locked' });

  const p = schemaPath();
  if (!fs.existsSync(p)) return json(res, 500, { error: 'SCHEMA_NOT_FOUND' });

  let schema;
  try { schema = JSON.parse(fs.readFileSync(p,'utf-8')); }
  catch { return json(res, 500, { error: 'SCHEMA_PARSE_FAILED' }); }

  const items = Array.isArray(schema.items) ? schema.items : [];
  const partsOrdered = [];
  const seen = new Set();
  for (const it of items) {
    const label = it?.part?.label;
    if (label && !seen.has(label)) { seen.add(label); partsOrdered.push({
      label,
      roman: it?.part?.roman || null,
      name: it?.part?.name || null
    }); }
  }

  return json(res, 200, {
    schema_id: schema.schema_id || null,
    version: schema.version || null,
    entry_count: schema.entry_count ?? items.length,
    part_count: partsOrdered.length,
    parts: partsOrdered
  });
};
