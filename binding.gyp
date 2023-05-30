# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: CC0-1.0

{
  "targets": [
    {
      "target_name": "native",
      'conditions': [
         ['OS=="linux"', {
           'sources': ["src/backend/x11/native/main.cpp", "src/backend/x11/native/active_window.cpp"],
           'libraries': [
               "-lX11"
             ]
           }
         ],
         ['OS=="win"', {
           'sources': [
                "src/backend/win32/native/main.cpp",
                "src/backend/win32/native/active_window.cpp",
                "src/backend/win32/native/move_pointer.cpp"
              ]
            }
         ],
      ],
      'include_dirs': [
           "<!@(node -p \"require('node-addon-api').include\")"
       ],
      'dependencies': [
         "<!(node -p \"require('node-addon-api').gyp\")"
       ],
       'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    },
  ],
}