# Release Checklist (v0.2.0)

## 1) Preflight

```bash
bun install
bun run typecheck
bun run build
```

## 2) Commit Release Changes

```bash
git add CHANGELOG.md README.md package.json Formula/brewkeeper.rb src
git commit -m "release: prepare v0.2.0"
```

## 3) Create And Push Tag

```bash
git tag -a v0.2.0 -m "brewkeeper v0.2.0"
git push origin HEAD
git push origin v0.2.0
```

## 4) Publish GitHub Release

Create a GitHub release for tag `v0.2.0` and upload:
- `brewkeeper-darwin-arm64.tar.gz`
- `brewkeeper-linux-x64.tar.gz`

If you use GitHub CLI:

```bash
gh release create v0.2.0 \
  --title "brewkeeper v0.2.0" \
  --notes-file CHANGELOG.md
```

## 5) Compute SHA256 For Formula

After assets are uploaded, compute checksums from downloaded artifacts:

```bash
shasum -a 256 brewkeeper-darwin-arm64.tar.gz
shasum -a 256 brewkeeper-linux-x64.tar.gz
```

## 6) Update Formula SHA Placeholders

Edit `Formula/brewkeeper.rb`:
- Replace `<REPLACE_DARWIN_SHA256>`
- Replace `<REPLACE_LINUX_SHA256>`

Then commit and push:

```bash
git add Formula/brewkeeper.rb
git commit -m "chore(formula): add v0.2.0 checksums"
git push origin HEAD
```

## 7) Smoke Test

```bash
./dist/brewkeeper --version
```

Expected output:

```text
0.2.0
```
