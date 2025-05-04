//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "Native.hpp"

#include <windows.h>
#include <winuser.h>
#include <stringapiset.h>
#include <dwmapi.h>

#include <codecvt>
#include <string>

//////////////////////////////////////////////////////////////////////////////////////////

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(exports, {
                           InstanceMethod("movePointer", &Native::movePointer),
                           InstanceMethod("simulateKey", &Native::simulateKey),
                           InstanceMethod("getActiveWindow", &Native::getActiveWindow),
                           InstanceMethod("fixAcrylicEffect", &Native::fixAcrylicEffect),
                       });
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::movePointer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
  }

  int dx = info[0].As<Napi::Number>().Int32Value();
  int dy = info[1].As<Napi::Number>().Int32Value();

  POINT p;
  GetCursorPos(&p);
  SetCursorPos(dx + p.x, dy + p.y);
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::simulateKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Number and Boolean expected").ThrowAsJavaScriptException();
  }

  int  code = info[0].As<Napi::Number>().Int32Value();
  bool down = info[1].As<Napi::Boolean>().Value();

  INPUT input{};
  input.type       = INPUT_KEYBOARD;
  input.ki.dwFlags = (down ? 0 : KEYEVENTF_KEYUP) | KEYEVENTF_SCANCODE;
  input.ki.wScan   = code;

  if (code > 255) {
    input.ki.dwFlags |= KEYEVENTF_EXTENDEDKEY;
  }

  UINT uSent = SendInput(1, &input, sizeof(INPUT));
  if (uSent != 1) {
    Napi::TypeError::New(env, "Failed to simulate keys!").ThrowAsJavaScriptException();
  }
}

//////////////////////////////////////////////////////////////////////////////////////////

// This is based on https://github.com/yvesh/active-windows

Napi::Value Native::getActiveWindow(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Object obj = Napi::Object::New(env);

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

  return obj;
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::fixAcrylicEffect(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
  }

  HWND hwnd = (HWND)info[0].As<Napi::Number>().Int64Value();

  DWM_BLURBEHIND bb = {0};
  bb.dwFlags = DWM_BB_ENABLE;
  bb.fEnable = TRUE;
  bb.hRgnBlur = NULL;
  DwmEnableBlurBehindWindow(hwnd, &bb);

  // DWMWCP_ROUND = 2 and DWMWA_WINDOW_CORNER_PREFERENCE = 33 are not always defined.
  unsigned p = 2;
  DwmSetWindowAttribute(hwnd, 33, &p, sizeof(p));
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////
