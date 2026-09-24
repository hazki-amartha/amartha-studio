import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The verification build (§6) must not land in the same folder the dev server
  // is running from. `next build` REPLACES the contents of distDir, so building
  // while a dev server is up left that server serving HTTP 500 until someone
  // killed and restarted it — which is what "the preview link doesn't work"
  // almost always turned out to be, since the build runs immediately before the
  // link is handed over. `npm run build` sets NEXT_DIST_DIR=.next-build so the
  // two never share a directory. Unset (Vercel, `next start`) it stays `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Assets — the illustration generator is its own app and deployment
  // (repo: amartha-illustration, built with basePath '/assets-app'). Proxying
  // it here puts it on the studio's origin, which is what lets /assets embed it
  // as a same-origin frame: its Google sign-in popup and the frame share
  // cookies, and the frame can follow the studio theme. The password gate in
  // middleware.ts runs before rewrites, so it guards these paths too.
  // Unset ASSET_GENERATOR_URL leaves /assets showing a "not connected" note.
  async rewrites() {
    const target = process.env.ASSET_GENERATOR_URL?.replace(/\/$/, '')
    if (!target) return []
    return [
      { source: '/assets-app', destination: `${target}/assets-app` },
      { source: '/assets-app/:path*', destination: `${target}/assets-app/:path*` },
    ]
  },

  // Design mode's source map. `platform/design/stamp.cjs` stamps every JSX
  // element in a project screen with `data-src="<file>:<line>:<col>"`, which is
  // what lets the studio address one JSX node from one DOM node.
  //
  // `enforce: 'pre'` runs it before Next's own SWC transform, on the file as
  // authored. A Babel preset would have done the same job and switched the
  // whole build off SWC to do it; a loader leaves the compiler alone.
  //
  // Runs in dev AND production builds. The deployed studio needs the addresses
  // as much as the dev server does — that is what makes deployed design mode
  // possible at all, and it is the reason React's dev-only `_debugSource` was
  // not used instead.
  // `fileURLToPath`, never `new URL(...).pathname`: the latter percent-encodes,
  // so a checkout under a path with a space in it ("03 Design Lab") produced
  // `/Users/.../03%20Design%20Lab/projects`, webpack's `include` matched
  // nothing, and the loader silently never ran. The build still compiled — the
  // only symptom was zero `data-src` attributes in the output. It would have
  // worked on Vercel, whose build path has no spaces, and failed only on a
  // laptop.
  webpack(config) {
    config.module.rules.push({
      test: /\.tsx$/,
      include: [resolve(here, 'projects')],
      enforce: 'pre',
      use: [{ loader: resolve(here, 'platform/design/stamp.cjs') }],
    })
    return config
  },
}

export default nextConfig
