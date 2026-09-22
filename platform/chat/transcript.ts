// =============================================================================
// A recorded agent turn, replayed with its real timings.
//
// Every offset below was measured — Spike A run 3, 2026-09-16: Opus 5 in a
// Vercel Sandbox, asked to add an alternative homepage to afin-linear. 23 turns,
// 260.5s, $1.39. The screen it produced is on main (Beranda B).
//
// It exists so the chat panel can be designed and judged WITHOUT an API key.
// The question the plan cannot answer on paper is whether four minutes of an
// agent reading files reads as progress or as a hang — and that question needs
// the real shape of the pauses, not a plausible-looking fake. Note the two that
// matter: 84.6s of silence between the last Read and "Now I have what I need"
// (thinking), and 37.7s writing a single file.
//
// Replace with a live stream when there is credit; the panel should not care.
// =============================================================================

export type TranscriptEvent =
  | { at: number; kind: 'text'; text: string }
  | { at: number; kind: 'tool'; tool: string; detail: string }

export interface RecordedTurn {
  prompt: string
  model: string
  events: TranscriptEvent[]
  /** Wall-clock of the whole turn, from the SDK's `duration_ms`. */
  durationMs: number
  costUsd: number
  turns: number
}

export const RECORDED_TURN: RecordedTurn = {
  prompt:
    'Add another homepage option to this project that visualises individual ' +
    'rewards versus group rewards more clearly than the current one. Keep the ' +
    'existing homepage untouched — add a new screen alongside it and register ' +
    'it, the way this project already does. Use only the design system.',
  model: 'claude-opus-5',
  durationMs: 260496,
  costUsd: 1.3886195,
  turns: 23,
  events: [
    { at: 2275, kind: 'text', text: "I'll start by exploring the project to understand what's there." },
    { at: 2915, kind: 'tool', tool: 'Bash', detail: 'ls -R projects/afin-linear' },
    { at: 3575, kind: 'tool', tool: 'Read', detail: 'design-system/guidelines/CHEATSHEET.md' },
    { at: 6353, kind: 'tool', tool: 'Read', detail: 'projects/afin-linear/index.ts' },
    { at: 6899, kind: 'tool', tool: 'Read', detail: 'projects/afin-linear/project.config.ts' },
    { at: 7337, kind: 'tool', tool: 'Read', detail: 'projects/afin-linear/NOTES.md' },
    { at: 9150, kind: 'tool', tool: 'Read', detail: 'projects/afin-linear/screens/home.tsx' },
    { at: 9555, kind: 'tool', tool: 'Read', detail: 'projects/afin-linear/lib/ui.tsx' },
    { at: 11868, kind: 'tool', tool: 'Read', detail: 'projects/afin-linear/lib/data.ts' },
    { at: 12140, kind: 'tool', tool: 'Read', detail: 'projects/afin-linear/lib/store.ts' },
    { at: 30666, kind: 'tool', tool: 'Read', detail: 'tailwind.config.ts' },
    { at: 31153, kind: 'tool', tool: 'Read', detail: 'projects/afin-linear/lib/demo.ts' },
    { at: 33956, kind: 'tool', tool: 'Read', detail: 'projects/afin-linear/screens/riwayat.tsx' },
    { at: 37336, kind: 'tool', tool: 'Bash', detail: 'grep export function design-system/icons/index.tsx' },
    { at: 38294, kind: 'tool', tool: 'Bash', detail: 'head -60 projects/afin-linear/screens/majelis.tsx' },
    { at: 87439, kind: 'tool', tool: 'Bash', detail: 'grep -rn "Option B" projects/*/index.ts' },
    { at: 89263, kind: 'tool', tool: 'Read', detail: 'projects/apartner-sales/index.ts' },
    { at: 92927, kind: 'tool', tool: 'Bash', detail: 'sed -n 1,80p design-system/components/Card.tsx' },
    { at: 177507, kind: 'text', text: 'Now I have what I need. Writing the new homepage option:' },
    { at: 215161, kind: 'tool', tool: 'Write', detail: 'projects/afin-linear/screens/home-b.tsx' },
    { at: 217254, kind: 'text', text: 'Now register it:' },
    { at: 218653, kind: 'tool', tool: 'Edit', detail: 'projects/afin-linear/index.ts' },
    { at: 222189, kind: 'tool', tool: 'Edit', detail: 'projects/afin-linear/NOTES.md' },
    { at: 224118, kind: 'tool', tool: 'Bash', detail: 'npm run lint' },
    { at: 235324, kind: 'tool', tool: 'Bash', detail: 'npm run check:flows && npx tsc --noEmit' },
    {
      at: 260880,
      kind: 'text',
      text:
        'Added **Beranda B — Satu garis waktu** as a new screen ' +
        '(`screens/home-b.tsx`), registered alongside the existing one. ' +
        'Beranda A is untouched.',
    },
  ],
}

/** The longest gap between consecutive events — the panel's hardest moment. */
export function longestGapMs(turn: RecordedTurn): { ms: number; afterIndex: number } {
  let ms = turn.events[0]?.at ?? 0
  let afterIndex = -1
  for (let i = 1; i < turn.events.length; i++) {
    const gap = turn.events[i].at - turn.events[i - 1].at
    if (gap > ms) {
      ms = gap
      afterIndex = i - 1
    }
  }
  return { ms, afterIndex }
}
