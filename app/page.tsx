// WS-0 placeholder — WS-D replaces this with the real project gallery.

import { registry } from '@/projects/registry'

export default function Home() {
  const slugs = Object.keys(registry)

  return (
    <main className="mx-auto flex max-w-screen-sm flex-col gap-16 px-16 pt-48">
      <h1 className="text-24 font-bold text-default">Drafting Board</h1>
      <p className="text-14 text-caption">
        Design-system-locked prototyping studio. The project gallery lands with WS-D;
        registered projects so far:
      </p>
      <ul className="flex flex-col gap-8">
        {slugs.map((slug) => (
          <li key={slug} className="rounded-12 border border-default bg-neutral-white p-12 text-14 text-default">
            {slug}
          </li>
        ))}
      </ul>
    </main>
  )
}
