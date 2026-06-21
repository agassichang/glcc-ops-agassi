import { NextResponse } from 'next/server'
import { AUTH_COOKIE, expectedToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Check the shared password; on success, set an httpOnly cookie holding the
// password hash. The raw password is never stored or returned.
export async function POST(req: Request) {
  const pw = process.env.APP_PASSWORD
  if (!pw) return NextResponse.json({ ok: false, reason: 'no_password_configured' }, { status: 500 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, reason: 'bad_json' }, { status: 400 }) }

  if (String(body?.password ?? '') !== pw) {
    return NextResponse.json({ ok: false, reason: 'wrong' }, { status: 401 })
  }
  const token = await expectedToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}
