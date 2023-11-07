# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: MIT

file(GLOB SOURCE_FILES "*.cpp")

find_program(WAYLAND_SCANNER NAMES wayland-scanner)

message(STATUS "Found wayland-scanner: ${WAYLAND_SCANNER}")

file(GLOB PROTOCOLS "${CMAKE_CURRENT_SOURCE_DIR}/protocols/*.xml")

foreach(PROTOCOL ${PROTOCOLS})
  get_filename_component(BASENAME ${PROTOCOL} NAME_WE)
  add_custom_command(
    OUTPUT ${BASENAME}.h ${BASENAME}.c
    COMMAND ${WAYLAND_SCANNER} client-header ${PROTOCOL} ${BASENAME}.h
    COMMAND ${WAYLAND_SCANNER} private-code ${PROTOCOL} ${BASENAME}.c
    COMMENT "Generating ${BASENAME} protocol files"
  )
  list(APPEND SOURCE_FILES ${BASENAME}.c)
endforeach()

add_library(NativeWLR SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

set_target_properties(NativeWLR PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(NativeWLR ${CMAKE_JS_LIB})
target_include_directories(NativeWLR PRIVATE ${NODE_ADDON_API_DIR} ${CMAKE_JS_INC} ${CMAKE_CURRENT_BINARY_DIR})
