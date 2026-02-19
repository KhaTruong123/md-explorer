# Phase 3: Copy Buttons UX

## Context Links

- [plan.md](./plan.md)
- [phase-01-toc-left-sidebar.md](./phase-01-toc-left-sidebar.md) -- prerequisite (removes tocBtn)
- [ui.html](/Users/khatruong/md-explorer/ui.html) -- sole file modified

## Overview

- **Priority:** P2
- **Status:** complete
- **Effort:** 45m

Add "Copy Path" and "Copy Content" buttons to the content toolbar. Use `navigator.clipboard.writeText()`. Visual feedback: button text changes to "Copied!" for 1.5s. Add `Cmd+Shift+C` hotkey for copy path.

## Key Insights

- Content toolbar (`.content-toolbar`, line 96-101 CSS, line 229-235 HTML) already has `.toolbar-btns` container with Raw button
- After Phase 1, `tocBtn` is removed from toolbar, freeing space
- `navigator.clipboard.writeText()` requires secure context (HTTPS or localhost). md-explorer runs on localhost:3939, so clipboard API works
- `currentFile` global holds `{path, content, ext, name}` -- both path and content available

## Requirements

### Functional
1. Add "Copy Path" button to `.toolbar-btns` in content toolbar
2. Add "Copy Content" button to `.toolbar-btns` in content toolbar
3. Copy Path: copies `currentFile.path` to clipboard
4. Copy Content: copies `currentFile.content` (raw source) to clipboard
5. Visual feedback: button text changes to "Copied!" for 1500ms, then reverts
6. Hotkey: `Cmd+Shift+C` / `Ctrl+Shift+C` copies current file path
7. Buttons only visible when a file is open (toolbar already hidden when no file)

### Non-Functional
- Use existing `.tbtn` button styling
- "Copied!" state: add `.copied` class with accent color
- No toast/notification -- inline button text change is sufficient
- Buttons should be before the Raw button (left of Raw, since Raw is rightmost action)

## Architecture

### Button Layout in Toolbar

```
.content-toolbar
  +-- .filename ("readme.md")
  +-- .toolbar-btns (margin-left:auto)
       +-- [Copy Path]    <-- NEW
       +-- [Copy Content] <-- NEW
       +-- [Raw]          <-- existing
```

### Copy Flow

```
User clicks "Copy Path"
  -> navigator.clipboard.writeText(currentFile.path)
  -> Button text: "Copy Path" -> "Copied!"
  -> After 1500ms: "Copied!" -> "Copy Path"

User presses Cmd+Shift+C
  -> Same as clicking "Copy Path"
```

## Related Code Files

Only `/Users/khatruong/md-explorer/ui.html`:

### CSS to Add
```css
.tbtn.copied { border-color: var(--accent); color: var(--accent); }
```

### HTML to Modify -- Toolbar Buttons (line 231-234, after Phase 1 removes tocBtn)
Current (after Phase 1):
```html
<div class="toolbar-btns">
  <button class="tbtn" id="rawBtn">Raw</button>
</div>
```

Updated:
```html
<div class="toolbar-btns">
  <button class="tbtn" id="copyPathBtn" title="Copy file path (⌘⇧C)">Copy Path</button>
  <button class="tbtn" id="copyContentBtn" title="Copy file content">Copy Content</button>
  <button class="tbtn" id="rawBtn">Raw</button>
</div>
```

### JS to Add

```javascript
// ── Copy Buttons ─────────────────────────────────────────────────────────────
function copyWithFeedback(text, btn, label) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = label; btn.classList.remove('copied'); }, 1500);
  }).catch(() => {
    btn.textContent = 'Failed';
    setTimeout(() => { btn.textContent = label; }, 1500);
  });
}

$('copyPathBtn').addEventListener('click', () => {
  if (currentFile) copyWithFeedback(currentFile.path, $('copyPathBtn'), 'Copy Path');
});

$('copyContentBtn').addEventListener('click', () => {
  if (currentFile) copyWithFeedback(currentFile.content, $('copyContentBtn'), 'Copy Content');
});
```

### JS to Modify -- Keydown listener
Add to existing keydown handler:
```javascript
if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
  e.preventDefault();
  if (currentFile) copyWithFeedback(currentFile.path, $('copyPathBtn'), 'Copy Path');
}
```

**Note:** Check key is uppercase 'C' because `e.shiftKey` is true, so `e.key` returns 'C' not 'c'.

## Implementation Steps

1. **Add `.tbtn.copied` CSS rule** -- After existing `.tbtn.on` rule (~line 108)
2. **Add Copy Path button HTML** -- Insert before Raw button in `.toolbar-btns`
3. **Add Copy Content button HTML** -- Insert before Raw button in `.toolbar-btns`
4. **Add `copyWithFeedback()` function** -- Generic copy + visual feedback helper
5. **Add `copyPathBtn` click listener** -- Copy `currentFile.path`
6. **Add `copyContentBtn` click listener** -- Copy `currentFile.content`
7. **Add `Cmd+Shift+C` hotkey** -- In keydown listener, copy path on `Shift+C` with meta/ctrl
8. **Test** -- Open file, click Copy Path, verify clipboard; click Copy Content, verify clipboard; test hotkey; test "Copied!" feedback animation; test when no file open

## Todo List

- [x] Add `.tbtn.copied` CSS rule
- [x] Add Copy Path button to toolbar HTML
- [x] Add Copy Content button to toolbar HTML
- [x] Add `copyWithFeedback()` function
- [x] Wire `copyPathBtn` click listener
- [x] Wire `copyContentBtn` click listener
- [x] Add `Cmd+Shift+C` / `Ctrl+Shift+C` hotkey for copy path
- [x] Test clipboard write works on localhost
- [x] Test "Copied!" feedback reverts after 1.5s
- [x] Test hotkey fires correctly
- [x] Test no errors when no file is open

## Success Criteria

- "Copy Path" button visible in toolbar when file is open
- "Copy Content" button visible in toolbar when file is open
- Clicking "Copy Path" copies the file's relative path to clipboard
- Clicking "Copy Content" copies the file's raw source to clipboard
- Button shows "Copied!" with accent color for 1.5s then reverts
- `Cmd+Shift+C` / `Ctrl+Shift+C` copies file path
- No errors when clipboard API is unavailable (graceful fallback to "Failed" text)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `Cmd+Shift+C` conflicts with DevTools "Copy element" | Low | Low | Only fires when `currentFile` exists; DevTools shortcut is different (`Cmd+Shift+I` or right-click) |
| Clipboard API blocked in some browsers | Very Low | Low | localhost is always secure context; `.catch()` handles failure gracefully with "Failed" text |
| Rapid clicking creates overlapping timeouts | Low | Low | Each click resets text immediately to "Copied!"; final timeout restores label. Worst case: label flickers once |
| Large file content exceeds clipboard limits | Very Low | Low | Modern browsers handle multi-MB clipboard writes; no practical limit for text files |

## Security Considerations

- `navigator.clipboard.writeText()` is safe -- only writes to clipboard, no read
- Content copied is same content already visible to user (no privilege escalation)
- No new server API calls
- No user input involved in copy operation

## Next Steps

- This is the final phase
- After all 3 phases: update docs/codebase-summary.md with new LOC count and component descriptions
