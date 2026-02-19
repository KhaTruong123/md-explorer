#!/usr/bin/env node
/**
 * md-explorer - Localhost file tree with markdown viewer
 * Usage: node server.js [root-dir] [port]
 * Default root: $HOME, Default port: 3939
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(process.argv[2] || os.homedir());
const PORT = parseInt(process.argv[3] || '3939', 10);
const UI_FILE = path.join(__dirname, 'ui.html');

// Directories to skip during search
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'vendor', '.venv']);

/** Ensure requested path stays within ROOT (security check) */
function safePath(reqPath) {
  const normalized = path.resolve(ROOT, reqPath.replace(/^\/+/, ''));
  if (!normalized.startsWith(ROOT)) throw new Error('Access denied');
  return normalized;
}

/** List one directory level, sorted: dirs first then files, hidden entries excluded */
function listDir(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.'))
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map(e => ({
      name: e.name,
      isDir: e.isDirectory(),
      path: path.join(dirPath, e.name).slice(ROOT.length) || '/',
    }));
}

/** Recursively search text/markdown files for query string, max 50 file results */
function searchFiles(dirPath, queryLower, results = [], depth = 0) {
  if (depth > 6 || results.length >= 50) return results;

  let entries;
  try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); }
  catch (_) { return results; }

  for (const e of entries) {
    if (results.length >= 50) break;
    if (e.name.startsWith('.')) continue;

    const fullPath = path.join(dirPath, e.name);

    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) searchFiles(fullPath, queryLower, results, depth + 1);
    } else if (/\.(md|mdx|markdown|txt|json|yaml|yml)$/i.test(e.name)) {
      try {
        const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
        const matches = [];
        for (let i = 0; i < lines.length && matches.length < 5; i++) {
          if (lines[i].toLowerCase().includes(queryLower)) {
            matches.push({ lineNum: i + 1, line: lines[i].trim().slice(0, 300) });
          }
        }
        if (matches.length > 0) {
          results.push({ relPath: fullPath.slice(ROOT.length), name: e.name, matches });
        }
      } catch (_) {}
    }
  }

  return results;
}

function send(res, status, contentType, body) {
  res.writeHead(status, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}
const sendJSON = (res, data) => send(res, 200, 'application/json', JSON.stringify(data));
const sendError = (res, status, msg) => send(res, status, 'application/json', JSON.stringify({ error: msg }));

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;

  // List directory entries
  if (pathname === '/api/tree') {
    try {
      const relPath = url.searchParams.get('path') || '/';
      const absPath = safePath(relPath);
      if (!fs.statSync(absPath).isDirectory()) return sendError(res, 400, 'Not a directory');
      sendJSON(res, { path: relPath, entries: listDir(absPath) });
    } catch (e) { sendError(res, 403, e.message); }
    return;
  }

  // Read file content
  if (pathname === '/api/file') {
    try {
      const relPath = url.searchParams.get('path') || '';
      if (!relPath) return sendError(res, 400, 'Missing path');
      const absPath = safePath(relPath);
      if (!fs.statSync(absPath).isFile()) return sendError(res, 400, 'Not a file');
      const content = fs.readFileSync(absPath, 'utf-8');
      sendJSON(res, { path: relPath, content, ext: path.extname(absPath).toLowerCase(), name: path.basename(absPath) });
    } catch (e) { sendError(res, 403, e.message); }
    return;
  }

  // Search file contents recursively
  if (pathname === '/api/search') {
    try {
      const q = (url.searchParams.get('q') || '').trim();
      if (!q) return sendJSON(res, { results: [] });
      const absDir = safePath(url.searchParams.get('dir') || '/');
      sendJSON(res, { query: q, results: searchFiles(absDir, q.toLowerCase()) });
    } catch (e) { sendError(res, 403, e.message); }
    return;
  }

  // Serve UI
  if (pathname === '/' || pathname === '/index.html') {
    try {
      send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(UI_FILE, 'utf-8'));
    } catch (_) { send(res, 500, 'text/plain', 'ui.html not found'); }
    return;
  }

  sendError(res, 404, 'Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  md-explorer running at http://localhost:${PORT}`);
  console.log(`  Root directory: ${ROOT}`);
  console.log(`  Press Ctrl+C to stop\n`);
});
