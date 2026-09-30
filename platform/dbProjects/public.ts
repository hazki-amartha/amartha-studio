// =============================================================================
// DB projects · the studio database's PUBLIC address and key.
//
// The database behind database projects is its own Supabase project
// (amartha-studio), apart from Vocus's, which the studio keeps using for Google
// sign-in. Only the deployed studio reads and writes its tables, with the
// server-only key on Vercel (STUDIO_DB_SUPABASE_*). The browser uses these two
// for one thing: Realtime — "saved" broadcasts and who's here. They are public
// by design (every table has row-level security on and no policies, so this key
// reads nothing), which is why they live in the code: a laptop needs no setup.
// =============================================================================

export const STUDIO_DB_URL = process.env.NEXT_PUBLIC_STUDIO_DB_SUPABASE_URL || 'https://yxgqniaqruundemovnpm.supabase.co'

export const STUDIO_DB_ANON_KEY =
  process.env.NEXT_PUBLIC_STUDIO_DB_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4Z3FuaWFxcnV1bmRlbW92bnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NTcyMDUsImV4cCI6MjEwNjMzMzIwNX0.j0QjW2lmpLR-KGm9W7EGArmBihTXYjwAh5uM_Hrgvwc'

/** The deployed studio — where a laptop's dev server reads and saves database
 *  projects, as the designer who signed in (platform/auth/laptop.ts). */
export const STUDIO_URL = (process.env.STUDIO_REMOTE_URL || 'https://amartha-studio.vercel.app').replace(/\/$/, '')
