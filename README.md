# Git Orbit Mobile

Private mobile-first app concept for visualizing the development status of multiple GitHub accounts and repositories in 3D.

## What This Repo Is For

This folder is a low-pollution project staging area.
No dependencies are installed yet.
No framework has been initialized yet.
No existing workspace files were modified.

## Product Direction

- Target: smartphone-first web app
- Core idea: visualize GitHub development activity as a 3D space
- Users: people who want to monitor progress across multiple GitHub accounts, repos, or systems
- Access model: private app and private repository

## Initial Feature Ideas

- GitHub account and repository linking
- 3D overview of repo health, activity, and delivery state
- Visual signals for commits, PRs, issues, review load, and CI status
- Mobile-friendly touch navigation
- Per-account and cross-account filtering
- Daily and weekly progress views

## Suggested Stack

Because this needs 3D and mobile support, a strong first option is:

- Frontend: React + TypeScript
- 3D: React Three Fiber / Three.js
- App shell: Vite
- Mobile target: responsive PWA first, native wrapper later if needed
- Backend later: lightweight API service for GitHub aggregation

## Why Start This Way

- Keeps local clutter low
- Lets us validate the concept before installing dependencies
- Makes GitHub repository creation and first commit straightforward

## Next Step

Follow [SETUP-GITHUB.md](C:/Users/it11ataniguchi/Documents/New%20project/git-orbit-mobile/SETUP-GITHUB.md) to create the private repository, then I can continue with the actual app scaffold inside this folder.
