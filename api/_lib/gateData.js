import fs from 'node:fs';
import path from 'node:path';

export function getSchemaPath() {
  return path.join(
    process.cwd(),
    'artifacts','access-gate',
    'PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R1',
    'PEW_ACCESS_GATE_FULL_ARTIFACT_TRAVEL_20260125_R1',
    'schemas','ACCESS_GATE_MCQ_SCHEMA.json'
  );
}

export function getKeyPath() {
  return path.join(
    process.cwd(),
    'artifacts','access-gate','keying','ACCESS_GATE_MCQ_ANSWER_KEY_R1.json'
  );
}

export function readSchema() {
  const p = getSchemaPath();
  if (!fs.existsSync(p)) throw new Error('SCHEMA_NOT_FOUND');
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw);
}

export function readKeyFile() {
  const p = getKeyPath();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
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

function isValidKeyEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  const correct = entry.correct_choice_id;
  const choices = entry.choices;
  if (!['A','B','C','D'].includes(correct)) return false;
  if (!choices || typeof choices !== 'object') return false;
  for (const k of ['A','B','C','D']) {
    if (typeof choices[k] !== 'string' || !choices[k].trim()) return false;
  }
  return true;
}

export function computeKeyStatus(schema, keyData) {
  const items = Array.isArray(schema?.items) ? schema.items : [];
  const entryIds = getEntryIds(items);
  const totalEntries = entryIds.length;

  const keysObj = keyData?.keys && typeof keyData.keys === 'object' ? keyData.keys : {};
  const keyIds = Object.keys(keysObj);
  const keysPresent = keyIds.length > 0;

  let keyedCount = 0;
  let invalid = false;
  for (const id of keyIds) {
    if (!entryIds.includes(id)) { invalid = true; continue; }
    if (isValidKeyEntry(keysObj[id])) keyedCount += 1;
    else invalid = true;
  }

  let status = 'NOT_KEYED';
  if (keysPresent) {
    if (keyedCount === totalEntries && !invalid && keyIds.length === totalEntries) status = 'KEYED';
    else status = 'PARTIAL';
  }

  return {
    key_status: status,
    keys_present: keysPresent,
    keyed_entries_count: keyedCount,
    total_entries: totalEntries
  };
}

export function getGateData() {
  const schema = readSchema();
  const items = Array.isArray(schema.items) ? schema.items : [];
  const partsOrdered = buildParts(items);
  const entriesByPart = buildEntriesByPart(items);
  const entryIds = getEntryIds(items);
  const keyData = readKeyFile();
  const keyStatus = computeKeyStatus(schema, keyData);
  return { schema, items, partsOrdered, entriesByPart, entryIds, keyData, keyStatus };
}

export function getValidKeyForEntry(keyData, entryId) {
  const keysObj = keyData?.keys && typeof keyData.keys === 'object' ? keyData.keys : {};
  const entry = keysObj[entryId];
  if (!isValidKeyEntry(entry)) return null;
  return entry;
}
