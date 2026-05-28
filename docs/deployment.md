# Deployment

Rail Scenario Planner is a static site and can be deployed directly with GitHub Pages.

## GitHub Pages

1. Push the latest `main` branch to `Umaraslam66/depot-viz`.
2. Open repository settings on GitHub.
3. Go to **Pages**.
4. Set source to **Deploy from a branch**.
5. Select branch `main` and folder `/`.
6. Save and wait for GitHub Pages to publish.

The expected URL is:

```text
https://umaraslam66.github.io/depot-viz/
```

## Local Smoke Test Before Publishing

Run a local static server:

```bash
python -m http.server 5173
```

Open:

```text
http://localhost:5173/
```

Check that the default scenario renders, module imports load without console errors, and basic editing/export controls work.

## Provenance And Licensing

The project was rewritten and published as a clean project history because the original cloned source did not include a local license file. Keep `NOTICE.md` with the repository so provenance remains clear.

Three.js is loaded from jsDelivr and is distributed under the MIT license by its authors.

## Generated Files

Screenshots, recordings, and local export folders are ignored by `.gitignore`. Commit intentional example scenarios or documentation assets only when they are deliberately part of the project.
