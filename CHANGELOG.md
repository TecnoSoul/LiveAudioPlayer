# Changelog

## 1.0.1 — 2026-11-19

Cleanup and fixes on top of 1.0.0.

### Fixed
- Switching stations no longer leaves the player stuck in loading, and stale browser audio events no longer set errors on the new station.
- Native player listeners are no longer duplicated on every station change; the native module is awaited before use.
- `isPlaying` now reflects real playback events instead of being set unconditionally.
- Invalid `::deep` selector in `StationDetail.vue` (now `:deep`).

### Removed
- Placeholder stations (5–8) and placeholder social links.
- Unused/backup files: `MainLayout copy.vue`, `IndexPageOrig.vue`, `PageEjemplo.vue` (and its `/tunoticia` route), `RadioStationGrid.vue`, `EssentialLink.vue`, `icon.xcf`, Quasar demo logo.

### Changed
- `public/` is no longer gitignored so static assets can be tracked.
- `src-capacitor` aligned with the root project: Capacitor 7 and native-audio 2.x.
- README rewritten.

## 1.0.0 — 2026-11-19

First stable release.

### Added
- Multi-station live audio player with station detail pages and persistent mini player.
- Native Android playback with notification and background audio; HTML5 fallback in browsers.
