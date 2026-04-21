import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL

function App() {
  const [token, setToken] = useState(localStorage.getItem('ringdash_token') || '')
  const [user, setUser] = useState(null)
  const [view, setView] = useState('dashboard') // dashboard | calls | callbacks
  const [calls, setCalls] = useState([])
  const [callbacks, setCallbacks] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [registerData, setRegisterData] = useState({ email: '', full_name: '' })

  useEffect(() => {
    if (token) {
      fetchUser()
      fetchAnalytics()
    }
  }, [token])

  async function fetchUser() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setUser(await res.json())
      else logout()
    } catch {}
  }

  async function fetchAnalytics() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setAnalytics(await res.json())
    } catch {}
  }

  async function fetchCalls() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/calls/?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setCalls(await res.json())
    } catch {}
    setLoading(false)
  }

  async function fetchCallbacks() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/calls/callbacks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setCallbacks(await res.json())
    } catch {}
    setLoading(false)
  }

  async function markCalledBack(callId) {
    try {
      const res = await fetch(`${API_BASE}/api/calls/${callId}/callback`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setCallbacks(prev => prev.filter(c => c.id !== callId))
      }
    } catch {}
  }

  function login(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    fetch(`${API_BASE}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password })
    })
      .then(r => r.json())
      .then(data => {
        setLoading(false)
        if (data.access_token) {
          localStorage.setItem('ringdash_token', data.access_token)
          setToken(data.access_token)
        } else setError(data.detail || 'Login failed')
      })
      .catch(() => { setLoading(false); setError('Connection error') })
  }

  function logout() {
    localStorage.removeItem('ringdash_token')
    setToken('')
    setUser(null)
    setView('dashboard')
  }

  if (!token) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h1>📞 Ringdash</h1>
          <p className="subtitle">Call Analytics Dashboard</p>
          {error && <div className="error">{error}</div>}
          <form onSubmit={login}>
            <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? '...' : 'Sign In'}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <nav className="navbar">
        <span className="logo">📞 Ringdash</span>
        <div className="nav-links">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'calls' ? 'active' : ''} onClick={() => { setView('calls'); fetchCalls() }}>Calls</button>
          <button className={view === 'callbacks' ? 'active' : ''} onClick={() => { setView('callbacks'); fetchCallbacks() }}>
            Callbacks {callbacks.length > 0 && <span className="badge">{callbacks.length}</span>}
          </button>
        </div>
        <div className="nav-user">
          <span>{user?.full_name || user?.username}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <main className="content">
        {view === 'dashboard' && (
          <div className="dashboard">
            <h2>Analytics Overview</h2>
            <div className="cards">
              <div className="card">
                <div className="card-label">Total Calls</div>
                <div className="card-value">{analytics?.total_calls ?? '—'}</div>
              </div>
              <div className="card">
                <div className="card-label">Avg Duration</div>
                <div className="card-value">{analytics?.average_duration ? `${(analytics.average_duration / 60).toFixed(1)} min` : '—'}</div>
              </div>
              <div className="card">
                <div className="card-label">Total Duration</div>
                <div className="card-value">{analytics?.total_duration ? `${(analytics.total_duration / 60).toFixed(1)} min` : '—'}</div>
              </div>
              <div className="card callback-card">
                <div className="card-label">Pending Callbacks</div>
                <div className="card-value callback-val">{callbacks.length}</div>
              </div>
            </div>
            <div className="refresh-row">
              <button onClick={() => { fetchAnalytics(); fetchCallbacks() }} className="refresh-btn">↻ Refresh</button>
            </div>
          </div>
        )}

        {view === 'callbacks' && (
          <div className="calls-view">
            <div className="calls-header">
              <h2>Pending Callbacks</h2>
              <button onClick={fetchCallbacks} className="refresh-btn">↻ Refresh</button>
            </div>
            {loading ? <p className="loading">Loading...</p> : callbacks.length === 0 ? (
              <div className="empty">
                <p>✅ No pending callbacks</p>
                <small>All missed calls have been handled.</small>
              </div>
            ) : (
              <div className="callback-list">
                {callbacks.map(call => (
                  <div key={call.id} className="callback-card-item">
                    <div className="callback-info">
                      <div className="callback-number">{call.from_number || '(Unknown)'}</div>
                      <div className="callback-meta">
                        <span>{call.to_number_display || call.to_number}</span>
                        <span className={`status ${call.status}`}>{call.status}</span>
                        <span className="callback-time">{formatAge(call.start_time)}</span>
                      <span className="callback-date">{formatDateTime(call.start_time)}</span>
                      </div>
                    </div>
                    <button className="called-back-btn" onClick={() => markCalledBack(call.id)}>
                      ✓ Called Back
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'calls' && (
          <div className="calls-view">
            <div className="calls-header">
              <h2>All Calls</h2>
              <button onClick={fetchCalls} className="refresh-btn">↻ Refresh</button>
            </div>
            {loading ? <p className="loading">Loading...</p> : calls.length === 0 ? (
              <div className="empty"><p>No calls yet.</p></div>
            ) : (
              <table className="calls-table">
                <thead>
                  <tr>
                    <th>Caller</th>
                    <th>Line</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Answered By</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map(call => (
                    <tr key={call.id}>
                      <td>
                        <div className="caller-cell">
                          <span className="caller-name">{call.caller_name || call.from_number}</span>
                          {call.caller_name && <span className="caller-number">{call.from_number}</span>}
                        </div>
                      </td>
                      <td>{call.to_number_display || call.to_number}</td>
                      <td>{call.caller_city && call.caller_state ? `${call.caller_city}, ${call.caller_state}` : call.caller_state || '—'}</td>
                      <td>
                        {call.carrier_type ? (
                          <span className={`carrier-badge ${call.carrier_type}`}>{call.carrier_type}</span>
                        ) : <span style={{color: 'var(--text-dim)', fontSize: '13px'}}>—</span>}
                      </td>
                      <td>
                        {call.answered_by ? (
                          <span className={`answered-badge ${call.answered_by}`}>{call.answered_by.replace('_', ' ')}</span>
                        ) : <span style={{color: 'var(--text-dim)', fontSize: '13px'}}>—</span>}
                      </td>
                      <td><span className={`status ${call.status}`}>{call.status}</span></td>
                      <td>{call.duration ? `${Math.round(call.duration / 60)}m ${call.duration % 60}s` : '—'}</td>
                      <td>{formatDateTime(call.start_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function formatAge(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatDateTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export default App
