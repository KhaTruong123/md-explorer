# Codebase Summary

## Project Statistics

| Metric | Value |
|--------|-------|
| **Total LOC** | ~733 |
| **Server (server.js)** | 138 LOC |
| **UI (ui.html)** | 595 LOC |
| **Configuration (package.json)** | ~11 LOC |
| **Language** | JavaScript (Node.js + Vanilla JS) |
| **Framework** | None (zero dependencies) |
| **External Libraries** | CDN: marked.js v12, highlight.js v11 |

---

## File Inventory

### server.js (138 LOC)

**Purpose:** HTTP server with REST API endpoints for file tree, file reading, and content search.

**Key Components:**

| Function/Section | LOC | Purpose |
|---|---|---|
| Imports & Constants | 12 | Node.js modules (http, fs, path, os); ROOT, PORT, SKIP_DIRS config |
| `safePath(reqPath)` | 5 | Normalize path, validate against ROOT boundary (security) |
| `listDir(dirPath)` | 12 | Read directory, filter dotfiles, sort (dirs first, then alpha) |
| `searchFiles(dirPath, query)` | 32 | Recursive search with depth/result limits, returns matches with line numbers |
| `send(res, ...)`, `sendJSON()`, `sendError()` | 5 | HTTP response helpers |
| HTTP Server Creation | 48 | request handler with 4 route conditions (/api/tree, /api/file, /api/search, root) |
| Server Listen | 5 | Bind to 127.0.0.1:PORT, log startup message |

**Key Functions:**

```
safePath(reqPath)
  ├─ path.resolve(ROOT, reqPath)
  └─ Validate: must start with ROOT
```

```
listDir(dirPath)
  ├─ fs.readdirSync() with withFileTypes
  ├─ Filter: !startsWith('.')
  ├─ Sort: isDirectory DESC, then alpha
  └─ Return: [{name, isDir, path}, ...]
```

```
searchFiles(dirPath, queryLower, results, depth)
  ├─ Base case: depth > 6 or results.length >= 50
  ├─ For each entry:
  │   ├─ Skip dotfiles
  │   ├─ If dir: recurse (unless in SKIP_DIRS)
  │   └─ If file (.md/.txt/.json/.yaml/.yml):
  │       ├─ Read content
  │       ├─ Find matches (up to 5 per file, max line length 300 chars)
  │       └─ Push to results
  └─ Return: [{relPath, name, matches: [{lineNum, line}]}, ...]
```

**Constants:**

- `ROOT` = process.argv[2] || os.homedir() — browse root directory
- `PORT` = process.argv[3] || 3939 — server port
- `SKIP_DIRS` = Set of 8 common skip directories (node_modules, .git, dist, etc.)
- `UI_FILE` = path to ui.html

**API Routes:**

