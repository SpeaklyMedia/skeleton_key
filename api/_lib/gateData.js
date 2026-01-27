import fs from 'node:fs';
import path from 'node:path';

export function getSchemaPath() {
  return path.join(
    process.cwd(),
    'artifacts','access-gate',
    'PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R2_1',
    'PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R2_1',
    'schemas','ACCESS_GATE_MCQ_SCHEMA.json'
  );
}

export function readSchema() {
  const p = getSchemaPath();
  if (!fs.existsSync(p)) throw new Error('SCHEMA_NOT_FOUND');
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw);
}

export function buildParts(items) {
  const partsOrdered = [];
  const seen = new Set();
  for (const it of items) {
    const label = it?.part?.label;
    if (label && !seen.has(label)) {
      seen.add(label);
      partsOrdered.push({
        label,
        roman: it?.part?.roman || null,
        name: it?.part?.name || null
      });
    }
  }
  return partsOrdered;
}

export function buildEntriesByPart(items) {
  const map = {};
  for (const it of items) {
    const label = it?.part?.label;
    const id = it?.id;
    if (!label || !id) continue;
    if (!map[label]) map[label] = [];
    map[label].push(id);
  }
  return map;
}

export function getEntryIds(items) {
  return items.map(it => it?.id).filter(Boolean);
}

function isValidMcq(entry) {
  const mcq = entry?.validation?.mcq;
  if (!mcq) return false;
  const options = mcq.options;
  const correct = mcq.correct_option_id;
  if (!['A','B','C','D'].includes(correct)) return false;
  if (!Array.isArray(options) || options.length !== 4) return false;
  const ids = options.map(o => o?.id).sort().join('');
  if (ids !== 'ABCD') return false;
  if (options.some(o => !String(o?.text || '').trim())) return false;
  return true;
}

export function computeKeyStatus(schema) {
  const items = Array.isArray(schema?.items) ? schema.items : [];
  const totalEntries = items.length;
  const keyedEntriesCount = items.filter(isValidMcq).length;
  const keysPresent = keyedEntriesCount === totalEntries && totalEntries > 0;

  let keyStatus = schema?.answer_key_status || 'NOT_READY';
  if (!keysPresent) keyStatus = 'NOT_READY';

  return {
    key_status: keyStatus,
    keys_present: keysPresent,
    keyed_entries_count: keyedEntriesCount,
    total_entries: totalEntries
  };
}

export function getGateData() {
  const schema = readSchema();
  const items = Array.isArray(schema.items) ? schema.items : [];
  const partsOrdered = buildParts(items);
  const entriesByPart = buildEntriesByPart(items);
  const entryIds = getEntryIds(items);
  const keyStatus = computeKeyStatus(schema);
  return { schema, items, partsOrdered, entriesByPart, entryIds, keyStatus };
}

export function getCorrectOptionId(items, entryId) {
  const entry = items.find(it => it?.id === entryId);
  if (!entry) return null;
  const mcq = entry?.validation?.mcq;
  const correct = mcq?.correct_option_id;
  if (!['A','B','C','D'].includes(correct)) return null;
  return correct;
}
