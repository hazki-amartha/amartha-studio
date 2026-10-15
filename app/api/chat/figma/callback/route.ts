// Chat · back from Figma's sign-in: keep the login and say so.
// See platform/chat/server/figmaAuth.ts.

import { isOwner } from '@/platform/chat/server/cloud'
import { figmaAuthConfigured, finishLogin } from '@/platform/chat/server/figmaAuth'

export const dynamic = 'force-dynamic'

const page = (message: string, status = 200) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Figma</title>` +
      `<p style="font:16px/1.5 system-ui,sans-serif;margin:48px 24px">${message}</p>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  )

export async function GET(request: Request): Promise<Response> {
  if (!figmaAuthConfigured() || !(await isOwner())) return new Response(null, { status: 404 })
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) return page('Figma didn’t send the studio back a sign-in. Start again from /api/chat/figma/connect.', 400)
  try {
    await finishLogin(request, code, state)
    return page('Figma is connected. Chat can now read Figma links — you can close this tab.')
  } catch (err) {
    return page(`Couldn’t connect Figma: ${err instanceof Error ? err.message : String(err)}`, 400)
  }
}
