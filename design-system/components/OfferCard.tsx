import { Wordmark } from '@/design-system/assets'
import { ArrowRight } from '@/design-system/icons'
import { Card } from './Card'

/** The products a recommendation card can advertise. */
export type OfferProduct = 'modal' | 'ggs' | 'celengan' | 'amartha-link'

/** Each product's own brand colour, worn by the card's headline. */
const OFFER_TONE: Record<OfferProduct, string> = {
  modal: 'text-blue-500',
  ggs: 'text-green-500',
  celengan: 'text-green-500',
  'amartha-link': 'text-orange-500',
}

/**
 * The lockups are drawn at different heights, so a single height renders them
 * at different scales — AmarthaLink's is a short wide lockup and blows up next
 * to Celengan's. Each one renders at the height it was drawn at, which is what
 * puts the marks at a matching size.
 */
const LOCKUP_HEIGHT: Record<OfferProduct, number> = {
  modal: 20,
  ggs: 20,
  celengan: 20,
  'amartha-link': 15,
}

export type OfferCardProps = {
  product: OfferProduct
  title: string
  description?: string
  onClick?: () => void
}

/**
 * A product recommendation card: headline in the product's colour, a line of
 * supporting copy, and the product's full LOCKUP — mark plus name as artwork —
 * along the foot, because the copy above never says which product it sells.
 */
export function OfferCard({ product, title, description, onClick }: OfferCardProps) {
  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <p className={`text-16 font-bold ${OFFER_TONE[product]}`}>{title}</p>
          {description ? <p className="mt-4 text-16 text-caption">{description}</p> : null}
        </div>
        <ArrowRight size={16} className="mt-2 shrink-0 text-caption" />
      </div>
      <div className="mt-12">
        <Wordmark name={product} height={LOCKUP_HEIGHT[product]} />
      </div>
    </Card>
  )
}
