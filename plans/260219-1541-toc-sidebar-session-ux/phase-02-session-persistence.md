# Phase 2: Session Persistence

## Context Links

- [plan.md](./plan.md)
- [ui.html](/Users/khatruong/md-explorer/ui.html) -- sole file modified
- [codebase-summary.md](/Users/khatruong/md-explorer/docs/codebase-summary.md)

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 45m

Persist last-opened file and expanded directories across page reloads using `localStorage`. On init, restore expanded dirs then auto-open the last viewed file.

## Key Insights

- Theme persistence already uses `localStorage.setItem('md-theme', t)` (line 289). Pattern established.
- `renderTree()` is async and lazy-loads children on expand. Restore must walk the tree sequentially (parent before child) to trigger lazy loads.
- Tree nodes use `data-path` or entry.path for identification. Need to ensure expanded dirs can be matched back to DOM elements after restore.
- Current `renderTree()` (lines 294-332) creates tree items with click handlers. Need hooks to save expand/collapse state.

## Requirements

### Functional
1. On `openFile()`: save `entry.path` to `localStorage` key `md-last-file`
2. Track expanded dirs in a `Set<string>`, sync to `localStorage` key `md-expanded` as JSON array
3. On every dir expand/collapse click in `renderTree()`: update the set and persist
4. On init (after `renderTree('/')` completes):
   - Restore expanded dirs: for each saved path, find the tree node and trigger expand
   - Auto-open last file: call `openFileByPath(lastFile)` if saved path exists

### Non-Functional
- Restore should not flash/flicker -- show loading state until restore completes
- If saved file no longer exists, silently skip (no error shown)
- If saved dir no longer exists, silently skip and continue with remaining dirs
- Max 200 dirs tracked (prevent localStorage bloat)

## Architecture

### localStorage Schema

```
md-last-file  = "/docs/readme.md"            (string, relative path)
md-expanded   = ["/docs","/docs/api","/src"]  (JSON array of strings)
md-theme      = "dark"                        (existing, unchanged)
```

### Restore Flow

```
Init
  |
  v
renderTree($('tree'), '/', 0)   -- renders root level
  |
  v
restoreSession()
  |
  +-> expandedDirs = JSON.parse(localStorage.getItem('md-expanded')) || []
  +-> Sort by depth (shortest path first, ensures parents expand before children)
  +-> For each dir path:
  |     Find .tree-item with matching data-path
  |     Simulate click (trigger lazy load + expand)
  |     await lazy load to complete
  |
  +-> lastFile = localStorage.getItem('md-last-file')
  +-> If lastFile: openFileByPath(lastFile)
```

### Data Flow

```
User clicks dir to expand
  -> dir.click handler fires
  -> expandedDirs.add(entry.path)
  -> saveExpandedDirs()

User clicks dir to collapse
  -> dir.click handler fires
  -> expandedDirs.delete(entry.path)
  -> saveExpandedDirs()

User opens file
  -> openFile() fires
  -> localStorage.setItem('md-last-file', entry.path)
```

## Related Code Files

Only `/Users/khatruong/md-explorer/ui.html`:

### State to Add (near line 270)
```javascript
const expandedDirs = new Set();
```

### JS to Modify

#### `renderTree()` (lines 294-332) -- dir click handler
Current (lines 318-322):
```javascript
item.addEventListener('click', async () => {
  const isOpen = children.classList.contains('open');
  item.classList.toggle('open', !isOpen);
  children.classList.toggle('open', !isOpen);
  if (!isOpen && !loaded) { loaded = true; await renderTree(children, entry.path, level + 1); }
});
```

Updated:
```javascript
item.dataset.path = entry.path;  // Add data-path for restore lookup
item.addEventListener('click', async () => {
  const isOpen = children.classList.contains('open');
  item.classList.toggle('open', !isOpen);
  children.classList.toggle('open', !isOpen);
  if (!isOpen && !loaded) { loaded = true; await renderTree(children, entry.path, level + 1); }
  // Persist expand/collapse state
  if (!isOpen) expandedDirs.add(entry.path);
  else expandedDirs.delete(entry.path);
  saveExpandedDirs();
});
```

#### `openFile()` (lines 335-347) -- save last file
Add after `currentFile = await apiFile(entry.path);`:
```javascript
localStorage.setItem('md-last-file', entry.path);
```

