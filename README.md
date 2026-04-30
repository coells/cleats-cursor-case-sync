# Cleats: Cursor Case Sync

Preserve casing style while editing repeated identifiers with multiple selections in VS Code.

When you edit one selection in a compatible multi-selection set, this extension mirrors the text update across all tracked selections while keeping each target's original case style.

## Why It Exists

Bulk identifier edits often break naming consistency. This extension keeps edits synchronized without flattening case styles, so mixed naming formats stay predictable.

## Behavior

- Supports these case styles per tracked selection:
  - lowercase
  - UPPERCASE
  - Capitalized
  - leading-lower mixed case
  - mixed or unclassified
- Synchronization is active only when all selections are:
  - single-line
  - equal length
  - within configured min and max selection bounds
- Undo behavior stays clean by avoiding extra undo stops.
- Undo and redo document events are ignored for synchronization logic.

## Quick Example

Source selections:

- `helloword`
- `HELLOWORD`
- `HelloWord`
- `helloWord`

Type `HelloWorld` once and results become:

- `helloworld`
- `HELLOWORLD`
- `HelloWorld`
- `helloWorld`

## Settings

- `cleatsCursorCaseSync.minSelections`
  - Minimum selections required before sync is active.
  - Default: `2`
- `cleatsCursorCaseSync.maxSelections`
  - Maximum selections allowed before sync is suspended.
  - Default: `200`

## Release History

### 0.1.0 (2026-04-25)

- Initial release candidate.
- Reimplemented multi-cursor case synchronization with modular core logic.
- Added configurable min and max selection thresholds.
- Added unit tests for case classification and content-change synchronization.

### 0.1.1 (2026-04-30)

- Minor bug fixes.
