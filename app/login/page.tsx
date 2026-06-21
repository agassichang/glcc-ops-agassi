'use client'
import { useState } from 'react'

export default function Login() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.ok) {
        const next = new URLSearchParams(window.location.search).get('next') || '/'
        window.location.href = next.startsWith('/') ? next : '/'
      } else if (data.reason === 'no_password_configured') {
        setErr('No password is set yet — add APP_PASSWORD in your environment.')
      } else {
        setErr('Incorrect password.')
      }
    } catch {
      setErr('Something went wrong — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand"><span className="logo" aria-hidden="true" /> Your AI HQ</div>
        <h1 className="login-title">Sign in</h1>
        <p className="login-sub">Enter the password to access your HQ.</p>
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          autoFocus
          aria-label="Password"
        />
        {err && <p className="login-err">{err}</p>}
        <button className="btn login-btn" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
