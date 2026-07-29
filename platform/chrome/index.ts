// Studio chrome — app shell, page header, and the project index loader.
export { AppShell } from './AppShell'
export { usePublishHeaderStatus } from './headerStatus'
export { PageHeader } from './PageHeader'
export { ThemeToggle, useTheme } from './theme'
// loadProjectIndex is deliberately NOT re-exported here. It reaches the whole
// registry, and this barrel is imported by the root layout — re-exporting the
// function put every project's screens into the eager chunk group of every
// route in the studio. AppShell imports it dynamically instead; the type is
// erased at compile time and so is free to travel.
export type { ProjectIndexEntry } from './loadProjectIndex'
