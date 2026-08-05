/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next build` and `next dev` share `.next` by default, so running the §6
  // build check while the designer's preview server is up overwrites the
  // compiled output underneath it — the page starts 500ing with "missing
  // required error components" and looks like the change simply didn't work.
  // Setting NEXT_DIST_DIR sends a verification build somewhere harmless.
  // Unset (CI, Vercel, plain `next build`) it stays `.next` as before.
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

export default nextConfig
