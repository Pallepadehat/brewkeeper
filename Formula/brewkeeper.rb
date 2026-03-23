class Brewkeeper < Formula
  desc "Clean terminal UI for safer Homebrew upgrades"
  homepage "https://github.com/Pallepadehat/brewkeeper"
  version "0.2.0"
  license "MIT"

  on_macos do
    url "https://github.com/Pallepadehat/brewkeeper/releases/download/v0.2.0/brewkeeper-darwin-arm64.tar.gz"
    sha256 "b24beac5cf81d60978fc270571eaa3831091e383e51cda586fe23cbdf17b93d5"
  end

  on_linux do
    url "https://github.com/Pallepadehat/brewkeeper/releases/download/v0.2.0/brewkeeper-linux-x64.tar.gz"
    sha256 "e663a1073bf023db12e05d1d671e288888726e6de82e74a51f0478cc2f243a4e"
  end

  def install
    bin.install "brewkeeper"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/brewkeeper --version")
  end
end
