# Project Roadmap

## Overview

md-explorer follows semantic versioning (MAJOR.MINOR.PATCH). This document tracks completed releases and planned features.

---

## v1.0 — Core Features (Feb 2025) ✓ RELEASED

**Status:** Stable, production-ready

### Completed Features

- [x] **File Tree Navigation** — Lazy-load directory explorer with expand/collapse
- [x] **Markdown Rendering** — Parse and display `.md` files with syntax highlighting
- [x] **Raw/Rendered Toggle** — Switch between markdown source and rendered view
- [x] **Full-Text Search** — Global search with match highlighting across project
- [x] **Table of Contents** — Auto-generated headings list with active tracking
- [x] **Dark/Light Theme** — Theme toggle with localStorage persistence
- [x] **Keyboard Shortcuts** — ⌘K / Ctrl+K search, Esc to close modals
- [x] **Path Safety** — Security hardening against directory traversal
- [x] **Zero Dependencies** — Server uses only Node.js built-ins
- [x] **Single-File Deployment** — server.js + ui.html, no build step

### Known Limitations

- Search limited to `.md`, `.txt`, `.json`, `.yaml` files (not code files)
- No syntax highlighting for non-markdown file types (Python, JavaScript, etc.)
- Search results capped at 50 files, 5 matches per file
- Breadcrumb navigation minimal (no segment editing)
- No file preview for images or binary files

---

## v1.1 — Quality-of-Life (Q2 2025) ✓ PARTIAL RELEASE

**Status:** In-progress. UX features released; additional file type support pending

### Proposed Features

#### New File Type Support
- [ ] Add syntax highlighting for additional languages (Python, JavaScript, Go, Rust, etc.)
- [ ] Support `.jsx`, `.tsx`, `.py`, `.go` as searchable file types
- [ ] Render JSON files with pretty-printing and expandable tree view
- [ ] Render YAML with syntax highlighting and comment preservation

#### Enhanced Search
- [ ] Configurable search file types (user can specify extensions to include/exclude)
- [ ] Case-sensitive search toggle
- [ ] Regex search option (with safety limits)
- [ ] Recent searches dropdown (stored in localStorage)

#### Convenience Features
- [x] "Copy file path" button in toolbar — Done (Cmd+Shift+C / Ctrl+Shift+C hotkey)
- [x] "Copy file content" button in toolbar — Done
- [ ] File metadata display (size, modified date, permissions)
- [ ] Breadcrumb click to edit path directly

#### Session Persistence
- [x] Remember last-opened file on page reload — Done (md-last-file key)
- [x] Store expanded directory state in localStorage — Done (md-expanded key, max 200)
- [ ] Restore search query and result selection

#### UI Improvements
- [x] TOC in sidebar — Relocated from floating panel to collapsible section at sidebar bottom (Cmd+\ / Ctrl+\ toggle)

### Acceptance Criteria

- All new features pass manual testing
- No regressions in v1.0 features
- Performance maintained (<500ms search for 10k files)
- Code stays under 200 LOC per file (if modularized)
- Documentation updated for new features

### Effort Estimate

**Completed:**
- **Frontend - UX:** 1.5 hours (copy buttons, session persistence, TOC sidebar improvements) ✓

**Remaining:**
- **Frontend:** 1.5-2 hours (file type renderers: JSON pretty-print, YAML highlighting)
- **Backend:** 0.5-1 hour (file type detection enhancements)
- **Testing:** 0.5 hour (manual testing of file type features)
- **Documentation:** 0.25 hours (update codebase summary)

**Total (Remaining):** ~2.75-3.75 hours

---

## v2.0 — Multi-User & Indexing (Q4 2025) 🟡 VISION

**Status:** High-level vision, architecture not finalized

### Strategic Goals

- Support team/shared use cases (multiple users, permission boundaries)
- Sub-second search on large projects (50k+ files) via indexing
- Enhanced file preview capabilities (images, PDFs, diffs)
- REST API stability guarantee for external tooling

