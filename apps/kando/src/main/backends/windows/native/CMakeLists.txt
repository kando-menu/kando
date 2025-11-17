# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: MIT

file(GLOB SOURCE_FILES "*.cpp")

add_library(NativeWin32 SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

set_target_properties(NativeWin32 PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(NativeWin32 ${CMAKE_JS_LIB} dwmapi)
target_include_directories(NativeWin32 PRIVATE ${NODE_ADDON_API_DIR} ${CMAKE_JS_INC})
