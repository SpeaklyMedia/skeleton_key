import { useEffect, useMemo, useState } from 'react'
import './App.css'

function Banner({ children }) {
  return (
    <div className="banner">
      {children}
    </div>
  )
}

function buildParts(items) {
  const out = []
  const seen = new Set()
  for (const it of items || []) {
    const label = it?.part?.label
    if (label && !seen.has(label)) {
      seen.add(label)
      out.push({
        label,
        roman: it?.part?.roman || '',
        name: it?.part?.name || ''
      })
    }
  }
  return out
}

function buildEntriesByPart(items) {
  const map = {}
  for (const it of items || []) {
    const label = it?.part?.label
    if (!label) continue
    if (!map[label]) map[label] = []
    map[label].push(it)
  }
  return map
}

function LockedPanel({ title, body }) {
  return (
    <div className="lockedPanel">
      <div className="lockedPanelTitle">{title}</div>
      <div className="lockedPanelBody">{body}</div>
    </div>
  )
}

function GateCompletePanel() {
  return (
    <div className="completePanel">
      <div className="completePanelTitle">Gate Complete</div>
      <div className="completePanelRow">
        <span>WORKBOOK_URL</span>
        <code>__PM_NOT_PROVIDED__</code>
      </div>
      <div className="completePanelRow">
        <span>BUTTON_LABEL</span>
        <code>__PM_NOT_PROVIDED__</code>
      </div>
    </div>
  )
}

