import { eventCheckin, fullPhone, eventConfigured } from '@/lib/event'

export const dynamic = 'force-dynamic'

// PUBLIC. A guest submits the digits after +601; we mark them checked in and
// return their seat info. Writing happens server-side via the Apps Script.
export async function POST(req: Request) {
  if (!eventConfigured) return Response.json({ ok: false, reason: 'not_configured' }, { status: 503 })
  let body: any
  try { body = await req.json() } catch { return Response.json({ ok: false, reason: 'bad_json' }, { status: 400 }) }

  const entered = String(body?.phone ?? '').replace(/[^0-9]/g, '')
  if (entered.length < 6) return Response.json({ ok: false, reason: 'bad_phone' }, { status: 400 })

  const result = await eventCheckin(fullPhone(entered))
  return Response.json(result)
}
