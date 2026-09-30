// =============================================================================
// New project · the gallery's New Project button.
//
//   POST { name, owner?, businessUnit, platform, start }  → { ok, slug }
//
// The project is created in the database (platform/projects/server/create.ts),
// so this runs on the dev server and on a deployment alike. Who may: on the
// dev server, the designer at this laptop (platform/chat/localRequest.ts) or
// the editing password; deployed, a signed-in editor.
// =============================================================================

import { configs } from '@/projects/configs'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { editCookie, verifyEditToken } from '@/platform/design/server/editGate'
import { isEditor, requestUser } from '@/platform/auth/laptop'
import { NotSignedIn } from '@/platform/dbProjects/remote'
import { listDbConfigs } from '@/platform/dbProjects/server'
import { OWNERS, ownerFor, type NewProjectRequest, type NewProjectResponse } from '@/platform/projects/protocol'
import { createProject, CreateRefused } from '@/platform/projects/server/create'
import type { BusinessUnit, Platform } from '@/platform/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUSINESS_UNITS: BusinessUnit[] = ['Lending', 'Funding', 'Core', 'Payments']
const PLATFORMS: Platform[] = ['AFIN', 'APartner', 'NGMIS']

const answer = (body: NewProjectResponse) => Response.json(body, { headers: { 'cache-control': 'no-store' } })
const refuse = (reason: string) => answer({ ok: false, reason })

export async function POST(request: Request): Promise<Response> {
  const user = await requestUser(request)
  const dev = process.env.NODE_ENV === 'development'
  const allowed = dev ? isLocalRequest(request) || verifyEditToken(editCookie(request)) : isEditor(user)
  if (!allowed) return refuse('Sign in with your Amartha Google account to start a project.')

  const body = (await request.json().catch(() => null)) as Partial<NewProjectRequest> | null
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 60) : ''
  if (!name) return refuse('Give the project a name first.')
  if (!body?.businessUnit || !BUSINESS_UNITS.includes(body.businessUnit)) return refuse('Pick a business unit.')
  if (!body.platform || !PLATFORMS.includes(body.platform)) return refuse('Pick a platform.')
  if (body.start !== 'blank' && body.start !== 'amarthafin-live') return refuse('Pick how the project starts.')

  // Signed in as a known designer, the account is the owner; otherwise the
  // name typed in the form, in the one spelling check:flows accepts.
  const typed = typeof body.owner === 'string' ? body.owner.trim() : ''
  const owner = ownerFor(user?.label) ?? ownerFor(typed)
  if (!owner) {
    return refuse(
      typed
        ? `“${typed}” isn’t one of the studio’s designers (${OWNERS.join(', ')}). Ask for your name to be added.`
        : 'Say who you are first.',
    )
  }

  try {
    const slug = await createProject({
      name,
      owner,
      businessUnit: body.businessUnit,
      platform: body.platform,
      start: body.start,
      taken: new Set([...Object.keys(configs), ...(await listDbConfigs()).map((c) => c.slug)]),
    })
    return answer({ ok: true, slug, owner })
  } catch (err) {
    if (err instanceof NotSignedIn) {
      return refuse('Sign in to the studio on this laptop first — open localhost:4000/auth/laptop/start, then try again.')
    }
    return refuse(err instanceof CreateRefused ? err.message : 'The project couldn’t be created — try again.')
  }
}
