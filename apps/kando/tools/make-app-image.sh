#!/bin/sh

# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: CC0-1.0

# This script assumes that you have bundled Kando with `npm run package` before. It will
# create a temporary build/kando.AppDir and copy the necessary files into it. Then it will
# download the appimagetool and create an AppImage in out/make/appimage.

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


INPUT_DIR="$SCRIPT_DIR/../out/Kando-linux-$ARCH_SHORT"
BUILD_DIR="$SCRIPT_DIR/../build/kando.AppDir"
OUTPUT_DIR="$SCRIPT_DIR/../out/make/appimage"

# Make sure that the input directory exists.
if [ ! -d "$INPUT_DIR" ]; then
  echo "Input directory $INPUT_DIR does not exist! Run 'npm run package' first."
  exit 1
fi

echo "Building AppImage for $ARCH..."

# Clean the build directory.
mkdir -p "$OUTPUT_DIR"
if [ -d "$BUILD_DIR" ]; then
  rm -r "$BUILD_DIR"
fi
mkdir -p "$BUILD_DIR" && cd "$BUILD_DIR"

VERSION=$(grep '"version":' ../../package.json | awk -F '"' '{print $4}')
echo "Creating AppImage for Kando $VERSION on $ARCH..."

# Copy desktop file, icon, and all the other stuff.
cp -a "$INPUT_DIR"/* .
mkdir -p usr/share/metainfo
mkdir -p usr/share/applications
cp "$SCRIPT_DIR/../appstream/menu.kando.Kando.desktop" usr/share/applications/
ln -s usr/share/applications/menu.kando.Kando.desktop ./menu.kando.Kando.desktop
cp "$SCRIPT_DIR/../assets/icons/icon.svg" ./menu.kando.Kando.svg
cp "$SCRIPT_DIR/../assets/icons/icon.png" ./menu.kando.Kando.png

# Create the AppRun file.
# --no-sandbox is required as workaround for https://github.com/electron/electron/issues/17972
cat >> ./AppRun << 'EOF'
#!/bin/sh
CURRENTDIR="$(readlink -f "$(dirname "$0")")"
exec "$CURRENTDIR"/kando --no-sandbox "$@"
EOF
chmod a+x ./AppRun

# Get the appimagetool.
cd ..
APPIMAGETOOL=$(wget -q https://api.github.com/repos/probonopd/go-appimage/releases -O - | sed 's/[()",{} ]/\n/g' | grep -oi "https.*continuous.*tool.*$ARCH.*mage$")
echo "Downloading appimagetool from $APPIMAGETOOL..."
wget -q "$APPIMAGETOOL" -O ./appimagetool
chmod a+x ./appimagetool

# Do the thing!
export ARCH
export VERSION
./appimagetool -s "$BUILD_DIR"

# Move the AppImage to the output directory.
mv "Kando-$VERSION-$ARCH.AppImage" "$OUTPUT_DIR"

echo "All Done!"