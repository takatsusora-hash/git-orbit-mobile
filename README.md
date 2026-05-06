# Git Orbit Mobile

Installable Android app for visualizing the current state of multiple GitHub systems as labeled modules and connections in a 3D scene.

## What It Is

- Android app shell that bundles the exported UI locally
- Snapshot-based build so the app opens quickly on phones
- GitHub-backed status view with module boxes, connection lines, and evidence links
- 3D scene rendered from static snapshots so the APK works without a hosted backend

## How It Works

1. `scripts/generate-snapshots.mjs` reads GitHub and local overlay paths.
2. It writes static JSON into `public/data/`.
3. Next.js exports the app as static files.
4. The Android shell copies those files into APK assets.
5. The Android app loads them locally through `WebViewAssetLoader`.

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

1. Run `.\scripts\setup-android-tooling.ps1`
2. Build app assets with `node scripts/build-android-assets.mjs`
3. Build the debug APK with Gradle from the local Android project

Full install steps:

- [INSTALL-ANDROID.md](C:/Users/it11ataniguchi/Documents/New%20project/git-orbit-mobile/INSTALL-ANDROID.md)

If `gh auth login` is already complete, snapshot generation can reuse that login. You can also provide tokens with:

```powershell
$env:GH_TOKEN="..."
$env:GITHUB_TOKEN_AETHER_CORE1219="..."
$env:GITHUB_TOKEN_TAKATSUSORA_HASH="..."
```

To add another visible system without editing JSON by hand:

```powershell
.\scripts\register-system.ps1 --name "Example System" --owner takatsusora-hash --repos git-orbit-mobile,genesis-core_v1
```

## Optional Web Export

This repo still includes `.github/workflows/deploy-pages.yml` for optional browser previews, but the primary target is the Android APK.

## Required Repo Secrets

For private repositories, set these secrets in the GitHub repo settings when needed:

- `GH_TOKEN`
- `GITHUB_TOKEN_AETHER_CORE1219`
- `GITHUB_TOKEN_TAKATSUSORA_HASH`

`GH_TOKEN` can be a fine-grained token that can read every target repo used for snapshot generation.
