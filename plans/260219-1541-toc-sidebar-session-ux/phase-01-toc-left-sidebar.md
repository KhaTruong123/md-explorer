# Phase 1: TOC in Left Sidebar

## Context Links

- [plan.md](./plan.md)
- [ui.html](/Users/khatruong/md-explorer/ui.html) -- sole file modified
- [codebase-summary.md](/Users/khatruong/md-explorer/docs/codebase-summary.md)
- [code-standards.md](/Users/khatruong/md-explorer/docs/code-standards.md)

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 1h

Replace the floating `.toc-panel` (fixed right-side div, lines 141-160 CSS, lines 246-249 HTML) with a collapsible `.toc-section` at the bottom of the left sidebar. Remove `tocBtn` from toolbar. Add `Cmd+\`/`Ctrl+\` hotkey to toggle.

## Key Insights

- Current TOC is a `position:fixed` panel sliding in from the right edge (`transform:translateX`). Works but overlaps content and is visually disconnected from navigation.
- Sidebar already uses `flex-direction:column` with filter + tree. Adding a third section at the bottom is natural.
- IntersectionObserver logic in `buildToc()` (lines 424-431) is solid; root is already `contentBody`. Reuse entirely.
- `tocBtn` in toolbar (line 233) toggles panel visibility. Replace with sidebar section auto-expand.

## Requirements

### Functional
1. Remove `.toc-panel` floating div and all its CSS (`.toc-panel`, `.toc-header`)
2. Remove `tocBtn` from toolbar HTML and its JS click handler
3. Add `.toc-section` as third child of `.sidebar`, after `.tree`
4. `.toc-section` contains header ("ON THIS PAGE" + chevron) and `.toc-list` container
5. TOC auto-expands when a markdown file with >= 1 heading is opened
6. TOC auto-collapses/hides when non-markdown file opened or no headings
7. Click `.toc-section-header` to manually toggle expand/collapse
8. Hotkey: `Cmd+\` / `Ctrl+\` toggles toc-section
9. Active heading tracking via IntersectionObserver (reuse existing logic)

### Non-Functional
- CSS animation: `max-height` transition (0 <-> 400px) with `overflow:hidden`
- No layout shift in sidebar when TOC appears/disappears
- `.toc-link` styling reused from current implementation (just re-parented)

## Architecture

### Sidebar Layout After Change

```
.sidebar (flex-direction:column)
  +-- .sidebar-filter  (flex-shrink:0, file filter input)
  +-- .tree            (flex:1, overflow-y:auto, scrollable)
  +-- .toc-section     (flex-shrink:0, collapsible, hidden by default)
       +-- .toc-section-header  ("ON THIS PAGE" label + chevron)
       +-- .toc-list            (max-height animated, overflow:hidden)
            +-- .toc-link items (reused class)
```

### State Changes

- Remove global `tocOpen` variable (no longer needed; replaced by DOM class toggle)
- `buildToc()` updated to render into `.toc-list` instead of `#tocList`
- `resetToc()` updated to collapse/hide `.toc-section`

## Related Code Files

Only `/Users/khatruong/md-explorer/ui.html`:

### CSS to Remove (lines 140-160)
- `.toc-panel` block (position:fixed, transform, shadow)
- `.toc-panel.visible`
- `.toc-header` block

### CSS to Add
- `.toc-section` -- bottom of sidebar, border-top, flex-shrink:0
- `.toc-section.hidden` -- display:none (when no headings)
- `.toc-section-header` -- flex row, cursor:pointer, uppercase label, chevron
- `.toc-list` -- max-height:0, overflow:hidden, transition:max-height .25s ease
- `.toc-list.open` -- max-height:400px
- `.toc-link` -- reuse existing styles (no change needed)
- `.toc-link.active` -- reuse existing styles

### HTML to Remove (lines 245-249)
- Entire `<div class="toc-panel" id="tocPanel">...</div>` block

### HTML to Remove from Toolbar (line 233)
- `<button class="tbtn" id="tocBtn" style="display:none">TOC</button>`

### HTML to Add (inside `.sidebar`, after `#tree`)
```html
<div class="toc-section hidden" id="tocSection">
  <div class="toc-section-header" id="tocToggle">
    <span>ON THIS PAGE</span>
    <span class="toc-chevron">▶</span>
  </div>
  <div class="toc-list" id="tocList"></div>
</div>
```

### JS to Remove
- `tocOpen` state variable (line 271)
- `$('tocBtn').addEventListener('click', ...)` block (lines 445-449)
- References to `$('tocPanel')` in `resetToc()` (line 439)
- References to `$('tocBtn')` in `resetToc()` (lines 440-441) and `buildToc()` (lines 395, 433)

### JS to Modify

