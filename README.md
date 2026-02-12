# brewkeeper

`brewkeeper` is a polished terminal UI for Homebrew upgrades, focused on safer decisions and fast review.

It highlights:
- major/minor/patch upgrade type
- dependency impact (`brew uses`)
- risk signals and caveats
- formula + cask support
- safe-upgrades-only mode
- profile + snapshot/rollback support (Brewfile-based)

## Quick Start (Local)

```bash
bun install
bun dev
```

## Homebrew Install (Tap)

Set up a tap repository (recommended name: `homebrew-brewkeeper`) and copy `Formula/brewkeeper.rb` from this repo into that tap.

Then users can install with:

```bash
brew tap <OWNER>/brewkeeper
brew install brewkeeper
```

Detailed release + formula publishing steps are documented in `HOMEBREW.md`.

## Build

```bash
bun run typecheck
bun run build
```

This produces a standalone binary at `dist/brewkeeper`.

## Development

- Runtime: Bun
- UI framework: OpenTUI + React
- TypeScript strict mode enabled

## Contributing

Contributions are welcome. Please read:
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`

## License

MIT - see `LICENSE`.
