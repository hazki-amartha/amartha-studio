// =============================================================================
// Chat · the markdown Claude writes, rendered for the chat panel.
//
// Only what replies here actually use: paragraphs, ## headings, - and 1. lists,
// **bold**, *italic*, `code`, [text](https://…) links, and [[Page Title]] wiki
// citations, which open that page on Vocus. Everything becomes React elements —
// never HTML — so a reply can't inject markup. Anything else stays as text.
// =============================================================================

import type { ReactNode } from 'react'

const VOCUS_URL = (process.env.NEXT_PUBLIC_VOCUS_URL ?? 'https://vocus.amartha.id').replace(/\/$/, '')

const wikiHref = (title: string) => `${VOCUS_URL}/insight-library/${encodeURIComponent(title)}`

// One alternation, earliest match wins: [[wiki]], `code`, **bold**, [link](url), *italic*.
const INLINE = /\[\[([^\]\n]+)\]\]|`([^`\n]+)`|\*\*([^*\n]+?)\*\*|\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)|(?<![\w*])\*([^*\n]+?)\*(?![\w*])/g

const LINK = 'text-primary-500 hover:underline'

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let n = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const k = `${key}-${n++}`
    if (m[1]) {
      // [[Page Title|shown text]] — Obsidian's alias form — links the page, shows the alias.
      const [title, alias] = m[1].split('|')
      out.push(
        <a key={k} href={wikiHref(title.trim())} target="_blank" rel="noreferrer" className={LINK}>
          {(alias ?? title).trim()}
        </a>,
      )
    } else if (m[2]) {
      out.push(
        <code key={k} className="rounded-4 bg-neutral-50 px-4 text-12 dark:bg-ink-800">
          {m[2]}
        </code>,
      )
    } else if (m[3]) {
      out.push(
        <strong key={k} className="font-bold">
          {inline(m[3], k)}
        </strong>,
      )
    } else if (m[4]) {
      out.push(
        <a key={k} href={m[5]} target="_blank" rel="noreferrer" className={LINK}>
          {m[4]}
        </a>,
      )
    } else if (m[6]) {
      out.push(<em key={k}>{inline(m[6], k)}</em>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'h'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }

const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/
const HEADING = /^\s*#{1,6}\s+(.*?)\s*#*\s*$/

function blocks(text: string): Block[] {
  const out: Block[] = []
  const top = () => out[out.length - 1]
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    let m: RegExpMatchArray | null
    if (!line.trim()) {
      out.push({ kind: 'p', lines: [] })
    } else if ((m = line.match(HEADING))) {
      out.push({ kind: 'h', text: m[1] })
    } else if ((m = line.match(BULLET)) || (m = line.match(NUMBERED))) {
      const ordered = !BULLET.test(line)
      const t = top()
      if (t && t.kind === 'list' && t.ordered === ordered) t.items.push(m[1])
      else out.push({ kind: 'list', ordered, items: [m[1]] })
    } else {
      const t = top()
      // An indented line under a list item continues that item.
      if (t && t.kind === 'list' && /^\s{2,}/.test(line)) t.items[t.items.length - 1] += ` ${line.trim()}`
      else if (t && t.kind === 'p') t.lines.push(line)
      else out.push({ kind: 'p', lines: [line] })
    }
  }
  return out.filter((b) => b.kind !== 'p' || b.lines.length)
}

/** A chat reply. The wrapper's classes set the text colour and size. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-8 break-words ${className ?? ''}`}>
      {blocks(text).map((b, i) => {
        const k = String(i)
        if (b.kind === 'h') {
          return (
            <p key={k} className="mt-4 font-bold">
              {inline(b.text, k)}
            </p>
          )
        }
        if (b.kind === 'list') {
          const List = b.ordered ? 'ol' : 'ul'
          return (
            <List key={k} className={`flex flex-col gap-4 pl-16 ${b.ordered ? 'list-decimal' : 'list-disc'}`}>
              {b.items.map((item, j) => (
                <li key={j}>{inline(item, `${k}-${j}`)}</li>
              ))}
            </List>
          )
        }
        return (
          <p key={k} className="whitespace-pre-wrap">
            {inline(b.lines.join('\n'), k)}
          </p>
        )
      })}
    </div>
  )
}
