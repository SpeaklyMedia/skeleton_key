export function getWpCreds() {
  const endpoint = process.env.WP_GATE_ENDPOINT;
  const user = process.env.WP_GATE_USER;
  const pass = process.env.WP_GATE_PASS;
  if (!endpoint || !user || !pass) return null;
  return { endpoint, user, pass };
}

export async function persistGateState(payload) {
  const creds = getWpCreds();
  if (!creds) return { ok: false, reason: 'WP_CREDS_MISSING' };

  try {
    const auth = Buffer.from(`${creds.user}:${creds.pass}`).toString('base64');
    const res = await fetch(creds.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return { ok: false, reason: 'WP_REQUEST_FAILED', status: res.status };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'WP_REQUEST_FAILED' };
  }
}
