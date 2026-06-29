import { eventList, eventConfigured } from '@/lib/event'

export const dynamic = 'force-dynamic'

// STAFF ONLY (login-gated by middleware). Returns all guests for the dashboard.
export async function GET() {
  if (!eventConfigured) return Response.json({ ok: false, reason: 'not_configured' }, { status: 503 })
  const result = await eventList()
  return Response.json(result)
}
