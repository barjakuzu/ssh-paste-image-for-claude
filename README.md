# SSH Paste Image for Claude

Paste clipboard images into **Claude Code** (or any CLI) running over SSH.

If you develop on a remote server and use Claude Code via SSH, you've hit this problem: you can't paste images into the CLI because your clipboard is local but Claude Code is running remotely. This extension bridges the gap.

**Cmd+Shift+V** in a terminal → image uploads to the remote server → path is inserted into the terminal.

Works with **VS Code**, **Antigravity**, and any VS Code fork with SSH remote support.

![SSH Paste Image for Claude](icon.png)

## Demo

1. Copy a screenshot or image to your clipboard
2. Focus the terminal in your SSH remote session
3. Press **Cmd+Shift+V**
4. The image is uploaded and the absolute path (e.g. `/home/user/.cp-images/paste-1772611488111.png`) is inserted into the terminal and copied to your clipboard

Claude Code can then read the image file and use it as context.

## Requirements

- **macOS** (uses `pngpaste` for clipboard access)
- **pngpaste**: install with `brew install pngpaste`
- An active **SSH remote connection** in VS Code or Antigravity
- SSH keys configured (uses your existing SSH config — same keys as your editor)

## Installation

### From Marketplace

Search for **"SSH Paste Image for Claude"** in the Extensions panel.

### From .vsix

```sh
# VS Code
code --install-extension ssh-paste-image-for-claude-0.1.0.vsix

# Antigravity
antigravity --install-extension ssh-paste-image-for-claude-0.1.0.vsix
```

### From source

```sh
git clone https://github.com/barjakuzu/ssh-paste-image-for-claude.git
cd ssh-paste-image-for-claude
npm install
npm run compile
npm run package
```

## Keybinding

| Shortcut | Action | When |
|---|---|---|
| `Cmd+Shift+V` | Paste image to SSH terminal | Terminal is focused |

## How it works

1. Saves the clipboard image to a local temp file using `pngpaste`
2. Resolves the SSH host from the workspace remote connection
3. Creates `~/.cp-images/` on the remote server via `ssh mkdir -p`
4. Uploads the image via `scp`
5. Inserts the absolute path into the active terminal
6. Copies the path to your clipboard
7. Cleans up the local temp file

## Limitations

- macOS only (clipboard access depends on `pngpaste`)
- PNG format only
- Inserts the file path, not an inline image (VS Code terminal limitation)

## License

MIT
