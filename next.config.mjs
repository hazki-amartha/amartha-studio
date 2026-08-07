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
}

export default nextConfig
