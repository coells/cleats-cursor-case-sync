# Copilot Instructions for Cleats: Cursor Case Sync

## Product Intent

- Reduce friction when editing repeated identifiers with multiple cursors.
- Preserve visual and semantic casing consistency across synchronized edits.
- Keep extension behavior predictable and lightweight.

## Functional Behavior Requirements

- Activate automatically after startup.
- Run case synchronization only when all selections are:
    - single-line,
    - equal length,
    - between configured minimum and maximum selection counts.
- Classify tracked text as one of:
    - lowercase,
    - UPPERCASE,
    - Capitalized,
    - leading-lower mixed case,
    - mixed or unclassified.
- Preserve each tracked span's original case style during synchronized edits.
- Ignore undo and redo document changes.
- Remove closed documents from in-memory tracking.

## Configuration Requirements

- Keep `cleatsCursorCaseSync.minSelections` with default `2`.
- Keep `cleatsCursorCaseSync.maxSelections` with default `200`.
- Ensure effective min and max bounds are safe and internally consistent.

## Quality Gate

- Core case-sync model must remain unit-tested.
- Lint and test must run in CI.
- TypeScript must compile in strict mode.
- Before merging release-impacting changes, run:
    - `npm run ci`
    - `npm run package`

## Manual Release Process

### Pre-release checklist

- This project releases manually. Do not assume any GitHub Actions publish path or repository secret-based automation exists.
- Pull latest `main`.
- Verify `package.json` fields:
    - name: `cleats-cursor-case-sync`
    - displayName is correct
    - publisher matches Marketplace publisher ID
    - version is bumped
- Validate locally:
    - `npm ci`
    - `npm run ci`
    - `npm run package`
- Smoke-test the generated VSIX in a clean VS Code profile.

### GitHub release preparation

- Create git tag `vX.Y.Z` matching package version.
- Create GitHub Release and include notable user-facing behavior notes.
- Attach the generated VSIX to the GitHub Release if you want a downloadable artifact.

### Marketplace publish

- Publish from a local shell after validation. Prefer publishing the already-tested VSIX:
    - `npx @vscode/vsce publish --packagePath ./cleats-cursor-case-sync-X.Y.Z.vsix`
- If packaging again is necessary, rebuild locally first and then publish the fresh VSIX.
- Verify Marketplace page renders correctly:
    - display name
    - README
    - changelog tab
    - version

### Post-release

- Install from Marketplace and run smoke tests.
- Confirm behavior for mixed cursor cases and selection settings.

## Release Notes Template

Use this format for release descriptions:

```md
### Summary

Short description of the release and target users.

### Highlights

-

### Configuration or Behavior Notes

- Mention changed settings, defaults, matching behavior, and migration notes.
```

### Validation

- `npm run ci` passed.
- VSIX package built.
- Smoke test completed in VS Code.

### Artifacts

- VSIX file name.
