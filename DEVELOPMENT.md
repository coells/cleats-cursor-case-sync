
# Development

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
- Before packaging, verify `package.json` release metadata (for example `version` and `icon`).
- Maintain packaging rules in `.vscodeignore` as the single source of truth for VSIX file inclusion.
- Do not combine `.vscodeignore` with `package.json` `files` filtering; VSCE rejects that combination.
- Recommended release flow:

```sh
npm ci
npm run ci
npm run package
npx @vscode/vsce ls --tree
```

- Review `npx @vscode/vsce ls --tree` output to confirm release bundles only runtime artifacts (README, icon/media, license, `package.json`, and compiled `out/src`).

- Publish the tested VSIX from a local shell:

```sh
npx @vscode/vsce publish --packagePath ./cleats-cursor-case-sync-X.Y.Z.vsix
```
