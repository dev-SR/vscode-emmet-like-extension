# Wrap Selection Presets

Local VS Code / Cursor extension that wraps the current editor selection with markdown, HTML, fenced code blocks, or custom `<Mark>` components via:

1. **Command Palette** — `Wrap Selection…` / `Wrap with Mark…`
2. **Keyboard shortcut** — `Alt+M` (when there is a selection)
3. **Editor context menu** — right-click → Wrap Selection…

Private / local only — not published to the marketplace.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 8+
- Cursor or VS Code (engines: `^1.85.0`)

## Develop

```bash
pnpm install
pnpm run compile
```

Then press **F5** (Run Extension) to open an Extension Development Host and try commands there.

Watch mode:

```bash
pnpm run watch
```

## Install locally into Cursor (Linux)

### Option A — VSIX

```bash
pnpm install
pnpm run compile
pnpm run package
```

This produces `wrap-selection-presets-0.1.1.vsix` (version may bump). In Cursor:

1. Command Palette (`Ctrl+Shift+P`)
2. **Extensions: Install from VSIX…**
3. Choose the `.vsix` file
4. Reload the window if prompted

### Option B — Install from Location

After `pnpm run compile`:

1. Command Palette → **Developer: Install Extension from Location…** (wording may vary slightly)
2. Select this extension folder (the one containing `package.json` and `out/`)
3. Reload if prompted

### Reload the extension (after code changes)

| How you run it | How to reload |
| --- | --- |
| **F5 Extension Development Host** | In the *dev host* window: `Ctrl+R` / `Cmd+R`, or Command Palette → **Developer: Reload Window**. Or stop debugging and press **F5** again. |
| **Installed VSIX / from Location** | Re-run `pnpm run package` (or recompile), install the new VSIX again (overwrite), then Command Palette → **Developer: Reload Window**. |
| Quick reload command | `Ctrl+Shift+P` → **Developer: Reload Window** |

You do **not** need to uninstall first; installing the same extension id again updates it. After reload, `Alt+M` should show new presets.

## Usage

1. Select text in the editor (especially Markdown / MDX).
2. Press `Alt+M`, or run **Wrap Selection…** from the palette / context menu.
3. Search and pick a preset (e.g. `Bold`, `Bold + Underline`, `Mark+Bold · circle · warning`).
4. The selection is replaced with the wrapped text (all multi-cursor selections are wrapped).

**Wrap with Mark…** skips the full list and walks type → color → brackets (when type is `bracket`).

If there is no selection, a warning is shown and nothing is changed.

### Combo presets

- **Combo** (markdown / HTML only — not the `<Mark>` component): e.g. `Bold + Underline` → `**<u>text</u>**`, `Bold + Italic`, strikethrough mixes, `<mark>` mixes.
- **Mark+Bold / Mark+Italic / Mark+Underline**: nests markdown or `<u>` *inside* the `<Mark>` component, e.g. `<Mark type="circle" color="warning">**text**</Mark>`. Search `Mark+Bold` or `Mark+Italic`.

The Quick Pick is ordered by **recently used**, then **frequently used**, then the full list (default). Disable with:

```json
{
  "wrapSelection.sortBy": "default"
}
```

### Custom wizards

- **Custom Code Fence…** — prompts for a language tag (empty = plain fence). Outer fence length increases if the selection already contains backticks.
- **Custom Mark…** — prompts for `type`, `color` (named or free-form CSS), and `brackets` when needed.

## Change the `Alt+M` shortcut

1. **File → Preferences → Keyboard Shortcuts** (or `Ctrl+K Ctrl+S`)
2. Search for `Wrap Selection`
3. Rebind `wrapSelection.wrap` to any key chord you prefer

## Add a preset

### In code

Edit `src/presets.ts` and add to the markdown / fence builders (or extend the Mark matrix helpers). Recompile.

### Via settings (no rebuild)

`settings.json`:

```json
{
  "wrapSelection.presets": [
    {
      "label": "Spoiler",
      "detail": "User",
      "wrap": "||{text}||"
    },
    {
      "label": "Callout",
      "wrap": {
        "before": "> ",
        "after": ""
      }
    }
  ]
}
```

`wrap` may be a template string containing `{text}`, or `{ before, after }`.

## Mark output format

Matches the site MDX component:

```xml
<Mark type="circle" color="warning">SELECTED</Mark>
<Mark type="bracket" brackets="right" color="success">SELECTED</Mark>
```

For `brackets: both`:

```xml
<Mark type="bracket" brackets={['left', 'right']} color="success">SELECTED</Mark>
```

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm run compile` | Compile TypeScript → `out/` |
| `pnpm run watch` | Incremental compile |
| `pnpm run package` | Build a `.vsix` with `@vscode/vsce` |

## License

Local / private use.
