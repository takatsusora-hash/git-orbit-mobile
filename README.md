# Git Orbit Mobile

Installable PWA for visualizing the current state of multiple GitHub systems as labeled modules and connections.

Now also includes an Android app shell that bundles the exported app locally.

## What It Is

- Static-exported Next.js app
- Mobile-first PWA that can be added to the home screen
- Snapshot-based build so the app opens quickly on phones
- GitHub-backed status view with module boxes, connection lines, and evidence links

## How It Works

1. `scripts/generate-snapshots.mjs` reads GitHub and local overlay paths.
2. It writes static JSON into `public/data/`.
3. Next.js exports the app as static files.
4. GitHub Pages serves the exported site.
5. On a phone, the site can be installed from the browser as an app.

## Local Commands

```powershell
npm install
npm run snapshot
npm run build
npm run dev
```

## Android App Build

The Android app shell lives in [android](C:/Users/it11ataniguchi/Documents/New%20project/git-orbit-mobile/android).

Current local output:

- [app-debug.apk](C:/Users/it11ataniguchi/Documents/New%20project/git-orbit-mobile/android/app/build/outputs/apk/debug/app-debug.apk)

What the Android shell does:

- bundles the exported app into the APK
- loads it from local app assets, not from a remote website
- opens external GitHub links in the browser

Repeatable local flow:

1. Build app assets with `node scripts/build-android-assets.mjs`
2. Build the debug APK with Gradle from the local Android project

If `gh auth login` is already complete, snapshot generation can reuse that login. You can also provide tokens with:

```powershell
$env:GH_TOKEN="..."
$env:GITHUB_TOKEN_AETHER_CORE1219="..."
$env:GITHUB_TOKEN_TAKATSUSORA_HASH="..."
```

## GitHub Pages Deploy

This repo includes `.github/workflows/deploy-pages.yml`.

- Push to `main`
- GitHub Actions generates fresh snapshot JSON
- The app is exported to static files
- GitHub Pages deploys the result

Expected site URL:

- [https://takatsusora-hash.github.io/git-orbit-mobile/](https://takatsusora-hash.github.io/git-orbit-mobile/)

## Required Repo Secrets

For private repositories, set these secrets in the GitHub repo settings when needed:

- `GH_TOKEN`
- `GITHUB_TOKEN_AETHER_CORE1219`
- `GITHUB_TOKEN_TAKATSUSORA_HASH`

`GH_TOKEN` can be a fine-grained token that can read every target repo used for snapshot generation.
