# Product Brief

## Working Vision

Build a private smartphone-first app that turns GitHub development status across multiple accounts into a 3D, glanceable operational view.

## Problem

GitHub activity across separate accounts and systems is hard to understand quickly on a phone.
Dashboards are usually flat, dense, and repo-centric rather than system-centric.

## Outcome We Want

Users can open the app on mobile and immediately understand:

- which systems are active
- which repos are blocked
- where reviews are piling up
- which releases are moving
- where CI or issue pressure is growing

## 3D Visualization Direction

- Each system becomes a 3D cluster or orbital group
- Each repository becomes a node, tower, ring, or planet
- Activity intensity affects size, motion, or glow
- Risk indicators affect color and alert motion
- Touch interactions reveal deeper repo or PR state

## Early Metrics To Model

- recent commits
- open pull requests
- review waiting time
- open issues
- CI pass/fail state
- release cadence
- contributor activity

## Phase 1 Goal

Deliver a mobile web prototype that can:

- connect to selected GitHub accounts
- fetch key repository state
- render a simple 3D system map
- filter by account or system
- open detail cards optimized for touch