### Proposed Architecture Changes

#### Authentication & Authorization
- [ ] Basic HTTP auth or env var whitelist for user access
- [ ] Per-user configuration (ROOT directory, search options)
- [ ] Read-only permission enforcement (no write/delete)
- [ ] Session management (optional, for advanced use)

**Design:**
```
Configuration:
  USERS=user1:pass1,user2:pass2  (env var or .htpasswd)
  USER_ROOTS=user1:~/docs,user2:~/projects  (per-user ROOT)

On login:
  → Verify credentials
  → Set ROOT to user's directory
  → Return session token (optional)
```

#### Full-Text Search Indexing
- [ ] Build search index on server startup (JSON file cache)
- [ ] Incremental index updates (watch file system for changes)
- [ ] Sub-100ms search via index lookup instead of recursive walk
- [ ] Advanced queries: `AND`, `OR`, phrase search, filters

**Design:**
```
Index Structure:
{
  "lastUpdated": "2025-02-19T10:00:00Z",
  "files": [
    {
      "path": "/docs/readme.md",
      "words": ["install", "setup", "guide"],
      "lines": 142,
      "size": 5000
    }
  ]
}

Search:
  → Lookup words in index
  → Verify against disk (files may have changed)
  → Return results with line numbers
```

#### File Preview Enhancements
- [ ] Image thumbnail preview (`.jpg`, `.png`, `.gif`)
- [ ] PDF preview (client-side with pdf.js)
- [ ] Diff viewer for `.patch` files
- [ ] CSV table viewer
- [ ] Git blame integration (show last editor, date)

#### API Versioning & Documentation
- [ ] Publish OpenAPI/Swagger spec for v2 API
- [ ] Guarantee v1 API backward compatibility
- [ ] Version all endpoints: `/api/v2/tree`, `/api/v2/search`, etc.
- [ ] Deprecation warnings for future v3

### Non-Functional Requirements

- **Performance:** Search sub-100ms for 50k files
- **Scalability:** Support 10+ concurrent users
- **Reliability:** 99.9% uptime (single-machine deployment)
- **Security:** No privilege escalation, secure session tokens
- **Compatibility:** Node.js >=18, modern browsers, backward compat with v1

### Effort Estimate

- **Authentication:** 3-4 hours (HTTP auth middleware, session management)
- **Indexing:** 4-5 hours (file watcher, index builder, search adapter)
- **File Preview:** 3-4 hours (image rendering, PDF support, CSV viewer)
- **API Versioning:** 1-2 hours (route refactor, deprecation warnings)
- **Testing & Docs:** 3-4 hours (unit tests, API docs, migration guide)

**Total:** ~14-19 hours

### Known Risks

- **File Watcher Complexity:** Detecting all file system changes reliably is hard (e.g., bulk renames, network drives)
- **Index Consistency:** Index may become stale; need validation strategy
- **Permission Scoping:** Enforcing read-only across all APIs requires careful design
- **Performance Trade-offs:** Multi-user + indexing increases memory/startup time

---

## v3.0+ — Future Possibilities (2026+) 📈 EXPLORATION

**Status:** Speculative, not planned

### Potential Directions

1. **Cloud Deployment**
   - Support S3, GCS, Azure Blob storage as file sources
   - Multi-region mirroring for teams
   - Collaborative editing with locking

2. **Enhanced Collaboration**
   - Comments and annotations on files
   - Inline note-taking tied to line numbers
   - Shared bookmarks and TOC highlights
   - Activity feed (who viewed what, when)

3. **Advanced Search**
   - Semantic search via embeddings (AI-powered)
   - Fuzzy matching with typo tolerance
   - Saved searches and filters
   - Search analytics (most-used queries, trends)

4. **Mobile Support**
   - Responsive mobile UI
   - PWA (Progressive Web App) support
   - Offline browsing mode
   - Mobile-optimized search and navigation

