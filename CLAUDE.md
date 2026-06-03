# Claude Code Setup

## Environment

- **Node.js**: v24.16.0 (`/usr/local/bin/node`)
- **npm**: v11.13.0 (global installs require `sudo`)
- **Homebrew**: `/usr/local/bin/brew`

## Installed Skills

Located in `~/.claude/skills/`:

- **frontend-design** — from `anthropics/skills`. Creates distinctive, production-grade frontend interfaces. Avoids generic AI aesthetics. Invoke with `/frontend-design`.
- **ui-ux-pro-max** — installed via `npm install -g uipro-cli` + `uipro init --ai claude`. Provides 67 UI styles, 161 color palettes, 57 font pairings, and 99 UX guidelines.

## Notes

- Global npm installs need `sudo npm install -g <package>`
- Terminal paste issues with `--` flags: type manually or paste via TextEdit first
- Homebrew failed to compile `llvm` (missing patch file on this macOS/Xcode version); Node was installed via the official `.pkg` from nodejs.org instead
