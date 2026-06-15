#!/usr/bin/env bash
set -euo pipefail

# Install uv if not present
if ! command -v uv &>/dev/null; then
  echo "Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  # Add uv to PATH for the rest of this script
  export PATH="$HOME/.local/bin:$PATH"
fi

# Install graphify (package name: graphifyy, command: graphify)
echo "Installing graphify..."
uv tool install graphifyy

echo "Developer tools installed."
