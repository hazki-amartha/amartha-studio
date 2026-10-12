// =============================================================================
// Chat · reference images. A designer pastes, drops or picks a screenshot; the
// agent receives it as a real image, not a file path to go and find.
//
// Every image is shrunk in the browser before it is sent: the long side to
// 1568px (the most the model looks at — anything larger is downscaled on its
// side anyway) and re-encoded as JPEG on white. A Figma export at 3× is
// several MB as PNG and a few hundred KB this way, which keeps a message with
// several references under a deployment's request-size limit.
//
// The transcript keeps only a small thumbnail, so a conversation still fits in
// sessionStorage across a reload.
// =============================================================================

export const MAX_IMAGES = 6
const MAX_SIDE = 1568
const THUMB_SIDE = 160
/** Base64 characters per image, and per message — checked again on the server. */
export const MAX_IMAGE_CHARS = 3_000_000
export const MAX_TOTAL_CHARS = 4_000_000

export interface ChatImage {
  mediaType: 'image/jpeg'
  /** Base64, no data: prefix. */
  data: string
}

/** A reference waiting in the composer. */
export interface PendingImage {
  id: string
  image: ChatImage
  /** A small data: URL for the chip and the transcript. */
  thumb: string
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable'))
    }
    img.src = url
  })
}

function encode(img: HTMLImageElement, maxSide: number, quality: number): string {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')!
  // JPEG has no transparency: a transparent PNG would otherwise turn black.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

/** A file from paste, drop or the picker, ready to attach — or null if it
 *  isn't an image the browser can read. */
export async function prepareImage(file: File): Promise<PendingImage | null> {
  if (!file.type.startsWith('image/')) return null
  let img: HTMLImageElement
  try {
    img = await load(file)
  } catch {
    return null
  }
  let url = encode(img, MAX_SIDE, 0.85)
  if (url.length > MAX_IMAGE_CHARS) url = encode(img, MAX_SIDE, 0.6)
  return {
    id: Math.random().toString(36).slice(2),
    image: { mediaType: 'image/jpeg', data: url.slice(url.indexOf(',') + 1) },
    thumb: encode(img, THUMB_SIDE, 0.7),
  }
}

// --- server side -------------------------------------------------------------

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

/** The request's images, or an error to show. Anything the browser above
 *  would not have produced is refused rather than passed to the model. */
export function readImages(raw: unknown): ChatImage[] | { error: string } {
  if (raw === undefined) return []
  if (!Array.isArray(raw) || raw.length > MAX_IMAGES) {
    return { error: `Attach up to ${MAX_IMAGES} images at a time.` }
  }
  let total = 0
  for (const img of raw as Partial<ChatImage>[]) {
    if (img?.mediaType !== 'image/jpeg' || typeof img.data !== 'string' || !BASE64.test(img.data)) {
      return { error: 'One of the images could not be read — remove it and attach it again.' }
    }
    if (img.data.length > MAX_IMAGE_CHARS) return { error: 'One of the images is too large.' }
    total += img.data.length
  }
  if (total > MAX_TOTAL_CHARS) return { error: 'Those images are too large together — send fewer at once.' }
  return raw as ChatImage[]
}

/** The user message's content blocks: images first, then the words about them. */
export function userContent(text: string, images: ChatImage[]) {
  return [
    ...images.map((img) => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: img.mediaType, data: img.data },
    })),
    { type: 'text' as const, text },
  ]
}
