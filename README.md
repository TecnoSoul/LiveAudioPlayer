# TecnoSoul Live Audio Player

Multi live-audio-stream player app (`ar.com.tecnosoul.audioplayer`), built with Quasar (Vue 3 + Vite), Pinia and Capacitor. Runs as a web app (SPA) and as an Android app with native background playback.

**Current release: 1.0.0** — see [CHANGELOG.md](CHANGELOG.md).

## Features

- List of live radio stations with a detail page per station.
- Persistent mini player (play / pause) available across all pages.
- Native playback on Android (`@mediagrid/capacitor-native-audio`) with notification controls and background audio.
- HTML5 `Audio` fallback when running in a browser.
- Spanish UI, with "Nosotros" and "Contacto" pages.

## Stack

| Layer | Tech |
| --- | --- |
| UI | Quasar 2, Vue 3 |
| State | Pinia (`src/stores/radio.js`) |
| Native | Capacitor 7 (Android) |
| Build | `@quasar/app-vite` |

## Getting started

Requires Node 16, 18 or 20.

```bash
npm install
npm run dev        # dev server with hot reload
npm run lint
npm run format
npm run build      # SPA output in dist/spa
```

## Project structure

```
src/
  boot/          Pinia and notify boot files
  components/    AudioPlayer (mini player)
  layouts/       MainLayout
  pages/         Index, StationDetail, Nosotros, Contacto, ErrorNotFound
  router/        Routes
  stores/radio.js  Stations list and playback logic (native + browser)
src-capacitor/   Capacitor shell
capacitor.config.ts
```

## Managing stations

Stations are defined in the `stations` array in [src/stores/radio.js](src/stores/radio.js):

```js
{
  id: 1,
  name: "Station name",
  genre: "Variado",
  streamUrl: "https://host:port/mount",
  image: "/images/logo-512.png",   // served from public/images
  location: "Province",
  social: { instagram: "...", whatsapp: "..." }, // optional
}
```

Static assets (logos in `public/images/`) are served from `public/`, which is tracked in git: commit your station logos and `images/logo-horiz-*.png` there.

## Android (Capacitor)

```bash
npm run build
npx cap add android      # first time only (android/ is gitignored)
npx cap sync android
npx cap open android
```

## Playback architecture

`radio.js` picks the engine at runtime with `Capacitor.isNativePlatform()`:

- **Native**: the plugin is lazy-loaded; one player instance (`audioId: "radioStream"`) is destroyed and recreated on every station change. State follows plugin events (`onPlaybackStatusChange`, `onAudioReady`).
- **Browser**: one `Audio` element per station; the previous one is released on switch and its events are ignored.

## License

See [LICENSE](LICENSE).
