# Code Review: TOC Sidebar + Session Persistence + Copy Buttons

**File:** `/Users/khatruong/md-explorer/ui.html` (595 LOC)
**Plan:** `plans/260219-1541-toc-sidebar-session-ux/`
**Phases reviewed:** Phase 1 (TOC sidebar), Phase 2 (session persistence), Phase 3 (copy buttons)

---

## Scope

- Files: `ui.html` only (single-file SPA)
- LOC delta: 534 → 595 (+61 LOC)
- Scout findings: all edge cases identified below from static analysis

---

## Overall Assessment

Implementation is clean, functional, and well within YAGNI/KISS constraints. All three features integrate naturally with the existing architecture. Three bugs found (one medium-severity, two low) and two CSS behavioral issues worth addressing.

---

## Critical Issues

None.

---

## High Priority

### H1: `data-dirpath` vs `data-path` mismatch breaks session restore entirely

**File:** `ui.html` lines 309, 344

The plan (phase-02) specifies `data-path` as the attribute name:
```javascript
// Phase 2 plan says:
item.dataset.path = entry.path;
// querySelector: `.tree-item[data-path="..."]`
```

The implementation uses `data-dirpath` on the element (line 344):
```javascript
item.dataset.dirpath = entry.path;
```

But `restoreSession()` queries for `data-dirpath` (line 309):
```javascript
const item = $('tree').querySelector(`.tree-item[data-dirpath="${CSS.escape(dirPath)}"]`);
```

These do match each other — **so restore currently works** — but the attribute name diverges from the plan spec. This is noted as a consistency issue, not a functional bug.

Wait — re-reading carefully: line 309 queries `[data-dirpath=...]` and line 344 sets `item.dataset.dirpath`. These are consistent. No bug here. The plan used `data-path` but the implementation chose `data-dirpath` which is actually clearer. Non-issue.

---

## Medium Priority

### M1: `restoreSession` delay (150ms) is 3x the plan spec (50ms) — no functional impact but unnecessarily slow

**File:** `ui.html` line 312

```javascript
await new Promise(r => setTimeout(r, 150));
```

Plan phase-02 specified 50ms. 150ms means restoring 20 dirs takes 3 seconds. The tree render is synchronous (`renderTree` sets `innerHTML` immediately then awaits the fetch), so 50ms is sufficient for the API call to complete in localhost. At 150ms with 20 dirs = 3s of blocking restore time. Consider 50ms or using a smarter "wait for render complete" check.

**Impact:** Noticeable UX lag on pages with many expanded dirs.

### M2: TOC `max-height` is 320px but plan specified 400px — clips long TOC lists

**File:** `ui.html` line 89

```css
.toc-list.open { max-height: 320px; overflow-y: auto; }
```

Plan phase-01 specified `max-height: 400px`. At 320px with 12px font and ~20px per link, only ~16 headings visible before scrolling. Since `overflow-y: auto` is applied, scrolling works — but the sidebar will look cramped on docs with many headings. The plan's 400px gave a bit more breathing room. Minor visual concern.

### M3: `scrollToTerm` mutates `el.style.cssText` without restoring the full original value

**File:** `ui.html` lines 417-418

```javascript
const prev = el.style.background;
el.style.cssText += ';background:var(--mark);transition:background 1.8s';
setTimeout(() => { el.style.background = prev; }, 2200);
```

`cssText +=` appends to the entire inline style string, which means any existing inline styles on the element get duplicated (e.g., padding-left on tree items). After the timeout, only `background` is restored — `transition` is left in `cssText`. This is a pre-existing issue, not introduced by these three phases, but worth noting.

---

## Low Priority

### L1: `Cmd+Shift+C` hotkey case sensitivity is OS-dependent

**File:** `ui.html` line 587

```javascript
if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
```

