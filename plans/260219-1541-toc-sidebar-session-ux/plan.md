---
title: "TOC Sidebar + Session Persistence + UX Wins"
description: "Move TOC to left sidebar, add session persistence, add copy buttons"
status: complete
priority: P1
effort: 2.5h
branch: main
tags: [ux, frontend, ui.html]
created: 2026-02-19
completed: 2026-02-19
---

# TOC Sidebar + Session Persistence + UX Wins

## Overview

Three UX improvements to md-explorer, all scoped to `ui.html` only. No server changes, no new files, no npm packages.

## File Modified

- `/Users/khatruong/md-explorer/ui.html` (currently 534 LOC)

## Phases

| # | Phase | Effort | Status | Details |
|---|-------|--------|--------|---------|
| 1 | [TOC in Left Sidebar](./phase-01-toc-left-sidebar.md) | 1h | complete | Replace floating `.toc-panel` with collapsible `.toc-section` at bottom of sidebar |
| 2 | [Session Persistence](./phase-02-session-persistence.md) | 45m | complete | Remember last file + expanded dirs via localStorage |
| 3 | [Copy Buttons UX](./phase-03-copy-buttons-ux.md) | 45m | complete | Copy Path + Copy Content buttons in toolbar, hotkey |

## Key Constraints

- ONLY modify `ui.html`
- server.js unchanged
- No new files or npm packages
- Use existing CSS vars: `--bg`, `--sidebar`, `--border`, `--text`, `--muted`, `--accent`, `--hover`, `--active`

## Dependencies

- Phase 1 must complete before Phase 3 (Phase 3 removes `tocBtn` which Phase 1 replaces)
- Phase 2 is independent; can run in parallel with Phase 1

## Architecture Impact

- Sidebar layout changes from 2-section (filter + tree) to 3-section (filter + tree + toc)
- localStorage keys added: `md-last-file`, `md-expanded`
- Existing localStorage key `md-theme` unchanged
- IntersectionObserver reused from current TOC, just re-rooted

## Risk Summary

- CSS `max-height` animation for toc-section may need tuning if many headings
- Session restore could fail if file tree structure changed between sessions
- Clipboard API requires HTTPS or localhost (we're localhost, so fine)
