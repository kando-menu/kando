# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: MIT

file(GLOB SOURCE_FILES "*.cpp")

add_library(NativeX11 SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

set_target_properties(NativeX11 PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(NativeX11 ${CMAKE_JS_LIB} Xtst)
target_include_directories(NativeX11 PRIVATE ${NODE_ADDON_API_DIR} ${CMAKE_JS_INC})