#### `buildToc()` (lines 392-434)
- Replace `$('tocBtn').style.display = 'none'` with `$('tocSection').classList.add('hidden')`
- Replace `$('tocList')` references (already same ID, no change needed if ID kept)
- After rendering TOC links, auto-expand: `$('tocList').classList.add('open')` + update chevron
- Replace `$('tocBtn').style.display = ''` at end with `$('tocSection').classList.remove('hidden')`

#### `resetToc()` (lines 436-443)
- Replace `$('tocPanel').classList.remove('visible')` with `$('tocSection').classList.add('hidden')`
- Remove `$('tocBtn')` references
- Collapse list: `$('tocList').classList.remove('open')`

#### Keydown listener (lines 524-527)
- Add: `if ((e.metaKey || e.ctrlKey) && e.key === '\\') { e.preventDefault(); toggleTocSection(); }`

### JS to Add

```javascript
// Toggle TOC section expand/collapse
function toggleTocSection() {
  const list = $('tocList');
  const isOpen = list.classList.contains('open');
  list.classList.toggle('open', !isOpen);
  $('tocToggle').querySelector('.toc-chevron').style.transform = isOpen ? '' : 'rotate(90deg)';
}

$('tocToggle').addEventListener('click', toggleTocSection);
```

## Implementation Steps

1. **Remove floating TOC CSS** -- Delete `.toc-panel`, `.toc-panel.visible`, `.toc-header` rules (lines 140-153)
2. **Add `.toc-section` CSS** -- Add new rules for `.toc-section`, `.toc-section.hidden`, `.toc-section-header`, `.toc-chevron`, `.toc-list`, `.toc-list.open` after sidebar CSS section (~line 76)
3. **Keep `.toc-link` CSS** -- Already defined at lines 154-160; keep as-is (just re-parented)
4. **Remove floating TOC HTML** -- Delete `<div class="toc-panel">...</div>` (lines 245-249)
5. **Remove `tocBtn` from toolbar** -- Delete `<button class="tbtn" id="tocBtn"...>` (line 233)
6. **Add `.toc-section` HTML** -- Insert after `<div class="tree" id="tree"></div>` inside `.sidebar`
7. **Remove `tocOpen` variable** -- Delete from line 271 state declaration
8. **Remove `tocBtn` click handler** -- Delete lines 445-449
9. **Update `buildToc()`** -- Replace `$('tocBtn')` and `$('tocPanel')` refs with `$('tocSection')` + auto-expand
10. **Update `resetToc()`** -- Replace `$('tocPanel')` and `$('tocBtn')` refs with `$('tocSection')` + collapse
11. **Add `toggleTocSection()` function** -- New function for sidebar toc toggle
12. **Add `tocToggle` click listener** -- Wire up header click
13. **Add `Cmd+\` / `Ctrl+\` hotkey** -- In keydown listener, add condition for `\\` key
14. **Test** -- Open markdown file, verify TOC appears in sidebar; toggle works; active heading tracking works; non-md file hides TOC; hotkey works

## Todo List

- [x] Remove `.toc-panel` / `.toc-header` CSS
- [x] Add `.toc-section` / `.toc-section-header` / `.toc-list` CSS
- [x] Remove floating TOC HTML
- [x] Remove `tocBtn` from toolbar
- [x] Add `.toc-section` HTML inside sidebar
- [x] Remove `tocOpen` state var
- [x] Remove `tocBtn` click handler
- [x] Update `buildToc()` to target sidebar TOC + auto-expand
- [x] Update `resetToc()` to target sidebar TOC + collapse
- [x] Add `toggleTocSection()` function
- [x] Wire `tocToggle` click listener
- [x] Add `Cmd+\`/`Ctrl+\` hotkey
- [x] Verify IntersectionObserver still tracks active heading
- [x] Verify smooth-scroll to heading from TOC link

## Success Criteria

- Floating TOC panel no longer exists
- TOC appears at bottom of left sidebar when markdown file with headings is opened
- TOC collapses/hides when non-markdown file or file with no headings opened
- Click "ON THIS PAGE" header toggles TOC expand/collapse
- `Cmd+\`/`Ctrl+\` toggles TOC section
- Active heading tracking works (blue highlight on current heading)
- Smooth scroll to heading on TOC link click
- No visual regressions in sidebar tree or content area

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `max-height:400px` clips long TOC lists | Medium | Low | Use `overflow-y:auto` on `.toc-list` so it scrolls internally |
| TOC section pushes tree up when expanded | Low | Medium | `flex-shrink:0` on toc-section + `flex:1;overflow-y:auto` on tree already handles this |
| `Cmd+\` hotkey | Low | Low | No known browser conflicts. `e.key === '\\'` catches backslash correctly across all platforms. |

## Security Considerations

- No new external inputs; TOC content derived from already-rendered markdown headings
- `esc()` already applied to heading text in TOC link rendering
- No localStorage changes in this phase
- No server API changes

## Next Steps

- Phase 2 (Session Persistence) can proceed in parallel
- Phase 3 (Copy Buttons) depends on this phase completing (removes `tocBtn` from toolbar, making room for copy buttons)
