-- Amartha Studio · the name each person goes by (platform/auth/profiles.ts).
--
-- Runs on the studio's own Supabase project (amartha-studio, STUDIO_DB_*),
-- beside studio_project_files — not on Vocus's, so nothing Vocus owns is
-- touched. One row per Amartha account, made the first time it signs in: the
-- name its comments go out under and its projects are owned under. Seeded from
-- user_roles.display_name when the studio owner set one, else the first name
-- on the Google account; the person can change it from the account menu.
--
-- RLS on with no policies: only the service-role key (server side) reads or
-- writes it. Idempotent: safe to run twice.

CREATE TABLE IF NOT EXISTS studio_profiles (
  email       text        PRIMARY KEY,   -- lower-case @amartha.com
  name        text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One person per name: a project's owner is just this string.
CREATE UNIQUE INDEX IF NOT EXISTS studio_profiles_name_unique ON studio_profiles (lower(name));

ALTER TABLE studio_profiles ENABLE ROW LEVEL SECURITY;
