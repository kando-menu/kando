# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: MIT

file(GLOB SOURCE_FILES "*.cpp")

find_program(WAYLAND_SCANNER NAMES wayland-scanner)

message(STATUS "Found wayland-scanner: ${WAYLAND_SCANNER}")

add_custom_command(
  OUTPUT fake-input.h fake-input.c
  COMMAND ${WAYLAND_SCANNER} client-header ${CMAKE_CURRENT_SOURCE_DIR}/protocols/fake-input.xml fake-input.h
  COMMAND ${WAYLAND_SCANNER} private-code ${CMAKE_CURRENT_SOURCE_DIR}/protocols/fake-input.xml fake-input.c
  COMMENT "Generating fake-input protocol files")


add_library(NativeKDEWayland SHARED ${SOURCE_FILES} fake-input.c ${CMAKE_JS_SRC})

set_target_properties(NativeKDEWayland PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(NativeKDEWayland ${CMAKE_JS_LIB})
target_include_directories(NativeKDEWayland PRIVATE ${NODE_ADDON_API_DIR} ${CMAKE_JS_INC} ${CMAKE_CURRENT_BINARY_DIR})