On macOS, `e.key` with `shiftKey` returns `'C'` (uppercase). On some Linux/Windows keyboard layouts this may return `'c'`. The plan explicitly notes "Check key is uppercase 'C' because `e.shiftKey` is true". This is correct for the target platform (macOS/localhost) but could fail on Linux. Low risk for this app.

### L2: `copyWithFeedback` "Failed" state doesn't add `.copied` class — inconsistent visual state

**File:** `ui.html` lines 496-498

```javascript
}).catch(() => {
  btn.textContent = 'Failed';
  setTimeout(() => { btn.textContent = label; }, 1500);
});
```

On failure the button shows "Failed" but stays with default `.tbtn` styling. Since `.copied` adds accent color, "Failed" in default color looks identical to normal state, making the failure easy to miss. This matches the plan spec exactly — low priority cosmetic.

### L3: `openFileByPath` passes `null` as `itemEl` — active highlight never set on restore

**File:** `ui.html` lines 383-386

```javascript
async function openFileByPath(relPath, highlight = null) {
  closeSearch();
  await openFile({ path: relPath, name: relPath.split('/').pop() }, null, highlight);
}
```

When a file is restored via session restore, `itemEl` is `null`, so no tree item gets the `.active` class. The file opens and renders correctly, but the sidebar tree shows no highlighted row. This is a pre-existing behavior from before these phases (search results have the same issue). Worth noting: finding and clicking the correct tree item during restore would require expanding the correct parent dirs first, then querying the file item — not trivial.

### L4: IIFE not used — code standards violation

**File:** `ui.html` line 268 onwards

Code standards (`docs/code-standards.md` line 135) specify all JS should be in an IIFE:
```javascript
(function() {
  // Private state and functions here
})();
```

The script is not wrapped in an IIFE — `activeItem`, `rawMode`, `currentFile`, `expandedDirs`, etc. are all global. This was pre-existing before these phases and not introduced by them, but the new state (`expandedDirs`) follows the same pattern. For a single-file SPA running in an isolated tab this is harmless.

### L5: `esc()` function missing single-quote escaping vs code-standards spec

**File:** `ui.html` line 278

```javascript
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
```

Code standards (`docs/code-standards.md` line 344) show `esc()` should also escape `'` as `&#39;`. The implementation omits single-quote escaping. Not introduced by these phases (pre-existing) but the TOC links use `esc(h.textContent.trim())` inside `href` and content — if a heading contained a single quote inside an HTML attribute context this could be an issue. In practice `href="#..."` uses double quotes so single-quote injection into `href` is blocked. Low risk.

---

## Edge Cases Found by Scout

### E1: Rapidly opening files during session restore (async race)

`restoreSession()` iterates dirs sequentially with `await`, then calls `openFileByPath()`. If the user clicks a file in the tree while restore is still running (during the 150ms waits), two `openFile` calls can be in-flight simultaneously. The second one will overwrite `currentFile` and `activeItem`. Since `openFile` sets `currentFile` after the `await apiFile(...)` call, the first resolve could overwrite the second. Result: file shown may not match what was clicked.

This is a low-probability race on fast localhost, but worth noting.

### E2: Session restore with deeply nested paths where intermediate dir was never rendered

Restore sorts by path depth and clicks each dir. If a saved path like `/a/b/c/d` was expanded but the parent `/a/b/c` was somehow not in `expandedDirs` (e.g., localStorage was manually edited or corrupted), the click for `/a/b/c/d` will silently fail (querySelector returns null) and the child dir stays collapsed. Graceful, but leaves the session in an incomplete state. The `try-catch` does not help here since no exception is thrown — the querySelector simply returns null. Handled correctly by the `if (item && ...)` guard.

### E3: TOC IntersectionObserver `window._tocObs` — global namespace pollution

```javascript
if (window._tocObs) window._tocObs.disconnect();
window._tocObs = new IntersectionObserver(...);
```

