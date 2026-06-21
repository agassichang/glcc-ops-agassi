import { getRecords, m } from '@/lib/records'
import Empty from '@/app/_components/Empty'

export const dynamic = 'force-dynamic'

// Influencer marketing roster. category === 'influencer'. Marketing-safe fields
// (social handles, join date, referral code) live in `meta`. We deliberately do
// NOT store any PII (phone, DOB, email, address, measurements) — see the sync
// route. Same one-table, server-component pattern as every other tab.
const has = (r: { meta?: Record<string, any> }, k: string) => {
  const v = r.meta?.[k]
  return v != null && v !== '' && v !== '-'
}

// Render an Instagram handle/URL as a link that opens the profile in a new tab.
// Handles full URLs, "@handle", and plain "handle"; shows a dash when empty.
function InstagramCell({ raw }: { raw: unknown }) {
  const s = String(raw ?? '').trim()
  if (!s || s === '—' || /^n\/?a$/i.test(s)) return <>—</>
  let handle: string, href: string
  if (/^https?:\/\//i.test(s)) {
    href = s
    const match = s.match(/instagram\.com\/([^/?#\s]+)/i)
    handle = match ? '@' + match[1] : s
  } else {
    const clean = s.replace(/^@/, '').replace(/\s+/g, '')
    handle = '@' + clean
    href = 'https://www.instagram.com/' + clean
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" className="ext">{handle}</a>
}

export default async function Influencers() {
  const all = await getRecords()
  const rows = all.filter(r => r.category === 'influencer')

  // Sort A→Z by name; names that don't start with a letter (numbers, symbols,
  // blanks) sort after Z.
  const startsAlpha = (s: string) => /^[a-z]/i.test(s.trim())
  rows.sort((a, b) => {
    const A = (a.title || '').trim(), B = (b.title || '').trim()
    const aAlpha = startsAlpha(A), bAlpha = startsAlpha(B)
    if (aAlpha !== bAlpha) return aAlpha ? -1 : 1
    return A.localeCompare(B, undefined, { sensitivity: 'base' })
  })

  const cards: [string, string | number][] = [
    ['Total influencers', rows.length],
    ['On Instagram', rows.filter(r => has(r, 'instagram')).length],
    ['On TikTok', rows.filter(r => has(r, 'tiktok')).length],
    ['On YouTube', rows.filter(r => has(r, 'youtube')).length],
  ]

  return (
    <>
      <h1 className="ph">Influencer Marketing</h1>
      <p className="cap">Creators &amp; ambassadors · {rows.length} total</p>
      <div className="grid">
        {cards.map(([l, v]) => (
          <div className="stat" key={l}><p className="l">{l}</p><p className="v">{v}</p></div>
        ))}
      </div>
      {all.length === 0 ? <Empty /> : rows.length === 0 ? (
        <p className="empty">No influencers yet — sync your Google Sheet via <code>/api/sync-influencers</code>.</p>
      ) : (
        <table className="tbl">
          <thead><tr><th>Name</th><th>Instagram</th><th>TikTok</th><th>YouTube</th><th>Join date</th><th>Referral code</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td data-label="Name">{r.title}</td>
                <td data-label="Instagram"><InstagramCell raw={r.meta?.instagram} /></td>
                <td data-label="TikTok">{m(r, 'tiktok')}</td>
                <td data-label="YouTube">{m(r, 'youtube')}</td>
                <td data-label="Join date">{m(r, 'join_date')}</td>
                <td data-label="Referral code">{m(r, 'referral_code')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
