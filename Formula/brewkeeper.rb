class Brewkeeper < Formula
  desc "Clean terminal UI for safer Homebrew upgrades"
  homepage "https://github.com/Pallepadehat/brewkeeper"
  version "0.1.0"
  license "MIT"

  on_macos do
    url "https://github.com/Pallepadehat/brewkeeper/releases/download/v0.1.0/brewkeeper-darwin-arm64.tar.gz"
    sha256 "<REPLACE_DARWIN_SHA256>"
  end

  on_linux do
    url "https://github.com/Pallepadehat/brewkeeper/releases/download/v0.1.0/brewkeeper-linux-x64.tar.gz"
    sha256 "<REPLACE_LINUX_SHA256>"
  end

  def install
    bin.install "brewkeeper"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/brewkeeper --version")
  end
end
