import { useEffect, useMemo, useState } from 'react'
import './App.css'

function Banner({ children }) {
  return (
    <div className="banner">
      {children}
    </div>
  )
}

export default function App() {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('LOCKED') // LOCKED | AUTHED | ERROR
  const [error, setError] = useState('')
  const [meta, setMeta] = useState(null)

  const partsLabel = useMemo(() => {
    if (!meta?.parts) return ''
    return meta.parts.map(p => `${p.roman || ''}`.trim()).filter(Boolean).join(' → ')
  }, [meta])

  async function doAuth(e) {
    e.preventDefault()
    setError('')
    try {
      const r = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        setStatus('ERROR')
        setError(j.error || 'AUTH_FAILED')
        return
      }
      setStatus('AUTHED')
      setPassword('')
    } catch {
      setStatus('ERROR')
      setError('NETWORK_ERROR')
    }
  }

  useEffect(() => {
    let cancelled = false
    async function loadMeta() {
      if (status !== 'AUTHED') return
      try {
        const r = await fetch('/api/gate/meta')
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          if (!cancelled) {
            setStatus('ERROR')
            setError(j.error || 'META_FAILED')
          }
          return
        }
        const j = await r.json()
        if (!cancelled) setMeta(j)
      } catch {
        if (!cancelled) {
          setStatus('ERROR')
          setError('NETWORK_ERROR')
        }
      }
    }
    loadMeta()
    return () => { cancelled = true }
  }, [status])

  return (
    <div className="shell">
      <header className="header">
        <h1>🗝️ Skeleton Key — Access Gate</h1>
        <p className="sub">Fail-closed. 100% required (19/19). No partial credit. No brute force.</p>
      </header>

      {status !== 'AUTHED' && (
        <Banner>
          <div className="locked">
            <div className="lockedTitle">Locked</div>
            <div className="lockedDesc">Enter password to load Access Gate data.</div>
            <form onSubmit={doAuth} className="authForm">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
              />
              <button type="submit">Unlock</button>
            </form>
            {error && <div className="err">{error}</div>}
            <div className="note">If required server secret or password env vars are missing, the system stays locked.</div>
          </div>
        </Banner>
      )}

      {status === 'AUTHED' && meta && (
        <main className="main">
          <section className="card">
            <h2>Access Gate Meta</h2>
            <div className="grid">
              <div><span>Schema</span><b>{meta.schema_id || 'NOT DEFINED'}</b></div>
              <div><span>Version</span><b>{meta.version || 'NOT DEFINED'}</b></div>
              <div><span>Parts</span><b>{meta.part_count}</b></div>
              <div><span>Entries</span><b>{meta.entry_count}</b></div>
            </div>
            <div className="parts">Parts progression: <b>{partsLabel || 'NOT DEFINED'}</b></div>
          </section>

          <section className="card">
            <h2>Phase 2 MCQ Gate</h2>
            <p>
              Engine wiring comes next. Canonical schema indicates answer keys are TBD.
              Gate remains fail-closed until keys are present.
            </p>
            <div className="pill">Status: LOCKED (TBD__REQUIRES_KEYING)</div>
          </section>
        </main>
      )}

      {status === 'ERROR' && (
        <Banner>
          <div className="err">{error || 'ERROR'}</div>
        </Banner>
      )}
    </div>
  )
}