5. **Integration & Extensibility**
   - Plugin system for custom file renderers
   - Webhook support (notify on file changes)
   - GraphQL API alongside REST
   - Third-party tool integrations (GitHub, GitLab, Jira)

---

## Release Schedule

| Version | Target | Status | Effort |
|---------|--------|--------|--------|
| **v1.0** | Feb 2025 | ✓ Released | ~16 hours (completed) |
| **v1.1** | Q2 2025 | 🟠 In Progress | ~3-4 hours remaining (UX features done, file types pending) |
| **v2.0** | Q4 2025 | 🟡 Vision | ~18 hours |
| **v3.0+** | 2026+ | 📈 Exploration | TBD |

---

## Success Metrics

### v1.0 (Achieved)
- [x] Core features working and stable
- [x] Zero critical bugs reported
- [x] Documentation complete
- [x] Single-file deployment successful
- [x] Local testing on 50k file projects

### v1.1 Target
- [ ] 3+ file type renderers working
- [ ] Search time <300ms for 10k files (vs current <500ms)
- [ ] Positive user feedback on new features
- [ ] No performance regression vs v1.0

### v2.0 Target
- [ ] Multi-user deployment tested with 5+ users
- [ ] Search index working, sub-100ms queries on 50k files
- [ ] API v2 documentation published (OpenAPI spec)
- [ ] v1 API backward compatible, no breaking changes
- [ ] Image/PDF preview working for common formats

---

## Dependency & Blocker Assessment

### v1.0 Blockers (None)
- Already released and stable

### v1.1 Blockers
- **Design**: Need to finalize YAML/JSON pretty-print layout
- **Testing**: Verify all new file types display correctly

### v2.0 Blockers
- **Design**: Authentication model requires careful security review
- **Implementation**: File watcher library selection (native Node.js fs.watch vs npm package)
- **Testing**: Multi-user scenarios need thorough testing to avoid race conditions

### v3.0+ Blockers
- **Strategy**: Decide if cloud support aligns with project goals (might shift to desktop/native)
- **Architecture**: Plugin system requires major refactoring, potential for third-party code injection

---

## Maintenance & Support

### v1.0 Support
- **Bug fixes:** Continue fixing critical issues
- **Security patches:** High priority (publish immediately)
- **Dependency updates:** None (zero npm dependencies for server)
- **End of life:** No planned EOL; v1.0 will be maintained alongside v2.0

### v1.1 Support
- **Overlap:** v1.1 releases when v1.0 reaches stable (no breaking changes)
- **Coexistence:** Both versions can run on same machine (different ports)
- **Migration:** No migration needed; users can update in-place

### v2.0 Support
- **Backward compatibility:** All v1 APIs will work in v2.0
- **Deprecation:** v1 APIs marked deprecated (log warnings) in v2.0
- **Sunset:** v1 APIs removed in v3.0

---

## Feedback & Community

### How to Report Issues
- **Bugs:** Create GitHub Issue with reproduction steps
- **Feature Requests:** GitHub Discussions or Issues (tag: `enhancement`)
- **Security Issues:** Email maintainer privately (do not publish publicly)

### Community Involvement
- **Contributions:** Pull requests welcome; follow code standards in `/docs/code-standards.md`
- **Testing:** Help test new versions before release
- **Documentation:** Improve docs, fix typos, clarify sections
- **Translations:** Internationalization not planned for v1–v2

---

## Summary

**md-explorer** roadmap balances stability with feature growth:

- **v1.0** ✓ ships core features (file explorer, markdown viewer, search)
- **v1.1** 🔵 adds file type support and UX improvements (low risk)
- **v2.0** 🟡 enables multi-user and fast indexing (high complexity, high value)
- **v3.0+** 📈 explores cloud, collaboration, and extensibility (exploratory phase)

All versions maintain security, performance, and zero-dependency philosophy where possible.
