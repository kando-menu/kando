# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: MIT

cmake_minimum_required(VERSION 3.9)
cmake_policy(SET CMP0042 NEW)

# Kando uses CMake.js to build the native modules. This file is only used to
# build the native modules. See the README.md for more information.
project(kando-native)

add_definitions(-DNAPI_VERSION=6)
set(CMAKE_CXX_STANDARD 17)

# Include Node-API wrappers.
execute_process(COMMAND node -p "require('node-addon-api').include"
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  OUTPUT_VARIABLE NODE_ADDON_API_DIR
)
string(REGEX REPLACE "[\r\n\"]" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})

# Build platform specific backends.
if (WIN32)
  add_subdirectory(src/main/backends/windows/native)
endif ()

if (APPLE)
  add_subdirectory(src/main/backends/macos/native)
endif ()

if (UNIX AND NOT APPLE)
  add_subdirectory(src/main/backends/linux/wlroots/native)
  add_subdirectory(src/main/backends/linux/x11/native)
endif ()