function WorkbookShell({ route, onNavigate, children }) {
  return (
    <div className="workbookShell">
      <header className="workbookHeader">
        <div className="workbookBrand">
          <div className="workbookKicker">Prompt Engineering Workbook</div>
          <h1>Skeleton Key</h1>
        </div>
        <nav className="workbookNav">
          <button
            type="button"
            className={`navBtn ${route === '/home' ? 'active' : ''}`}
            onClick={() => onNavigate('/home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`navBtn ${route === '/' || route === '/gate' ? 'active' : ''}`}
            onClick={() => onNavigate('/gate')}
          >
            Access Gate
          </button>
          <button
            type="button"
            className={`navBtn ${route === '/lesson/template-a' ? 'active' : ''}`}
            onClick={() => onNavigate('/lesson/template-a')}
          >
            Template A
          </button>
          <button
            type="button"
            className={`navBtn ${route === '/lesson/template-b' ? 'active' : ''}`}
            onClick={() => onNavigate('/lesson/template-b')}
          >
            Template B
          </button>
        </nav>
      </header>
      <div className="workbookBody">{children}</div>
    </div>
  )
}

function WorkbookHome({ gateComplete, onNavigate }) {
  return (
    <div className="homeLayout">
      <section className="homeHero">
        <div className="homeBadge">v2 Workbook Mode</div>
        <h2>Prompt Engineering Workbook</h2>
        <p>
          A structured catalog of lessons and templates. Complete the Access Gate
          to unlock lesson content.
        </p>
      </section>

      <section className="homeCards">
        <div className="homeCard">
          <div className="homeCardMeta">Access Gate</div>
          <h3>Gate Status</h3>
          <p>Complete 19/19 to unlock workbook lessons.</p>
          <button className="homeCardBtn" type="button" onClick={() => onNavigate('/gate')}>
            Open Gate
          </button>
        </div>
        <div className={`homeCard ${gateComplete ? '' : 'isLocked'}`}>
          <div className="homeCardMeta">Lesson Template A</div>
          <h3>Workbook Standard</h3>
          <p>Structured lesson layout with notes, callouts, and figures.</p>
          <button
            className="homeCardBtn"
            type="button"
            onClick={() => onNavigate('/lesson/template-a')}
            disabled={!gateComplete}
          >
            View Template
          </button>
          {!gateComplete && <div className="homeCardLock">Locked until complete.</div>}
        </div>
        <div className={`homeCard ${gateComplete ? '' : 'isLocked'}`}>
          <div className="homeCardMeta">Lesson Template B</div>
          <h3>Alternate Layout</h3>
          <p>Variation layout for chapter narratives and reference content.</p>
          <button
            className="homeCardBtn"
            type="button"
            onClick={() => onNavigate('/lesson/template-b')}
            disabled={!gateComplete}
          >
            View Template
          </button>
          {!gateComplete && <div className="homeCardLock">Locked until complete.</div>}
        </div>
      </section>

      {gateComplete && (
        <section className="homeComplete">
          <GateCompletePanel />
        </section>
      )}
    </div>
  )
}

function LessonTemplateA() {
  return (
    <div className="lessonLayout lessonA">
      <header className="lessonHero">
        <div className="lessonTag">Template A</div>
        <h2>Workbook Lesson Template</h2>
        <p>Standard layout aligned to MVP #1 for structured lesson delivery.</p>
      </header>
      <section className="lessonSection">
        <div className="lessonCard">
          <h3>Key Idea</h3>
          <p>Lesson content placeholder (no story content injected).</p>
        </div>
        <div className="lessonCallout">
          <div className="calloutTitle">Callout</div>
          <p>Use this panel for definitions or constraints.</p>
        </div>
      </section>
      <section className="lessonFigure">
        <div className="figureFrame">
          <img src="/assets/mvp1/diagrams/FIG_01_01.svg" alt="Diagram FIG_01_01" />
        </div>
        <div className="figureCaption">Figure 1.1 — Diagram reference</div>
      </section>
      <section className="lessonGrid">
        <div className="lessonCard">
          <h4>Checklist</h4>
          <ul>
            <li>Requirement A</li>
            <li>Requirement B</li>
            <li>Requirement C</li>
          </ul>
        </div>
        <div className="lessonCard">
          <h4>Notes</h4>
          <p>Use this column for concise bullet notes.</p>
        </div>
      </section>
    </div>
  )
}

function LessonTemplateB() {
  return (
    <div className="lessonLayout lessonB">
      <header className="lessonHero alt">
        <div className="lessonTag">Template B</div>
        <h2>Alternate Chapter Layout</h2>
        <p>Variation layout aligned to MVP #2 for narrative chapters.</p>
      </header>
      <section className="lessonSection">
        <div className="lessonCard">
          <h3>Section Header</h3>
          <p>Structured paragraph block placeholder.</p>
        </div>
        <div className="lessonCard">
          <h3>Reference Block</h3>
          <p>Use for definitions, constraints, or summary notes.</p>
        </div>
      </section>
      <section className="lessonFigure">
        <div className="figureFrame alt">
          <img src="/assets/mvp1/diagrams/FIG_04_01.svg" alt="Diagram FIG_04_01" />
        </div>
        <div className="figureCaption">Figure 4.1 — Diagram reference</div>
      </section>
      <section className="lessonGrid">
        <div className="lessonCard">
          <h4>Checklist</h4>
          <ul>
            <li>Checkpoint 1</li>
            <li>Checkpoint 2</li>
            <li>Checkpoint 3</li>
          </ul>
        </div>
        <div className="lessonCard">
          <h4>Inline Callout</h4>
          <p>Place an emphasis box here when needed.</p>
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('LOCKED') // LOCKED | AUTHED | ERROR
  const [error, setError] = useState('')
  const [schema, setSchema] = useState(null)
  const [gateState, setGateState] = useState(null)
  const [entryChoice, setEntryChoice] = useState({})
  const [entryMsg, setEntryMsg] = useState({})
  const [route, setRoute] = useState(() => window.location.pathname || '/')

  const parts = useMemo(() => buildParts(schema?.items), [schema])
  const entriesByPart = useMemo(() => buildEntriesByPart(schema?.items), [schema])

  const partsLabel = useMemo(() => {
    if (!parts.length) return ''
    return parts.map(p => `${p.roman || ''}`.trim()).filter(Boolean).join(' → ')
  }, [parts])

  const activePartLabel = useMemo(() => {
    if (!parts.length) return null
    const progress = gateState?.progress || {}
    for (const part of parts) {
      const p = progress[part.label]
      if (!p || p.correct < p.total) return part.label
    }
    return null
  }, [parts, gateState])

  const gateComplete = gateState?.access_gate_status === 'COMPLETE'
  const isAuthed = status === 'AUTHED'
  const workbookEnabled = gateComplete

  useEffect(() => {
    document.documentElement.dataset.theme = workbookEnabled ? 'workbook' : 'gate'
  }, [workbookEnabled])

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function navigate(path) {
    if (path === route) return
    window.history.pushState({}, '', path)
    setRoute(path)
  }

  async function doAuth(e) {
    e.preventDefault()
    setError('')
    try {
      const r = await fetch('/api/session', {
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

  async function loadGate() {
    const [schemaRes, stateRes] = await Promise.all([
      fetch('/api/gate/schema'),
      fetch('/api/gate/state')
    ])
    if (!schemaRes.ok) {
      const j = await schemaRes.json().catch(() => ({}))
      throw new Error(j.error || 'SCHEMA_FAILED')
    }
    if (!stateRes.ok) {
      const j = await stateRes.json().catch(() => ({}))
      throw new Error(j.error || 'STATE_FAILED')
    }
    const s = await schemaRes.json()
    const st = await stateRes.json()
    return { s, st }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (status !== 'AUTHED') return
      try {
        const { s, st } = await loadGate()
        if (cancelled) return
        setSchema(s)
        setGateState(st)
      } catch (e) {
        if (!cancelled) {
          setStatus('ERROR')
          setError(e.message || 'GATE_FAILED')
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [status])

  async function submitAttempt(entryId) {
    if (gateComplete) return
    setEntryMsg(prev => ({ ...prev, [entryId]: '' }))
    const choiceId = entryChoice[entryId]
    if (!choiceId) {
      setEntryMsg(prev => ({ ...prev, [entryId]: 'Choose A–D before submitting.' }))
      return
    }
    try {
      const r = await fetch('/api/gate/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, choice_id: choiceId })
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setEntryMsg(prev => ({ ...prev, [entryId]: j.error || 'ATTEMPT_FAILED' }))
      } else {
        setEntryMsg(prev => ({ ...prev, [entryId]: 'Recorded.' }))
      }
      const { s, st } = await loadGate()
      setSchema(s)
      setGateState(st)
    } catch {
      setEntryMsg(prev => ({ ...prev, [entryId]: 'NETWORK_ERROR' }))
    }
  }

  const keysPresent = !!schema?.keys_present
  const keyStatus = schema?.key_status || schema?.answer_key_status || 'NOT_READY'

  const gateView = (
    <main className="main">
      <section className="card">
        <h2>Access Gate Meta</h2>
        <div className="grid">
          <div><span>Schema</span><b>{schema?.schema_id || 'NOT DEFINED'}</b></div>
          <div><span>Version</span><b>{schema?.version || 'NOT DEFINED'}</b></div>
          <div><span>Parts</span><b>{parts.length}</b></div>
          <div><span>Entries</span><b>{schema?.entry_count || schema?.items?.length || 0}</b></div>
          <div><span>Key Status</span><b>{keyStatus}</b></div>
          <div><span>Keyed Entries</span><b>{schema?.keyed_entries_count || 0}</b></div>
          <div><span>Gate Status</span><b>{gateState?.access_gate_status || 'LOCKED'}</b></div>
          <div><span>Score</span><b>{gateState?.access_gate_score ?? 0}</b></div>
        </div>
        <div className="parts">Parts progression: <b>{partsLabel || 'NOT DEFINED'}</b></div>
      </section>

      <section className="card">
        <h2>Phase 2 MCQ Gate</h2>
        {!gateComplete && (
          <div className="lockedNotice">Gate remains locked until 19/19 correct. No partial credit.</div>
        )}
        {gateComplete && (
          <div className="successNotice">Gate complete. Access granted.</div>
        )}

        <div className="rail">
          {parts.map((p) => {
            const progress = gateState?.progress?.[p.label]
            const complete = progress && progress.total > 0 && progress.correct === progress.total
            const active = p.label === activePartLabel
            const locked = !complete && !active
            return (
              <div key={p.label} className={`railItem ${complete ? 'done' : ''} ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}>
                <div className="railRoman">{p.roman || '?'}</div>
                <div className="railName">{p.name || p.label}</div>
              </div>
            )
          })}
        </div>

        {!keysPresent && (
          <div className="lockedNotice">Answer keys not present. Gate remains locked.</div>
        )}

        {activePartLabel && (
          <div className="partBlock">
            <h3>Active Part: {parts.find(p => p.label === activePartLabel)?.roman} — {parts.find(p => p.label === activePartLabel)?.name}</h3>
            {(entriesByPart[activePartLabel] || []).map((entry) => {
              const mcq = entry.validation?.mcq
              const options = Array.isArray(mcq?.options) ? mcq.options : []
              return (
                <div key={entry.id} className="entryCard">
                  <div className="entryMeta">
                    <div><span>Entry</span><b>{entry.id}</b></div>
                    <div><span>PDF Page</span><b>{entry.pdf_page_start ?? '—'}</b></div>
                  </div>
                  <div className="entryStory"><span>Known Story</span><p>{entry.known_story || '—'}</p></div>
                  <div className="entryStory"><span>Layer 2 Consideration</span><p>{entry.layers?.layer2_consideration || '—'}</p></div>
                  <div className="entryStory"><span>Layer 3 Access Question</span><p>{entry.layers?.layer3_access_question || '—'}</p></div>

                  <div className="mcq">
                    {options.map((opt) => (
                      <label key={`${entry.id}-${opt.id}`} className="mcqChoice">
                        <input
                          type="radio"
                          name={`choice-${entry.id}`}
                          value={opt.id}
                          checked={entryChoice[entry.id] === opt.id}
                          onChange={() => setEntryChoice(prev => ({ ...prev, [entry.id]: opt.id }))}
                          disabled={!keysPresent || gateComplete}
                        />
                        <span>{`${opt.id}. ${opt.text}`}</span>
                      </label>
                    ))}
                  </div>

                  <div className="entryActions">
                    <button
                      type="button"
                      onClick={() => submitAttempt(entry.id)}
                      disabled={!keysPresent || gateComplete}
                    >
                      Submit
                    </button>
                    {entryMsg[entry.id] && <div className="entryMsg">{entryMsg[entry.id]}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )

  const lessonLocked = (
    <LockedPanel
      title="Locked until complete"
      body="Finish the Access Gate (19/19) to unlock lesson content."
    />
  )

  let workbookContent = null
  if (route === '/home') {
    workbookContent = <WorkbookHome gateComplete={gateComplete} onNavigate={navigate} />
  } else if (route === '/lesson/template-a') {
    workbookContent = gateComplete ? <LessonTemplateA /> : lessonLocked
  } else if (route === '/lesson/template-b') {
    workbookContent = gateComplete ? <LessonTemplateB /> : lessonLocked
  } else {
    workbookContent = gateView
  }

  return (
    <div className="shell">
      {!isAuthed && (
        <>
          <header className="header">
            <h1>🗝️ Skeleton Key — Access Gate</h1>
            <p className="sub">Fail-closed. 100% required (19/19). No partial credit. No brute force.</p>
          </header>

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
        </>
      )}

      {isAuthed && schema && gateState && (
        workbookEnabled ? (
          <WorkbookShell route={route} onNavigate={navigate}>
            {workbookContent}
          </WorkbookShell>
        ) : (
          gateView
        )
      )}

      {status === 'ERROR' && (
        <Banner>
          <div className="err">{error || 'ERROR'}</div>
        </Banner>
      )}
    </div>
  )
}
