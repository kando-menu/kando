#!/bin/sh

# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: CC0-1.0

# The flatpak version of Kando is maintained and built from this repository:
# https://github.com/flathub/menu.kando.Kando

# This script here is only used during development to create a flatpak bundle for testing
# purposes. It will create a flatpak bundle in out/make/flatpak. It assumes that you have
# bundled Kando with `npm run package` and created the app image with
# `tools/make-app-image.sh` before. It creates a temporary build/flatpak directory and
# uses the above mentioned repository to create the flatpak bundle.

# Exit on errors.
set -e
set -u

# Get the directory of this script.
SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd )"

# Get the architecture.
ARCH="$(uname -m)"
if [ $ARCH = "x86_64" ]; then
  ARCH_SHORT=x64
elif [ $ARCH = "aarch64" ]; then
  ARCH_SHORT=arm64
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

VERSION=$(grep '"version":' ${SCRIPT_DIR}/../package.json | awk -F '"' '{print $4}')
echo "Creating AppImage for Kando $VERSION on $ARCH..."

INPUT="$SCRIPT_DIR/../out/make/appimage/Kando-$VERSION-$ARCH.AppImage"
BUILD_DIR="$SCRIPT_DIR/../build/flatpak"
OUTPUT_DIR="$SCRIPT_DIR/../out/make/flatpak"

# Make sure that the input directory exists.
if [ ! -f "$INPUT" ]; then
  echo "Input $INPUT does not exist! Run 'tools/make-app-image.sh' first."
  exit 1
fi

echo "Building Flatpak for $ARCH..."

# Clean the build directory.
mkdir -p "$OUTPUT_DIR"
if [ -d "$BUILD_DIR" ]; then
  rm -rf "$BUILD_DIR"
fi
mkdir -p "$BUILD_DIR" && cd "$BUILD_DIR"

# Clone the flatpak repository.
cd "$BUILD_DIR"
git clone https://github.com/flathub/menu.kando.Kando.git
cd menu.kando.Kando

# Copy the AppImage and the metainfo into the flatpak directory.
cp "$SCRIPT_DIR/../appstream/menu.kando.Kando.metainfo.xml" .
cp "$INPUT" "kando.AppImage"

# Replace AppImage url/sha256 with the file path.
sed -i '/url: .*\.AppImage$/{
    s|url: .*\.AppImage|path: kando.AppImage|
    n
    /sha256:/d
}' menu.kando.Kando.yml

# Replace metainfo url/sha256 with the file path.
sed -i '/url: .*\.metainfo\.xml$/{
    s|url: .*\.metainfo\.xml|path: menu.kando.Kando.metainfo.xml|
    n
    /sha256:/d
}' menu.kando.Kando.yml

cd ..

# Create the flatpak build.
flatpak-builder build/ menu.kando.Kando/menu.kando.Kando.yml --force-clean --install-deps-from=flathub

# Export the flatpak bundle.
flatpak build-export export build
flatpak build-bundle export "${OUTPUT_DIR}/Kando-$VERSION-$ARCH.flatpak" menu.kando.Kando --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo

echo "All Done!"