# Changelog

All notable changes to this project will be documented in this file.

## v0.2.2 - 2026-03-23

### Added
- Snapshot delete flow in snapshot list (`d`) with confirmation dialog.
- Centered progress overlay that shows live action status during update/install/upgrade/snapshot operations.

### Changed
- Snapshot list dialog widened so helper text fits on one line.
- Snapshot create dialog copy simplified to only essential text.
- Removed snapshot delete hint from footer for a cleaner bottom bar.

### Fixed
- Submit handling now accepts both `enter` and `return` in modal flows.

## v0.2.1 - 2026-03-23

### Changed
- Removed the duplicate snapshot-list shortcut mapping to reduce UX confusion.
- Snapshot list is now opened via `v` only.

### Fixed
- Updated keyboard help and README shortcut table to match the real keybindings.

## v0.2.0 - 2026-03-23

### Added
- Homebrew repository search with inline package preview.
- Install flow directly from search results with confirmation.
- Named snapshots: create a snapshot with a custom name before risky upgrades.
- Snapshot list flow: open list and rollback to a selected snapshot.

### Changed
- Premium UI refresh across header, package list, search modal, filter/help styling, and keyboard hints.
- Snapshot shortcuts updated:
  - `b` opens named snapshot creation.
  - `v` opens snapshot list.
  - `Shift+R` opens snapshot list for rollback.

### Removed
- Quick filter flow and all filter-specific UI/help references.
- Profile-switching UI flow from the main interaction model.
