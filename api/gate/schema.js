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

  try {
    const raw = fs.readFileSync(p,'utf-8');
    // return canonical schema verbatim
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(raw);
  } catch {
    return json(res, 500, { error: 'SCHEMA_READ_FAILED' });
  }
};
