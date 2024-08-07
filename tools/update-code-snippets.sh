#!/bin/bash

# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: CC0-1.0

# This script updates all permalinks to kando source code in the documentation to the
# current commit hash and replaces the line range with the actual number of lines in
# the file.


# Get the directory of this script.
SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd )"

cd "$SCRIPT_DIR/../docs"

# Get the current commit hash
current_hash=$(git rev-parse HEAD)

# Define the regex pattern for matching permalinks with commit hashes and line ranges
# This pattern assumes the commit hash is the part after "/blob/" and before "/"
# and the line range starts with "#L" and can be in the form "#L11" or "#L11-L39"
url_regex='(https:\/\/github\.com\/kando-menu\/kando\/blob\/)[0-9a-f]+(\/[^#]+)(#L[0-9]+(-L[0-9]+)?)'

# Find and replace the old hash and line range with the current hash and actual line count
# in Markdown files.
for file in *.md; do
  if [[ -f "$file" ]]; then
    echo "Processing $file..."
    # Use sed to find all matches of the URL pattern
    matches=$(grep -oE "$url_regex" "$file")
    for match in $matches; do
      # Extract the file path from the match
      file_path=$(echo "$match" | sed -E "s|$url_regex|\2|")
      file_path="../${file_path#/}"  # Remove leading slash and go up one directory

      echo "  Found reference to $file_path"

      # Get the actual number of lines in the file
      line_count=0
      if [ -f "$file_path" ]; then
        line_count=$(wc -l < "$file_path")
      fi

      # Replace the permalink with the updated line count
      new_link=$(echo "$match" | sed -E "s|$url_regex|\1$current_hash\2#L1-L$line_count|")
      sed -i "s|$match|$new_link|g" "$file"
      echo "  Updated $file with $new_link"
    done
  fi
done