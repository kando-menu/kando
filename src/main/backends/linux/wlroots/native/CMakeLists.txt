# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: MIT

file(GLOB SOURCE_FILES "*.cpp")

find_program(WAYLAND_SCANNER NAMES wayland-scanner)

message(STATUS "Found wayland-scanner: ${WAYLAND_SCANNER}")

add_custom_command(
  OUTPUT virtual-keyboard-unstable-v1.h virtual-keyboard-unstable-v1.c
  COMMAND ${WAYLAND_SCANNER} client-header ${CMAKE_CURRENT_SOURCE_DIR}/protocols/virtual-keyboard-unstable-v1.xml virtual-keyboard-unstable-v1.h
  COMMAND ${WAYLAND_SCANNER} private-code ${CMAKE_CURRENT_SOURCE_DIR}/protocols/virtual-keyboard-unstable-v1.xml virtual-keyboard-unstable-v1.c
  COMMENT "Generating virtual-keyboard-unstable-v1 protocol files")

add_library(NativeWLR SHARED ${SOURCE_FILES} virtual-keyboard-unstable-v1.c ${CMAKE_JS_SRC})

set_target_properties(NativeWLR PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(NativeWLR ${CMAKE_JS_LIB})
target_include_directories(NativeWLR PRIVATE ${NODE_ADDON_API_DIR} ${CMAKE_JS_INC} ${CMAKE_CURRENT_BINARY_DIR})
