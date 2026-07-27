'use client'

// One sheet for every message this app sends over WhatsApp.
//
// It started as the kumpulan reminder — a BP reminding six groups a week does
// not compose six messages, she composes one and retypes it badly — and the
// same shape turned out to be the answer everywhere else a message is sent: the
// recipient at the top, the sentence already written, and one button.
//
// The message is a READ-BACK, not a text field. A field invites an edit she did
// not come here to make, and everything in these messages is derived from what
// she just recorded, so the version the app writes is the correct one. The
// receipt after a home visit used to be a whole PAGE with an editable textarea
// on it; it is the same act as the reminder — send this, to this person — and
// giving it a page put a screen between a finished visit and the schedule.

import { BottomSheet, Button } from '@/design-system/components'
import { PaperPlaneTilt, WhatsappLogo } from '@/design-system/icons'

export function WaSendSheet({
  open,
  onClose,
  title,
  description,
  recipient,
  message,
  sendLabel,
  onSend,
}: {
  open: boolean
  onClose: () => void
  title: string
  /** Who it goes to, in words — "Pesan dikirim ke grup WhatsApp majelis." */
  description: string
  /** The chip at the top: the group or the mitra this lands with. */
  recipient: string
  message: string
  sendLabel: string
  /** Defaults to closing — sending is simulated, as everywhere else here. */
  onSend?: () => void
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      size="md"
      title={title}
      description={description}
    >
      <div className="flex flex-col gap-12">
        <div className="flex items-center gap-8 rounded-8 bg-neutral-50 p-12">
          <span className="shrink-0 text-green-500">
            <WhatsappLogo size={20} />
          </span>
          <span className="min-w-0 flex-1 truncate text-12 font-bold text-default">
            {recipient}
          </span>
        </div>

        <p className="whitespace-pre-line rounded-12 border border-default bg-neutral-white p-12 text-12 text-default">
          {message}
        </p>

        <Button size="lg" className="w-full" onClick={onSend ?? onClose}>
          <span className="flex items-center justify-center gap-8">
            <PaperPlaneTilt size={20} />
            {sendLabel}
          </span>
        </Button>
      </div>
    </BottomSheet>
  )
}
