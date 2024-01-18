# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: MIT

file(GLOB SOURCE_FILES "*.mm")

enable_language(OBJCXX)

add_library(NativeMacOS SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

set_target_properties(NativeMacOS PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(NativeMacOS ${CMAKE_JS_LIB})
target_include_directories(NativeMacOS PRIVATE ${NODE_ADDON_API_DIR} ${CMAKE_JS_INC} ${CMAKE_CURRENT_BINARY_DIR})