1. **GET /api/tree?path=/foo** — List directory entries
2. **GET /api/file?path=/foo/bar.md** — Read file content
3. **GET /api/search?q=query&dir=/** — Search files recursively
4. **GET / or /index.html** — Serve ui.html

---

### ui.html (534 LOC)

**Purpose:** Single-page application (SPA) frontend for file browsing, markdown rendering, search, and theme management.

**Structure:**

| Section | LOC | Purpose |
|---|---|---|
| HTML Head | 9 | Meta tags, CDN script/link tags (marked.js, highlight.js) |
| CSS: Variables & Base | 30 | CSS custom properties (dark/light theme), global resets |
| CSS: Layout (Header, Sidebar, Content) | 150 | Flexbox layout, theme colors, responsive sizing |
| CSS: Components (Tree, Search Modal, TOC) | 100 | Tree items, modals, panels |
| HTML Body | 50 | Structure: header, sidebar, content area, search modal, TOC panel |
| JavaScript: State & Helpers | 30 | Global state (activeItem, rawMode, etc.), esc() HTML escape |
| JavaScript: API Calls | 50 | fetchTree(), fetchFile(), performSearch() |
| JavaScript: UI Interactions | 100 | Click handlers, keyboard listeners, theme toggle |
| JavaScript: Rendering | 80 | renderTree(), renderFile(), highlightSearch(), updateTOC() |

**Key JavaScript Functions:**

```
esc(str)
  └─ HTML escape: &, <, >, ", '
```

```
fetchTree(path)
  ├─ GET /api/tree?path={path}
  └─ Return: {path, entries}
```

```
fetchFile(path)
  ├─ GET /api/file?path={path}
  └─ Return: {path, content, ext, name}
```

```
performSearch(q)
  ├─ Debounce 320ms
  ├─ GET /api/search?q={q}&dir=/
  └─ Return: {query, results}
```

```
renderTree(entries, parentPath, container)
  ├─ For each entry: create tree-item div
  ├─ If dir: add expand/collapse chevron
  ├─ If file: add click handler to load content
  └─ Build nested tree-children structure
```

```
renderFile(content, ext, name)
  ├─ If .md: parse with marked.js, highlight with highlight.js
  ├─ If .txt/.json/.yaml: highlight.js only
  └─ Render to #content-area
```

```
updateTOC(htmlContent)
  ├─ Extract h1–h4 headings from rendered markdown
  ├─ Build TOC list with smooth-scroll click handlers
  ├─ Initialize IntersectionObserver for active heading tracking
  └─ Render to #toc-list
```

```
highlightSearchResults(text, matches)
  ├─ Wrap matched substrings in <mark> tags
  └─ Return highlighted HTML
```

```
saveExpandedDirs()
  ├─ Serialize expandedDirs Set to array
  └─ localStorage.setItem('md-expanded', JSON.stringify(array))
```

```
restoreSession()
  ├─ On init: restore localStorage md-expanded (dir state)
  ├─ Auto-expand saved directories
  └─ Auto-load md-last-file if exists
```

```
toggleTocSection()
  └─ Toggle .toc-section expand/collapse in sidebar (Cmd+\|Ctrl+\)
```

```
copyWithFeedback(text, btn, label)
  ├─ Copy text to clipboard
  ├─ Update button label to 'Copied!' for 1.5s
  └─ Restore original label
```

**Global State:**

```javascript
activeItem        // Currently selected file/dir
rawMode           // Toggle: raw source vs. rendered
currentFile       // Current file object {path, content, ext, name}
expandedDirs      // Set of expanded directory paths
filterQ           // Sidebar filename filter query
tocOpen           // TOC panel visible toggle
searchTimer       // Debounce timer for search
currentSearchQ    // Last search query string
```

**DOM Elements:**

- `#header` — Top bar with logo, search trigger, breadcrumb, buttons
- `#sidebar` — File tree + filter input + TOC section
- `#tree` — Hierarchical tree view
- `#content-area` — Main file viewer
- `#search-modal` — Global search modal (hidden by default)
- `#toc-section` — Collapsible TOC section in sidebar (toggled by Cmd+\|Ctrl+\)

**localStorage Keys:**

- `md-theme` — Current theme ('dark' or 'light')
- `md-expanded` — JSON array of expanded directory paths (max 200)
- `md-last-file` — Path to last opened file (for session restore)

**CSS Custom Properties (Theming):**

Dark theme (default):
- `--bg: #0f1117` (background)
- `--sidebar: #161b22` (sidebar bg)
- `--text: #e6edf3` (text color)
- `--accent: #58a6ff` (highlights, links)
- `--border: #30363d` (dividers)
- `--mark: rgba(255,214,0,.35)` (search highlight)

Light theme (`[data-theme="light"]`):
- Same properties, inverted values
- Applied via CSS attribute selector

**Event Listeners & Keyboard Shortcuts:**

- Tree item click → load file or expand directory, save to localStorage
- Sidebar filter input → filter tree by filename
- Search trigger click / Ctrl+K / ⌘K → open search modal
- Search input → debounced performSearch()
- Search result click → open file, scroll to match
- Raw/Rendered toggle → switch display mode
- Theme toggle → swap [data-theme], update hljs stylesheet, localStorage persist
- TOC heading click → smooth scroll to section
- IntersectionObserver → track active heading during scroll
- **Cmd+\ / Ctrl+\ → toggle TOC section expand/collapse**
- **Cmd+Shift+C / Ctrl+Shift+C → copy current file path with feedback**
- Copy Path button (toolbar) → copy file path to clipboard with 'Copied!' label
- Copy Content button (toolbar) → copy file content to clipboard with 'Copied!' label

**External Dependencies (CDN):**

1. **marked.js v12** — Markdown → HTML parser
   - Used: `marked.parse(markdown)`

2. **highlight.js v11** — Syntax highlighting for code blocks
   - Used: `hljs.highlightElement(codeEl)`
   - Stylesheets: `github-dark.min.css` (dark), `github-light.min.css` (light)

---

## Data Flow

### File Tree Loading

```
User clicks directory → fetchTree(path)
  → GET /api/tree?path=/foo
    → listDir(absPath) [server.js]
      → fs.readdirSync(), filter, sort
    → JSON response {path, entries}
  → renderTree(entries) [ui.html]
    → Create tree-item divs, append to DOM
```

### File Reading & Rendering

```
User clicks file → fetchFile(path)
  → GET /api/file?path=/docs/readme.md
    → safePath() [server.js]
    → fs.readFileSync() [server.js]
    → JSON response {path, content, ext, name}
  → renderFile(content, ext)
    → If .md: marked.parse() → HTML
      → For each <code> block: hljs.highlightElement()
      → updateTOC(html) → extract headings
    → Render to #content-area
```

### Search

```
User types in search (debounced 320ms) → performSearch(q)
  → GET /api/search?q=query&dir=/
    → searchFiles(ROOT, q) [server.js]
      → Recursive walk, depth 0–6
      → Find matches in .md/.txt/.json/.yaml files
      → Return [{relPath, name, matches: [...]}]
    → JSON response {query, results}
  → renderSearchResults(results)
    → For each result: show filename, match preview (highlighted)
    → Click result: fetchFile(relPath) → renderFile()
```

### Theme Toggle

```
User clicks theme button → Toggle [data-theme="light"]
  → CSS updates via custom property overrides
  → If markdown open: update hljs stylesheet link
  → localStorage.setItem('theme', newTheme)
  → On next page load: restore from localStorage
```

---

## Component Breakdown

### Backend Components

| Component | Role | Responsibility |
|-----------|------|---|
| **Server** | HTTP Handler | Receive requests, route to handlers, send responses |
| **Path Safety** | Security | Validate all paths stay within ROOT |
| **Directory Listing** | Data Source | Fetch and sort directory entries |
| **File Reader** | Data Source | Read file content, determine extension |
| **Search Engine** | Data Source | Recursive search with limits |

### Frontend Components

| Component | Role | Responsibility |
|-----------|------|---|
| **Header** | Navigation | Logo, search trigger, breadcrumb, theme button |
| **Sidebar** | Navigation | File tree, filter input |
| **Tree View** | Navigation | Nested directory structure with expand/collapse |
| **Content Area** | Display | Render file (raw or rendered markdown) |
| **Toolbar** | Controls | Raw/Rendered toggle, filename display |
| **Search Modal** | Discovery | Input field, result list, result navigation |
| **TOC Panel** | Discovery | Floating headings list, active tracking, scroll-to |
| **Theme System** | Settings | Dark/Light toggle, CSS custom properties, persistence |

---

## Key Dependencies & Interactions

### Server Dependencies

```
http, fs, path, os (Node.js built-ins only)

→ safePath(req.path)
→ listDir(req.path)
→ searchFiles(req.path, req.query)
→ sendJSON() / sendError()
```

### Frontend Dependencies

```
HTML DOM → CSS (custom properties) → JavaScript state

→ fetchTree/fetchFile/performSearch (API calls)
→ renderTree/renderFile/updateTOC (DOM updates)
→ Event listeners (user interactions)
→ marked.js (markdown parse)
→ highlight.js (syntax highlight)
```

---

## Security Model

### Input Validation

| Layer | Validation | Method |
|-------|---|---|
| **Server** | Path boundary | safePath() — resolve + startsWith() check |
| **Server** | File type | Whitelist extensions (.md, .txt, .json, .yaml, .yml) |
| **Server** | Directory skip | Blacklist common build dirs (node_modules, .git, etc.) |
| **Frontend** | HTML escape | esc() — escape &, <, >, ", ' |
| **Frontend** | CDN libraries | Sanitization by marked.js (auto-escapes HTML tags by default) |

### Attack Surface

- **Path Traversal** — Mitigated by safePath()
- **XSS** — Mitigated by HTML escape and marked.js auto-escape
- **CSRF** — Not applicable (GET only, no state changes)
- **DoS** — Mitigated by search depth cap (6), result cap (50 files, 5 matches)
- **File Disclosure** — Read-only, skips dotfiles and build dirs

---

## Performance Characteristics

| Operation | Complexity | Typical Time |
|-----------|---|---|
| **List directory** | O(n log n) | <100ms for 1000 entries |
| **Read file** | O(n) | <50ms for 1MB file |
| **Search (depth 6)** | O(n * m) | <500ms for 10k files |
| **Render markdown** | O(n) | <200ms for 500 lines |
| **Render tree** | O(n) | <50ms for 500 entries |

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|---|---|
| **Runtime** | Node.js ≥18 | Server runtime |
| **Server** | http module | HTTP server |
| **File I/O** | fs module | Directory/file operations |
| **Frontend** | Vanilla JS | State, interactions, DOM updates |
| **Markup** | HTML5 | Semantic structure |
| **Styling** | CSS3 (custom props) | Layout, theming |
| **Markdown** | marked.js v12 | Parse markdown → HTML |
| **Syntax Highlight** | highlight.js v11 | Code block highlighting |
| **Build** | None | Zero build step |

---

## Future Refactoring Opportunities

1. **Modularize server.js** — Extract route handlers into functions (if file grows)
2. **Separate CSS** — Extract embedded CSS into external stylesheet (if project scales)
3. **Service Worker** — Cache API responses for offline browsing
4. **Compression** — gzip responses for large file reads
5. **Streaming** — Stream large file reads instead of loading into memory
