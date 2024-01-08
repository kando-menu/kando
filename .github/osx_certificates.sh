#!/usr/bin/env sh

# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: CC0-1.0

# This script is used to import the codesigning certificate and key into the
# macOS keychain. It is used by the GitHub Action workflows. It is based on
# the following article:
# https://dev.to/rwwagner90/signing-electron-apps-with-github-actions-4cof

KEY_CHAIN=build.keychain
CERTIFICATE_P12=certificate.p12

# Recreate the certificate from the secure environment variable.
echo $OSX_CERTIFICATE | base64 --decode > $CERTIFICATE_P12

# Create a keychain.
security create-keychain -p actions $KEY_CHAIN

# Make the keychain the default so identities are found.
security default-keychain -s $KEY_CHAIN

# Unlock the keychain.
security unlock-keychain -p actions $KEY_CHAIN

security import $CERTIFICATE_P12 -k $KEY_CHAIN -P $OSX_CERTIFICATE_PASSWORD -T /usr/bin/codesign;

security set-key-partition-list -S apple-tool:,apple: -s -k actions $KEY_CHAIN

# Remove certs.
rm -fr *.p12