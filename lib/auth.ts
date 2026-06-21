// Shared, edge-compatible auth helpers for the simple shared-password gate.
// The cookie stores a hash of APP_PASSWORD (never the password itself).
export const AUTH_COOKIE = 'glcc_auth'

export async function expectedToken(): Promise<string | null> {
  const pw = process.env.APP_PASSWORD
  if (!pw) return null
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('glcc::' + pw))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}
