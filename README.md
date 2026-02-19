# md-explorer

A zero-dependency, localhost-only file explorer with markdown viewer. Browse your file system, search content, and preview markdown files with syntax highlighting—all in the browser.

## Features

- **Fast File Browsing** — Lazy-load directory trees with expand/collapse navigation
- **Markdown Viewer** — Renders `.md` files with syntax-highlighted code blocks (powered by marked.js + highlight.js)
- **Raw/Rendered Toggle** — Switch between raw source and rendered markdown instantly
- **Full-Text Search** — Global content search with match highlighting (⌘K / Ctrl+K)
- **Floating TOC** — Auto-generated table of contents for markdown files, with active heading tracking
- **Dark/Light Theme** — CSS-based theme toggle, persisted in localStorage
- **Security** — Path traversal protection, runs on localhost only, zero external dependencies for server
- **No Setup** — Single Node.js file, no database, no installation required

## Quick Start

```bash
# Install (if needed)
npm install

# Start server, default: http://localhost:3939 browsing $HOME
npm start

# Or specify root directory and port
node server.js /path/to/files 8080

# Alias: browse home at port 3939
npm run start:home
```

Then open **http://localhost:3939** in your browser.

## Usage

### File Navigation
- Click folder icons to expand directories
- Click filenames to open and view
- Use the filter input to search by filename within current directory
- Click breadcrumb path to jump to parent directories

### Markdown Editing
- **Raw Mode** — View markdown source code with syntax highlighting
- **Rendered Mode** — See formatted markdown output
- Toggle between modes with the **Raw / Rendered** button in toolbar

### Content Search
- Press **⌘K** (macOS) or **Ctrl+K** (Windows/Linux) to open search
- Type query to search `.md`, `.txt`, `.json`, `.yaml`, `.yml` files
- Click result to jump to matching file and scroll to first match
- Matched text is highlighted in yellow

### Table of Contents
- Click **TOC** button to toggle floating panel (appears when markdown file is open)
- TOC extracts h1–h4 headings automatically
- Click heading to smooth-scroll to section
- Active heading is highlighted as you scroll

### Theme
- Click theme toggle button (top-right) to switch dark ↔ light
- Selection is saved automatically

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **⌘K** / **Ctrl+K** | Open global search |
| **Esc** | Close search or TOC |
| **Click breadcrumb** | Navigate to parent |

## API Reference

All endpoints return JSON. All paths are relative to ROOT.

### GET /api/tree
List directory contents.

**Params:**
- `path` (optional, default: `/`) — Relative path to directory

**Response:**
```json
{
  "path": "/",
  "entries": [
    { "name": "Documents", "isDir": true, "path": "/Documents" },
    { "name": "notes.md", "isDir": false, "path": "/notes.md" }
  ]
}
```

### GET /api/file
Read file content.

**Params:**
- `path` (required) — Relative path to file

**Response:**
```json
{
  "path": "/README.md",
  "name": "README.md",
  "ext": ".md",
  "content": "# Title\n..."
}
```

### GET /api/search
Search file contents recursively.

**Params:**
- `q` (required) — Search query string
- `dir` (optional, default: `/`) — Search scope directory

**Response:**
```json
{
  "query": "example",
  "results": [
    {
      "relPath": "/docs/guide.md",
      "name": "guide.md",
      "matches": [
        { "lineNum": 42, "line": "This is an example of..." }
      ]
    }
  ]
}
```

## Architecture

**Server** (`server.js`, 138 LOC):
- Single Node.js HTTP server, zero dependencies
- `safePath()` enforces path boundaries (prevents directory traversal)
- `listDir()` returns single directory level, sorted (dirs first, hidden excluded)
- `searchFiles()` recursively indexes `.md`, `.txt`, `.json`, `.yaml` files (skips node_modules, .git, etc.)

**UI** (`ui.html`, 534 LOC):
- Vanilla JavaScript + CSS, no framework
- CDN libraries: marked.js (markdown parse), highlight.js (syntax highlight)
- CSS custom properties for theming, IntersectionObserver for TOC tracking
- HTML escape sanitization for all API responses

See [/docs](/docs) for detailed documentation.

## System Requirements

- **Node.js** ≥18
- **Modern browser** (Chrome, Firefox, Safari, Edge)
- **Localhost access** only (0.0.0.0:PORT)

## Security

- **Path Traversal Protection** — `safePath()` validates all paths against ROOT
- **HTML Escaping** — API responses sanitized via `esc()` function
- **Local Network Only** — Server bound to 127.0.0.1, not exposed to WAN
- **Read-Only** — No write operations; safe for untrusted directories
- **No Authentication** — Intended for personal/team use, not multi-user

## Project Structure

```
md-explorer/
├── server.js        # HTTP server, API endpoints, path safety
├── ui.html          # Full SPA: HTML structure + CSS + JS
├── package.json     # Metadata, scripts, node >=18 requirement
└── README.md        # This file
```

## License

ISC (see package.json)

## Contributing

Report issues or suggest features via GitHub Issues.

---

**Need help?** Check [./docs/system-architecture.md](./docs/system-architecture.md) for deep dive into request flows and component details.
