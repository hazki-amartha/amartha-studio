// /db/<slug> — where database projects lived during the proof of concept. They
// are served at /p/<slug> now, like every project; old links land there.

import { redirect } from 'next/navigation'

interface PageProps {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function DbPrototypeRedirect({ params, searchParams }: PageProps) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    for (const v of [value].flat()) if (v !== undefined) query.append(key, v)
  }
  const qs = query.toString()
  redirect(`/p/${params.slug}${qs ? `?${qs}` : ''}`)
}
