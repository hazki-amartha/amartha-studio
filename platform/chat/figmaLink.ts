// =============================================================================
// Chat · a Figma link, read without asking Figma — shared by the composer (the
// chip a pasted link becomes) and the server's Figma tools (./server/figma.ts).
// =============================================================================

/** figma.com/design|file|proto/:key[/branch/:branchKey]/…?node-id=1-2 */
export function parseFigmaUrl(raw: string): { fileKey: string; nodeId: string } | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (!/(^|\.)figma\.com$/.test(url.hostname)) return null
  const parts = url.pathname.split('/').filter(Boolean)
  if (!['design', 'file', 'proto'].includes(parts[0]) || !parts[1]) return null
  const fileKey = parts[2] === 'branch' && parts[3] ? parts[3] : parts[1]
  const nodeId = url.searchParams.get('node-id')?.replace(/-/g, ':')
  if (!/^[\w]+$/.test(fileKey) || !nodeId || !/^[\w:;]+$/.test(nodeId)) return null
  return { fileKey, nodeId }
}

/** The chip's label until Figma answers with the frame's name: the file's
 *  name, as the link spells it. */
export function figmaFileLabel(raw: string): string {
  try {
    const parts = new URL(raw.trim()).pathname.split('/').filter(Boolean)
    const name = parts[2] === 'branch' ? parts[4] : parts[2]
    return name ? decodeURIComponent(name).replace(/-/g, ' ') : 'Figma frame'
  } catch {
    return 'Figma frame'
  }
}

/** A paste that is nothing but a figma.com link. */
export const isFigmaLink = (text: string) => /^https:\/\/([\w-]+\.)?figma\.com\/\S+$/.test(text.trim())

/** A pasted link waiting to go with the draft. `label` starts as the file's
 *  name and becomes the frame's once Figma answers. */
export interface PendingFigma {
  id: string
  url: string
  label: string
}

export const MAX_FIGMA_LINKS = 3
