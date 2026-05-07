# Ignore Highlighter

A VS Code extension that highlights files in the explorer based on the currently focused ignore file.

## Features

- **Context-Aware Highlighting**: When you open and focus an ignore file (e.g., `.gitignore`, `.claudeignore`, `.dockerignore`), the extension automatically identifies and marks the files that are ignored by that specific configuration.
- **Accurate Parsing**: Uses the same logic as `.gitignore` to ensure consistency with your build tools and workflows.
- **Visual Feedback**: Ignored files are marked with a distinct badge (`∅`) and a dimmed color in the file explorer.
- **Automatic Updates**: Highlighting updates in real-time as you modify the ignore file.

## Usage

1. Open any file ending in `ignore` (e.g., `.gitignore`).
2. Focus the editor on that file.
3. Observe the file explorer: ignored files will be highlighted.
4. When you switch to a different ignore file, the highlighting updates to reflect the new context.
5. If you focus on a non-ignore file, the highlighting is cleared.

## Customization

You can customize the color of the ignored files in your `settings.json`:

```json
"workbench.colorCustomizations": {
    "ignoreHighlighter.ignoredFileForeground": "#ff000080"
}
```

## Requirements

- VS Code 1.85.0 or later.
- Cursor 0.20 or later.
- Antigravity 1.0.0 or later.

# License

This extension is licensed under the MIT License.