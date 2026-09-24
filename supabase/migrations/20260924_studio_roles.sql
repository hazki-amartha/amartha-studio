-- Amartha Studio · Google sign-in roles (platform/auth).
--
-- Runs on the Vocus Supabase project (amartha-design-lab), which the studio and
-- the Assets app share for sign-in. The studio adds two columns beside Vocus's
-- own `role` and never touches that one: roles are per tool.
--
--   studio_role   viewer (default) · editor · admin
--   display_name  the name projects are owned under. Must equal `owner` in
--                 project.config — one of OWNERS in scripts/check-flows.mjs
--                 (Hazki, Chandra, Patricia, Nugraha, Yori).
--
-- Additive and idempotent: safe to run twice, and Vocus keeps working unchanged.

ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS studio_role text NOT NULL DEFAULT 'viewer';
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS display_name text;

DO $$ BEGIN
  ALTER TABLE user_roles ADD CONSTRAINT user_roles_studio_role_check
    CHECK (studio_role IN ('viewer', 'editor', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- One account per owner name: two accounts answering to "Hazki" would both own
-- every one of Hazki's projects.
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_display_name_unique
  ON user_roles (lower(display_name)) WHERE display_name IS NOT NULL;

-- Editors. Fill in each designer's Google email, then run.
--
-- CAREFUL with people who have no row yet: a new row also gets Vocus's
-- `role = 'viewer'`, and in Vocus a row outranks the EDITOR_EMAILS fallback —
-- so someone who edits Vocus only through EDITOR_EMAILS would lose it. For
-- them, set `role` to what Vocus gives them today instead of the default.
--
-- INSERT INTO user_roles (email, studio_role, display_name) VALUES
--   ('hazki.hariowibowo@amartha.com', 'admin',  'Hazki'),
--   ('<email>',                       'editor', 'Chandra'),
--   ('<email>',                       'editor', 'Patricia'),
--   ('<email>',                       'editor', 'Nugraha'),
--   ('<email>',                       'editor', 'Yori')
-- ON CONFLICT (email) WHERE email IS NOT NULL
--   DO UPDATE SET studio_role = EXCLUDED.studio_role, display_name = EXCLUDED.display_name;
