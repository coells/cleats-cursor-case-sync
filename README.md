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

- `username`
- `USERNAME`
- `UserName`
- `userName`

Type `newValue` once and results become:

- `newvalue`
- `NEWVALUE`
- `NewValue`
- `newValue`

## Settings

- `cleatsCursorCaseSync.minSelections`
  - Minimum selections required before sync is active.
  - Default: `2`
- `cleatsCursorCaseSync.maxSelections`
  - Maximum selections allowed before sync is suspended.
  - Default: `200`

## Development

Install and validate:

```sh
npm install
npm run ci
```

## Debugging In VS Code

Launch profiles in `.vscode/launch.json`:

- `Run Extension (Build Once)`
- `Run Extension (Watch)`

Useful tasks in `.vscode/tasks.json`:

- `npm: compile`
- `npm: watch`
- `npm: lint`
- `npm: test`
- `npm: package`

Smoke test flow:

1. Run `Run Extension (Watch)`.
2. Open a text file in the Extension Development Host.
3. Create 3-4 equal-length selections with different casing.
4. Type replacement text and verify each selection keeps its own case style.

## Release Process

- Releases are manual.
- The authoritative Copilot-facing checklist lives in `.github/copilot-instructions.md`.
- Recommended release flow:

```sh
npm ci
npm run ci
npm run package
```

- Publish the tested VSIX from a local shell:

```sh
npx @vscode/vsce publish --packagePath ./cleats-cursor-case-sync-X.Y.Z.vsix
```

## Release History

### 0.1.0 (2026-04-25)

- Initial release candidate.
- Reimplemented multi-cursor case synchronization with modular core logic.
- Added configurable min and max selection thresholds.
- Added unit tests for case classification and content-change synchronization.
