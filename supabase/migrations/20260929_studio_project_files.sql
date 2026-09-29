-- Amartha Studio · project files in the database (proof of concept, /db/<slug>).
--
-- A project's source lives here instead of in projects/<slug>/: one row per
-- file, plus every save kept in studio_project_file_versions. The studio reads
-- and compiles them at request time (platform/dbProjects), so a save shows on
-- the shared link without a commit, a push or a deploy.
--
-- Runs on the Vocus Supabase project, beside 20260924_studio_roles.sql. New
-- tables only, prefixed studio_: nothing Vocus owns is touched. RLS is on with
-- no policies, so only the service-role key (server side) can read or write —
-- the browser never reads these tables directly.
--
-- Reverting the proof of concept: DROP TABLE both. Idempotent: safe to run twice.

CREATE TABLE IF NOT EXISTS studio_project_files (
  slug        text        NOT NULL,
  path        text        NOT NULL,   -- relative to the project, e.g. screens/home.tsx
  content     text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text,
  PRIMARY KEY (slug, path)
);

CREATE TABLE IF NOT EXISTS studio_project_file_versions (
  id        bigserial   PRIMARY KEY,
  slug      text        NOT NULL,
  path      text        NOT NULL,
  content   text,                     -- null records a deletion
  saved_at  timestamptz NOT NULL DEFAULT now(),
  saved_by  text
);

CREATE INDEX IF NOT EXISTS studio_project_file_versions_slug
  ON studio_project_file_versions (slug, saved_at DESC);

ALTER TABLE studio_project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_project_file_versions ENABLE ROW LEVEL SECURITY;
