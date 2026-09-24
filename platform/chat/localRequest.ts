// =============================================================================
// Chat · "is this the designer, at their own laptop?"
//
// Chat drives the `claude` CLI on the machine serving the studio, so the only
// person who should reach it without a password is whoever sits at that machine.
// `npm run dev` binds to 127.0.0.1, so nobody on the Wi-Fi can connect at all —
// but three things still arrive looking local, and each is refused here:
//
//   · A tunnel (the demo link). cloudflared connects from this laptop, so the
//     socket is loopback — but it forwards the public Host and stamps
//     X-Forwarded-For / CF-Connecting-IP with the real visitor.
//   · Another website in the designer's own browser. A page on any site can
//     POST to localhost:4000 without a preflight; the browser still names the
//     page's Origin, and that Origin isn't ours.
//   · DNS rebinding — an attacker's hostname pointed at 127.0.0.1. The Host
//     header still carries their name.
//
// Anything that fails falls back to the editing password, as before. Next fills
// X-Forwarded-For with the socket address only when nothing upstream set it
// (base-server.js), so a loopback value there really is the socket.
// =============================================================================

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])
const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
// Set only by proxies. Their presence alone means someone relayed this request.
const PROXY_HEADERS = ['cf-connecting-ip', 'cf-ray', 'x-real-ip', 'forwarded', 'true-client-ip']

function hostname(hostHeader: string): string {
  // "localhost:4000" → "localhost", "[::1]:4000" → "[::1]"
  return hostHeader.startsWith('[') ? hostHeader.slice(0, hostHeader.indexOf(']') + 1) : hostHeader.split(':')[0]
}

function loopbackHost(value: string | null): boolean {
  return value !== null && LOOPBACK_HOSTS.has(hostname(value.trim().toLowerCase()))
}

/** The page's own origin: same host and port as the request itself, so even
 *  another local app on a different port doesn't count. */
function sameOrigin(origin: string, host: string): boolean {
  try {
    return new URL(origin).host.toLowerCase() === host.trim().toLowerCase()
  } catch {
    return false // includes Origin: null, from sandboxed frames and file://
  }
}

export function isLocalRequest(request: Request): boolean {
  if (process.env.NODE_ENV !== 'development') return false
  const h = request.headers

  if (PROXY_HEADERS.some((name) => h.has(name))) return false
  const host = h.get('host')
  if (host === null || !loopbackHost(host)) return false
  const fwdHost = h.get('x-forwarded-host')
  if (fwdHost !== null && !loopbackHost(fwdHost)) return false

  const fwdFor = h.get('x-forwarded-for')
  if (fwdFor === null) return false
  if (!fwdFor.split(',').every((ip) => LOOPBACK_IPS.has(ip.trim()))) return false

  // Browsers send Origin on every POST and on cross-site GETs. A same-page
  // fetch from the studio carries http://localhost:4000; anything else is a
  // different site reaching in.
  const origin = h.get('origin')
  if (origin !== null && !sameOrigin(origin, host)) return false
  // "cross-site" catches the same, for browsers that omit Origin on a GET.
  if (h.get('sec-fetch-site') === 'cross-site') return false

  return true
}
