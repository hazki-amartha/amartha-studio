// =============================================================================
// lazyScreen — how a project declares a screen's component in index.ts.
//
// A project's index used to import every screen file at the top:
//
//   import { HomeScreen } from './screens/home'      // ← pulls the whole screen
//   …
//   screens: [{ id: 'home', title: 'Beranda', component: HomeScreen }]
//
// which meant listing a screen was the same thing as loading it. Opening one
// screen compiled and downloaded all of them, and every project's screens sat
// in the module graph of every route (the registry is reachable from the root
// layout). lazyScreen makes the index carry metadata only:
//
//   screens: [{
//     id: 'home',
//     title: 'Beranda',
//     component: lazyScreen(() => import('./screens/home'), 'HomeScreen'),
//   }]
//
// The screen file is fetched when the screen is first rendered, not when the
// project is listed. Screens keep their named exports; the second argument
// names the export and is type-checked against the module, so a typo or a
// renamed screen is a build error, not a blank device.
//
// Nothing else changes for a screen author: the component still takes no props
// and still calls useFlow(). The platform renders it inside a Suspense
// boundary (ScreenStage, ScreenThumb) so an unloaded screen shows nothing for
// a beat rather than throwing.
// =============================================================================

import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * Defer a screen's component to first render.
 *
 * @param load  A bare `() => import('./screens/x')`. It must be an inline
 *              dynamic import — bundlers need the literal path to split it.
 * @param name  The screen's named export in that module.
 */
export function lazyScreen<K extends string>(
  load: () => Promise<Record<K, ComponentType>>,
  name: K,
): LazyExoticComponent<ComponentType> {
  return lazy(async () => ({ default: (await load())[name] }))
}
