# Homebrew Publishing Guide

This project is prepared for Homebrew distribution through a tap repository.

## 1) Create a tap repository

Create a public repo named:

- `homebrew-brewkeeper`

under your GitHub account or org.

## 2) Add formula

Copy `Formula/brewkeeper.rb` from this repository into the tap repo at:

- `Formula/brewkeeper.rb`

## 3) Update formula values

Before each release, update:

- `url`
- `sha256`
- `version` (if specified)

The source archive URL should usually be:

`https://github.com/<OWNER>/<REPO>/archive/refs/tags/vX.Y.Z.tar.gz`

To compute SHA256:

```bash
curl -L -o brewkeeper.tar.gz https://github.com/<OWNER>/<REPO>/archive/refs/tags/vX.Y.Z.tar.gz
shasum -a 256 brewkeeper.tar.gz
```

## 4) Install from tap

```bash
brew tap <OWNER>/brewkeeper
brew install brewkeeper
```

## 5) Upgrade

```bash
brew update
brew upgrade brewkeeper
```

## Notes

- The formula builds from source using Bun.
- `brewkeeper` supports both formula and cask upgrade flows internally.