#### Init section (lines 530-531)
Current:
```javascript
setTheme(localStorage.getItem('md-theme') || 'dark');
renderTree($('tree'), '/', 0);
```

Updated:
```javascript
setTheme(localStorage.getItem('md-theme') || 'dark');
renderTree($('tree'), '/', 0).then(() => restoreSession());
```

### JS to Add

```javascript
// ── Session Persistence ──────────────────────────────────────────────────────
function saveExpandedDirs() {
  const arr = [...expandedDirs].slice(0, 200);
  localStorage.setItem('md-expanded', JSON.stringify(arr));
}

async function restoreSession() {
  // Restore expanded directories
  try {
    const saved = JSON.parse(localStorage.getItem('md-expanded') || '[]');
    // Sort by depth (parents first)
    saved.sort((a, b) => a.split('/').length - b.split('/').length);
    for (const dirPath of saved) {
      const item = $('tree').querySelector(`.tree-item[data-path="${CSS.escape(dirPath)}"]`);
      if (item && !item.classList.contains('open')) {
        item.click();
        // Wait for lazy load to complete
        await new Promise(r => setTimeout(r, 50));
      }
    }
  } catch (_) { /* corrupted data, skip */ }

  // Restore last opened file
  const lastFile = localStorage.getItem('md-last-file');
  if (lastFile) {
    try { await openFileByPath(lastFile); } catch (_) { /* file gone, skip */ }
  }
}
```

## Implementation Steps

1. **Add `expandedDirs` set** -- Declare `const expandedDirs = new Set();` in state section
2. **Add `data-path` to dir items** -- In `renderTree()`, set `item.dataset.path = entry.path` for directory items
3. **Add expand/collapse tracking** -- In dir click handler, add/remove from `expandedDirs` + call `saveExpandedDirs()`
4. **Add `saveExpandedDirs()` function** -- Serialize set to localStorage, cap at 200 entries
5. **Add last-file save** -- In `openFile()`, after `currentFile = await apiFile(...)`, save path to localStorage
6. **Add `restoreSession()` function** -- Read localStorage, expand dirs sequentially, then open last file
7. **Update init** -- Chain `.then(() => restoreSession())` after `renderTree()`
8. **Test** -- Open file, expand dirs, reload page, verify state restored; delete localStorage, verify clean start; test with missing file/dir

## Todo List

- [x] Add `expandedDirs` Set to state section
- [x] Add `data-path` attribute to dir tree items
- [x] Add expand/collapse tracking in dir click handler
- [x] Add `saveExpandedDirs()` function
- [x] Add `localStorage.setItem('md-last-file', ...)` in `openFile()`
- [x] Add `restoreSession()` function
- [x] Update init to chain `restoreSession()` after `renderTree()`
- [x] Test: expand dirs, open file, reload -- state restored
- [x] Test: delete localStorage keys, reload -- clean start
- [x] Test: rename/delete saved file, reload -- no error, graceful skip

## Success Criteria

- After opening a file and expanding some dirs, page reload restores exact same state
- Tree dirs are expanded in correct order (parents before children)
- Last-opened file is displayed with correct rendering
- If saved file/dir no longer exists, no error shown; app works normally
- localStorage keys are `md-last-file`, `md-expanded` (prefixed with `md-` for namespace)
- Max 200 dirs stored (no localStorage bloat)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Slow restore with many expanded dirs | Medium | Low | 50ms delay per dir is imperceptible for <20 dirs; cap at 200 |
| Race condition: renderTree not finished when restoreSession runs | Low | High | `.then()` chaining ensures renderTree completes first |
| CSS.escape not available in very old browsers | Very Low | Low | CSS.escape is supported in all modern browsers; md-explorer already uses it (line 415) |
| Corrupt localStorage data | Low | Low | Wrapped in try-catch, silently skips |
| `data-path` selector collision with special chars in paths | Low | Medium | Using `CSS.escape()` handles special characters in attribute selectors |

## Security Considerations

- Only storing file paths (strings) in localStorage -- no sensitive data
- Paths are relative (e.g., `/docs/readme.md`), not absolute filesystem paths
- No new server API calls; all restore logic uses existing `apiTree()` and `openFileByPath()`
- `JSON.parse()` wrapped in try-catch to prevent crash on corrupt data
- 200-entry cap prevents localStorage quota exhaustion

## Next Steps

- Independent of Phase 1; can be implemented in parallel
- Phase 3 does not depend on this phase
