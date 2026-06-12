# Deployment

Rail Story Studio builds to a static bundle (`npm run build` → `dist/`) and can be hosted on any static host: GitHub Pages, Vercel, Netlify, or Railway static serving. `vite.config.ts` uses `base: "./"`, so the bundle works from a domain root or a sub-path.

## GitHub Pages

GitHub Pages can no longer serve the repository root directly — the app needs a build step. Use an Actions workflow that runs `npm ci && npm run build` and publishes `dist/`, or push the built `dist/` to a `gh-pages` branch.

## Vercel

```bash
vercel
```

Framework preset: Vite. Build command `npm run build`, output directory `dist`. No environment variables required.

## Local Smoke Test Before Publishing

```bash
npm run build
npx vite preview
```

Check that the demo scenario renders, playback animates trains, editing works, and autosave round-trips a reload without console errors.

## Provenance And Licensing

The project was rewritten and published as a clean project history because the original cloned source did not include a local license file. Keep `NOTICE.md` with the repository so provenance remains clear.

Three.js, React, and all dependencies are installed from npm under their respective licenses (MIT).

## Generated Files

Screenshots, recordings, and local export folders are ignored by `.gitignore`. Commit intentional example scenarios or documentation assets only when they are deliberately part of the project.
