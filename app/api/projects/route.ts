// =============================================================================
// New project · the gallery's New Project button, on the dev server.
//
//   POST { name, owner?, businessUnit, platform, start }  → { ok, slug }
//
// Dev only — a project is files in this checkout, see
// platform/projects/server/create.ts. Gated like Push and Chat: open to the
// designer at this laptop (platform/chat/localRequest.ts), the editing
// password for anyone else.
// =============================================================================

import { configs } from '@/projects/configs'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { editCookie, verifyEditToken } from '@/platform/design/server/editGate'
import { getStudioUser } from '@/platform/auth/server'
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
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 })
  if (!isLocalRequest(request) && !verifyEditToken(editCookie(request))) {
    return refuse('New projects can only be started on the laptop running the studio.')
  }

  const body = (await request.json().catch(() => null)) as Partial<NewProjectRequest> | null
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 60) : ''
  if (!name) return refuse('Give the project a name first.')
  if (!body?.businessUnit || !BUSINESS_UNITS.includes(body.businessUnit)) return refuse('Pick a business unit.')
  if (!body.platform || !PLATFORMS.includes(body.platform)) return refuse('Pick a platform.')
  if (body.start !== 'blank' && body.start !== 'amarthafin-live') return refuse('Pick how the project starts.')

  // Signed in as a known designer, the account is the owner; otherwise the
  // name typed in the form, in the one spelling check:flows accepts.
  const typed = typeof body.owner === 'string' ? body.owner.trim() : ''
  const owner = ownerFor((await getStudioUser())?.label) ?? ownerFor(typed)
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
      taken: new Set(Object.keys(configs)),
    })
    return answer({ ok: true, slug, owner })
  } catch (err) {
    return refuse(err instanceof CreateRefused ? err.message : 'The project couldn’t be created — try again.')
  }
}
