'use client'

// The two ways a prospect is drawn: as a row in a list, and as the identity
// block at the top of her own record.
//
// Both lead with the interest grade rather than the name, in the sense that the
// grade is what carries colour. A roster of mitra sorts by who is most behind;
// a list of prospects sorts by nothing useful — they were all met ten minutes
// apart — so the only thing that separates them on the page is how they
// answered, and that has to be legible without reading.

import { Badge, Card } from '@/design-system/components'
import { IconChatFill, IconChevronRight, IconPhone } from './icons'
import { INTEREST_META, SOURCE_LABEL, leadSubtitle, type Lead } from './leads'
import { Avatar, ContactButton } from './ui'

/** One prospect in the sosialisasi list. Tapping opens her record. */
export function LeadRow({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const interest = lead.interest ? INTEREST_META[lead.interest] : null

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-12 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <Avatar name={lead.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-14 font-bold text-default">{lead.name}</span>
        <span className="truncate text-12 text-caption">{lead.phone}</span>
        <span className="flex flex-wrap items-center gap-4 pt-2">
          {interest ? (
            <Badge intent={interest.intent} size="sm">
              {interest.label}
            </Badge>
          ) : null}
          <Badge intent="neutral" variant="outline" size="sm">
            {SOURCE_LABEL[lead.source]}
          </Badge>
        </span>
      </div>
      <span className="shrink-0 text-disabled">
        <IconChevronRight size={20} />
      </span>
    </button>
  )
}

/**
 * Her identity, and the two buttons that ARE the follow-up task.
 *
 * On a home visit the contact buttons are a fallback for a gate nobody answers.
 * Here they are the work itself — the task is "call Ibu Nia" — so they sit at
 * the top of the screen rather than tucked beside an address, and the follow-up
 * form below only makes sense as a record of what happened after one is tapped.
 */
export function LeadIdentityCard({
  lead,
  onOpen,
  onContact,
}: {
  lead: Lead
  /** Opens her record page. Omitted when this card IS on her record page. */
  onOpen?: () => void
  /** Which channel was used — the follow-up screen records it. */
  onContact?: (via: 'wa' | 'telepon') => void
}) {
  const interest = lead.interest ? INTEREST_META[lead.interest] : null

  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-center gap-12">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Buka data ${lead.name}`}
              className="flex min-w-0 flex-1 items-center gap-12 text-left"
            >
              <Avatar name={lead.name} />
              <span className="flex min-w-0 items-center gap-4">
                <span className="truncate text-18 font-bold text-default">{lead.name}</span>
                <span className="shrink-0 text-disabled">
                  <IconChevronRight size={16} />
                </span>
              </span>
            </button>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-12">
              <Avatar name={lead.name} />
              <span className="truncate text-18 font-bold text-default">{lead.name}</span>
            </div>
          )}

          <div className="flex shrink-0 gap-8">
            <ContactButton
              label={`WhatsApp ${lead.name} — ${lead.phone}`}
              tone="green"
              onClick={() => onContact?.('wa')}
            >
              <IconChatFill size={20} />
            </ContactButton>
            <ContactButton
              label={`Telepon ${lead.name} — ${lead.phone}`}
              tone="primary"
              onClick={() => onContact?.('telepon')}
            >
              <IconPhone size={20} />
            </ContactButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <span className="text-12 text-caption">{lead.phone}</span>
          {interest ? <Badge intent={interest.intent} size="sm">{interest.label}</Badge> : null}
          <Badge intent="neutral" variant="outline" size="sm">
            {SOURCE_LABEL[lead.source]}
          </Badge>
        </div>

        {/* Where she came from, when someone sent her. A referral's value is
            the name attached to it — "Bu Rina's neighbour" is a different
            conversation from a stranger at a warung, and losing that turns a
            warm introduction back into a cold call. */}
        {lead.source === 'referral' && lead.referredBy ? (
          <div className="rounded-8 bg-neutral-50 px-12 py-8 text-12 text-default">
            Direferensikan oleh {lead.referredBy}
          </div>
        ) : null}

        <span className="text-12 text-caption">{leadSubtitle(lead)}</span>
      </div>
    </Card>
  )
}
