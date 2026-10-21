// =============================================================================
// What the sidebar knows of a screen — no component, safe to cross the server
// boundary. Its own module so a database project's page can brief its screens
// without importing loadProjectIndex, which pulls in every git project.
// =============================================================================

export interface ScreenIndexEntry {
  id: string
  title: string
  /** Its sidebar section, if the project groups its screens. */
  section?: string
}

export const briefScreen = (s: { id: string; title: string; section?: string }): ScreenIndexEntry =>
  s.section ? { id: s.id, title: s.title, section: s.section } : { id: s.id, title: s.title }