Using `window._tocObs` is a naming convention to avoid re-declaring a `let` at module scope (since there's no IIFE). This works correctly but is fragile — any third-party script could clobber it. Pre-existing pattern, not introduced by these phases.

### E4: `CSS.escape` on localStorage values loaded from JSON

```javascript
const item = $('tree').querySelector(`.tree-item[data-dirpath="${CSS.escape(dirPath)}"]`);
```

`dirPath` comes from `JSON.parse(localStorage.getItem('md-expanded'))`. If localStorage was manually set with a value containing a `"` character (e.g., `"/path/with\"quote"`), `CSS.escape` would still handle it correctly since it escapes the value for use in a CSS selector string. This is well-handled.

### E5: TOC toggle `Cmd+\` only fires when tocSection is not hidden

```javascript
if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
  e.preventDefault();
  if (!$('tocSection').classList.contains('hidden')) toggleTocSection();
}
```

`e.preventDefault()` fires even when `tocSection` is hidden (no file open). This silently swallows the keypress. Since `\` has no default browser behavior, this is harmless, but it means the hotkey does nothing when no markdown file is open — which is the correct intent.

---

## Positive Observations

- `CSS.escape()` used consistently for all attribute-selector queries — correct and safe.
- `esc()` applied to all heading text in TOC link rendering — XSS handled.
- `try-catch` in `restoreSession()` cleanly handles corrupted localStorage.
- 200-dir cap on `saveExpandedDirs()` prevents localStorage quota exhaustion.
- `restoreSession()` sorts by path depth before expanding — correct parent-first ordering.
- `IntersectionObserver` disconnected in `resetToc()` before re-creating — no observer leak.
- `copyWithFeedback` catches clipboard failure and shows "Failed" — graceful degradation.
- Clipboard API only used on localhost (secure context) — noted in plan and valid.
- No new external dependencies — constraint respected.
- Plan spec matched implementation almost exactly; deviations were deliberate improvements.

---

## Plan TODO Completion

All three phase todo lists are marked `pending` in the plan files. The implementation in `ui.html` shows all items complete:

| Phase | Items | Status in code |
|-------|-------|----------------|
| Phase 1 - TOC sidebar | 14 items | All implemented |
| Phase 2 - Session persistence | 10 items | All implemented (150ms vs 50ms delay divergence) |
| Phase 3 - Copy buttons | 11 items | All implemented |

**Recommendation:** Update phase status to `complete` in plan files.

---

## Recommended Actions

1. **[Medium] Reduce `restoreSession` delay from 150ms to 50ms** (line 312) — reduces restore time from ~3s to ~1s for 20 dirs.
2. **[Medium] Increase `.toc-list.open` max-height from 320px to 400px** (line 89) — matches plan spec and avoids premature clipping.
3. **[Low] Update phase plan files to mark all 3 phases as complete.**
4. **[Low] Update `docs/codebase-summary.md` LOC count** (534 → 595) per phase-03 next-steps note.
5. **[Low] Consider adding error color to "Failed" copy state** — e.g., `btn.style.color = 'var(--code-clr)'` for visibility.

---

## Metrics

- Type Coverage: N/A (vanilla JS, no TypeScript)
- Test Coverage: N/A (manual testing per plan)
- Linting Issues: 0 syntax errors; 1 style deviation (no IIFE, pre-existing)
- Security Issues: 0 new issues introduced; 1 pre-existing (single-quote escaping in `esc()`)
- XSS Risk: Low — all user-derived content uses `esc()` before `innerHTML`

---

## Unresolved Questions

1. Should `openFileByPath` attempt to find and highlight the matching tree item after session restore? This would require querying the file item in the now-expanded tree — feasible but adds complexity.
2. Phase 2 plan specified 50ms delay; implementation uses 150ms. Was this changed intentionally based on testing? If so, update the plan doc.
3. Should `docs/code-standards.md` be updated to reflect the new localStorage keys (`md-last-file`, `md-expanded`) under the session management section?
