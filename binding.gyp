{
  "targets": [
    {
      "target_name": "native",
      'conditions': [
         ['OS=="linux"', {
           'sources': ["src/backend/x11/native/main.cpp", "src/backend/x11/native/active_window.cpp"],
           'libraries': [
               "-lX11",
               "-lXss",
               "-lxcb"
             ],
             'cflags': ["-lX11 -lXext -lXss"],
             'cflags_cc': ["-lX11 -lXext -lXss"],
           }
         ],
         ['OS=="win"', {
           'sources': ["src/backend/win32/native/main.cpp", "src/backend/win32/native/active_window.cpp"]
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