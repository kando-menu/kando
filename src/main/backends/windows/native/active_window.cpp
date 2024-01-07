//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-FileCopyrightText: Yves Hoppe <contact@bytee.net>
// SPDX-License-Identifier: MIT

#include "active_window.hpp"

#include <windows.h>

#include <stringapiset.h>

#include <codecvt>
#include <string>

// This is based on https://github.com/yvesh/active-windows

namespace active_window {

void getActiveWindow(Napi::Object& obj) {
  WCHAR window_title[256];
  HWND  foreground_window = GetForegroundWindow();
  GetWindowTextW(foreground_window, window_title, 256);

  DWORD pid;
  GetWindowThreadProcessId(foreground_window, &pid);

  TCHAR process_filename[MAX_PATH];
  DWORD charsCarried = MAX_PATH;

  HANDLE hProc = OpenProcess(
      PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_QUERY_INFORMATION, false, pid);

  QueryFullProcessImageNameA(hProc, 0, process_filename, &charsCarried);

  std::string fullpath = process_filename;

  const size_t last_slash_idx = fullpath.find_last_of("\\/");

  if (std::string::npos != last_slash_idx) {
    fullpath.erase(0, last_slash_idx + 1);
  }

  std::wstring                                     ws(window_title);
  std::wstring_convert<std::codecvt_utf8<wchar_t>> myconv;

  obj.Set("app", fullpath);
  obj.Set("name", myconv.to_bytes(ws));
}

Napi::Object getActiveWindowWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::Object obj = Napi::Object::New(env);
  getActiveWindow(obj);

  return obj;
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("getActiveWindow", Napi::Function::New(env, getActiveWindowWrapped));
}

} // namespace active_window