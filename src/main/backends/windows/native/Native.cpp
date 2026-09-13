//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "Native.hpp"

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

#include <dwmapi.h>
#include <propkey.h>
#include <shlobj.h>
#include <shobjidl.h>
#include <windows.h>

#include <sstream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

//////////////////////////////////////////////////////////////////////////////////////////

namespace {

struct CapturedKeyEvent {
  uint32_t scanCode;
  bool     down;
};

constexpr uint32_t kNativeModifierControl = 1U << 0;
constexpr uint32_t kNativeModifierShift   = 1U << 1;
constexpr uint32_t kNativeModifierAlt     = 1U << 2;
constexpr uint32_t kNativeModifierMeta    = 1U << 3;

uint32_t nativeModifierMask(const std::unordered_set<uint32_t>& pressedKeys) {
  uint32_t mask = 0;
  if (pressedKeys.count(0x001d) > 0 || pressedKeys.count(0xe01d) > 0) {
    mask |= kNativeModifierControl;
  }
  if (pressedKeys.count(0x002a) > 0 || pressedKeys.count(0x0036) > 0) {
    mask |= kNativeModifierShift;
  }
  if (pressedKeys.count(0x0038) > 0 || pressedKeys.count(0xe038) > 0) {
    mask |= kNativeModifierAlt;
  }
  if (pressedKeys.count(0xe05b) > 0 || pressedKeys.count(0xe05c) > 0) {
    mask |= kNativeModifierMeta;
  }
  return mask;
}

static std::string base64Encode(const unsigned char* data, size_t len) {
  static const char table[] =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  std::string encoded;
  encoded.reserve(((len + 2) / 3) * 4);

  for (size_t i = 0; i < len; i += 3) {
    unsigned int val = (data[i] << 16) | ((i + 1 < len) ? (data[i + 1] << 8) : 0) |
                       ((i + 2 < len) ? data[i + 2] : 0);
    encoded.push_back(table[(val >> 18) & 0x3F]);
    encoded.push_back(table[(val >> 12) & 0x3F]);
    encoded.push_back((i + 1 < len) ? table[(val >> 6) & 0x3F] : '=');
    encoded.push_back((i + 2 < len) ? table[val & 0x3F] : '=');
  }

  return encoded;
}

// Write PNG into std::vector<unsigned char> instead of file.
static void pngWriteCallback(void* context, void* data, int size) {
  auto*                buffer = reinterpret_cast<std::vector<unsigned char>*>(context);
  const unsigned char* bytes  = reinterpret_cast<unsigned char*>(data);
  buffer->insert(buffer->end(), bytes, bytes + size);
}

// Converts a Windows HBITMAP to a Base64-encoded PNG.
std::string HBitmapToBase64PNG(HBITMAP hBitmap) {
  if (!hBitmap)
    throw std::invalid_argument("Invalid HBITMAP");

  BITMAP bmp;
  if (GetObject(hBitmap, sizeof(bmp), &bmp) == 0) {
    throw std::runtime_error("GetObject failed for HBITMAP");
  }

  BITMAPINFO bi{};
  bi.bmiHeader.biSize        = sizeof(BITMAPINFOHEADER);
  bi.bmiHeader.biWidth       = bmp.bmWidth;
  bi.bmiHeader.biHeight      = -bmp.bmHeight; // negative for top-down
  bi.bmiHeader.biPlanes      = 1;
  bi.bmiHeader.biBitCount    = 32; // force RGBA
  bi.bmiHeader.biCompression = BI_RGB;

  HDC hdc = GetDC(nullptr);
  if (!hdc)
    throw std::runtime_error("GetDC failed");

  std::vector<unsigned char> pixels(bmp.bmWidth * bmp.bmHeight * 4);
  if (GetDIBits(hdc, hBitmap, 0, bmp.bmHeight, pixels.data(), &bi, DIB_RGB_COLORS) == 0) {
    ReleaseDC(nullptr, hdc);
    throw std::runtime_error("GetDIBits failed");
  }
  ReleaseDC(nullptr, hdc);

  // Convert BGRA to RGBA.
  for (size_t i = 0; i < pixels.size(); i += 4) {
    std::swap(pixels[i], pixels[i + 2]);
  }

  // Encode to PNG in memory.
  std::vector<unsigned char> pngData;
  if (!stbi_write_png_to_func(pngWriteCallback, &pngData, bmp.bmWidth, bmp.bmHeight, 4,
          pixels.data(), bmp.bmWidth * 4)) {
    throw std::runtime_error("stbi_write_png_to_func failed");
  }

  return "data:image/png;base64," + base64Encode(pngData.data(), pngData.size());
}

// Converts a wide string (std::wstring) to a UTF-8 encoded string (std::string)
std::string WStringToString(const std::wstring& wstr) {
  if (wstr.empty()) {
    return "";
  }

  int sizeNeeded =
      WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), -1, nullptr, 0, nullptr, nullptr);
  if (sizeNeeded <= 0) {
    return "";
  }

  std::string str(sizeNeeded - 1, '\0');
  WideCharToMultiByte(
      CP_UTF8, 0, wstr.c_str(), -1, &str[0], sizeNeeded, nullptr, nullptr);

  return str;
}

bool getWindowAppAndName(HWND hwnd, std::string& appName, std::string& windowName) {
  if (!hwnd || !IsWindowVisible(hwnd) || GetWindow(hwnd, GW_OWNER) != nullptr) {
    return false;
  }

  int titleLength = GetWindowTextLengthW(hwnd);
  if (titleLength <= 0) {
    return false;
  }

  std::wstring windowTitle(titleLength + 1, L'\0');
  GetWindowTextW(hwnd, &windowTitle[0], titleLength + 1);
  windowTitle.resize(titleLength);

  windowName = WStringToString(windowTitle);
  if (windowName.empty()) {
    return false;
  }

  DWORD pid = 0;
  GetWindowThreadProcessId(hwnd, &pid);
  if (pid == 0) {
    return false;
  }

  CHAR  processFilename[MAX_PATH] = {};
  DWORD charsCarried              = MAX_PATH;

  HANDLE hProc = OpenProcess(
      PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_QUERY_INFORMATION, false, pid);
  if (!hProc) {
    return false;
  }

  BOOL result = QueryFullProcessImageNameA(hProc, 0, processFilename, &charsCarried);
  CloseHandle(hProc);

  if (!result || charsCarried == 0) {
    return false;
  }

  appName                   = processFilename;
  const size_t lastSlashIdx = appName.find_last_of("\\/");

  if (lastSlashIdx != std::string::npos) {
    appName.erase(0, lastSlashIdx + 1);
  }

  return !appName.empty();
}

struct WindowListContext {
  std::vector<std::pair<std::string, std::string>> windows;
};

BOOL CALLBACK enumerateWindowsForList(HWND hwnd, LPARAM lParam) {
  auto* context = reinterpret_cast<WindowListContext*>(lParam);
  if (!context) {
    return FALSE;
  }

  std::string appName;
  std::string windowName;
  if (getWindowAppAndName(hwnd, appName, windowName)) {
    context->windows.emplace_back(appName, windowName);
  }

  return TRUE;
}

struct FocusWindowContext {
  std::string targetWindowName;
  std::string targetAppName;
  HWND        targetWindow = nullptr;
};

BOOL CALLBACK enumerateWindowsForFocus(HWND hwnd, LPARAM lParam) {
  auto* context = reinterpret_cast<FocusWindowContext*>(lParam);
  if (!context) {
    return FALSE;
  }

  std::string appName;
  std::string windowName;
  if (!getWindowAppAndName(hwnd, appName, windowName)) {
    return TRUE;
  }

  if (context->targetWindowName == windowName && context->targetAppName == appName) {
    context->targetWindow = hwnd;
    return FALSE;
  }

  return TRUE;
}
} // namespace

Native* Native::sInstance = nullptr;

//////////////////////////////////////////////////////////////////////////////////////////

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(exports,
      {
          InstanceMethod("movePointer", &Native::movePointer),
          InstanceMethod("simulateKey", &Native::simulateKey),
          InstanceMethod("isModifierPressed", &Native::isModifierPressed),
          InstanceMethod("startKeyboardCapture", &Native::startKeyboardCapture),
          InstanceMethod("stopKeyboardCapture", &Native::stopKeyboardCapture),
          InstanceMethod("bindSystemShortcuts", &Native::bindSystemShortcuts),
          InstanceMethod("getWMInfo", &Native::getWMInfo),
          InstanceMethod("getOpenWindows", &Native::getOpenWindows),
          InstanceMethod("focusWindow", &Native::focusWindow),
          InstanceMethod("fixAcrylicEffect", &Native::fixAcrylicEffect),
          InstanceMethod("listInstalledApplications", &Native::listInstalledApplications),
      });

  sInstance = this;

  HMODULE module = nullptr;
  GetModuleHandleExW(
      GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS | GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
      reinterpret_cast<LPCWSTR>(&sInstance), &module);
  mKeyboardHook =
      SetWindowsHookExW(WH_KEYBOARD_LL, &Native::keyboardHookCallback, module, 0);
}

//////////////////////////////////////////////////////////////////////////////////////////

Native::~Native() {
  if (mKeyboardCaptureEnabled.exchange(false)) {
    mKeyboardCaptureCallback.Release();
  }

  if (mSystemShortcutCallbackEnabled.exchange(false)) {
    mSystemShortcutCallback.Release();
  }

  if (mKeyboardHook) {
    UnhookWindowsHookEx(mKeyboardHook);
    mKeyboardHook = nullptr;
  }

  if (sInstance == this) {
    sInstance = nullptr;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////

LRESULT CALLBACK Native::keyboardHookCallback(int code, WPARAM message, LPARAM data) {
  Native* native = sInstance;
  if (code < 0 || !native) {
    return CallNextHookEx(nullptr, code, message, data);
  }

  const bool down = message == WM_KEYDOWN || message == WM_SYSKEYDOWN;
  const bool up   = message == WM_KEYUP || message == WM_SYSKEYUP;
  if (!down && !up) {
    return CallNextHookEx(nullptr, code, message, data);
  }

  const auto* event = reinterpret_cast<KBDLLHOOKSTRUCT*>(data);
  uint32_t scanCode = event->scanCode;
  if ((event->flags & LLKHF_EXTENDED) != 0) {
    scanCode |= 0xe000;
  }

  const bool captureEnabled = native->mKeyboardCaptureEnabled.load();
  bool       suppressRelease = false;

  {
    std::lock_guard<std::mutex> lock(native->mSuppressedKeysMutex);
    const bool wasPressed = native->mPressedKeys.count(scanCode) > 0;
    if (down) {
      native->mPressedKeys.insert(scanCode);
    }

    if (captureEnabled) {
      if (down) {
        native->mSuppressedKeys.insert(scanCode);
      } else {
        native->mSuppressedKeys.erase(scanCode);
      }
    } else if (up) {
      suppressRelease = native->mSuppressedKeys.erase(scanCode) > 0;
    }

    if (captureEnabled) {
      auto* capturedEvent = new CapturedKeyEvent{scanCode, down};
      const napi_status status = native->mKeyboardCaptureCallback.NonBlockingCall(
          capturedEvent,
          [](Napi::Env env, Napi::Function callback, CapturedKeyEvent* capturedEvent) {
            callback.Call({Napi::Number::New(env, capturedEvent->scanCode),
                Napi::Boolean::New(env, capturedEvent->down)});
            delete capturedEvent;
          });

      if (status != napi_ok) {
        delete capturedEvent;
      }

      if (up) {
        native->mPressedKeys.erase(scanCode);
      }
      return 1;
    }

    if (suppressRelease) {
      if (up) {
        native->mPressedKeys.erase(scanCode);
      }
      return 1;
    }

    if (native->mSuppressedModifierKeys.count(scanCode) > 0) {
      if (down) {
        native->mSuppressedShortcutKeys.insert(scanCode);
      } else {
        native->mSuppressedShortcutKeys.erase(scanCode);
        native->mPressedKeys.erase(scanCode);
      }
      return 1;
    }

    if (up && native->mSuppressedShortcutKeys.erase(scanCode) > 0) {
      native->mPressedKeys.erase(scanCode);
      return 1;
    }

    if (down && !wasPressed && (event->flags & LLKHF_UP) == 0) {
      const uint32_t eventModifierMask = nativeModifierMask(native->mPressedKeys);
      for (const auto& shortcut : native->mSystemShortcuts) {
        if (shortcut.keyCode != scanCode ||
            shortcut.modifierMask != eventModifierMask) {
          continue;
        }

        bool sidesMatch = true;
        for (const uint32_t modifier : shortcut.sideModifiers) {
          if (native->mPressedKeys.count(modifier) == 0) {
            sidesMatch = false;
            break;
          }
        }
        if (!sidesMatch) {
          continue;
        }

        auto* shortcutName = new std::string(shortcut.shortcut);
        const napi_status status = native->mSystemShortcutCallback.NonBlockingCall(
            shortcutName,
            [](Napi::Env env, Napi::Function callback, std::string* shortcutName) {
              callback.Call({Napi::String::New(env, *shortcutName)});
              delete shortcutName;
            });
        if (status != napi_ok) {
          delete shortcutName;
        }

        native->mSuppressedShortcutKeys.insert(scanCode);
        return 1;
      }
    }

    if (up) {
      native->mPressedKeys.erase(scanCode);
    }
  }

  return CallNextHookEx(nullptr, code, message, data);
}

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::startKeyboardCapture(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsFunction()) {
    Napi::TypeError::New(env, "Function expected").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, false);
  }

  if (!mKeyboardHook) {
    return Napi::Boolean::New(env, false);
  }

  if (mKeyboardCaptureEnabled.exchange(false)) {
    mKeyboardCaptureCallback.Release();
  }

  {
    std::lock_guard<std::mutex> lock(mSuppressedKeysMutex);
    mSuppressedKeys.clear();
  }

  mKeyboardCaptureCallback = Napi::ThreadSafeFunction::New(
      env, info[0].As<Napi::Function>(), "Kando keyboard capture", 0, 1);
  mKeyboardCaptureEnabled.store(true);
  return Napi::Boolean::New(env, true);
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::stopKeyboardCapture(const Napi::CallbackInfo& info) {
  if (mKeyboardCaptureEnabled.exchange(false)) {
    mKeyboardCaptureCallback.Release();
  }
}

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::bindSystemShortcuts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 3 || !info[0].IsArray() || !info[1].IsArray() ||
      !info[2].IsFunction()) {
    Napi::TypeError::New(env, "Two arrays and a Function expected")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, 0);
  }

  if (!mKeyboardHook) {
    return Napi::Number::New(env, 0);
  }

  std::vector<SystemShortcutBinding> bindings;
  const Napi::Array input = info[0].As<Napi::Array>();
  bindings.reserve(input.Length());

  for (uint32_t i = 0; i < input.Length(); ++i) {
    const Napi::Value value = input.Get(i);
    if (!value.IsObject()) {
      continue;
    }

    const Napi::Object object = value.As<Napi::Object>();
    if (!object.Get("shortcut").IsString() || !object.Get("keyCode").IsNumber() ||
        !object.Get("modifierMask").IsNumber() ||
        !object.Get("sideModifiers").IsArray()) {
      continue;
    }

    SystemShortcutBinding binding;
    binding.shortcut     = object.Get("shortcut").As<Napi::String>().Utf8Value();
    binding.keyCode      = object.Get("keyCode").As<Napi::Number>().Uint32Value();
    binding.modifierMask = object.Get("modifierMask").As<Napi::Number>().Uint32Value();

    const Napi::Array sideModifiers = object.Get("sideModifiers").As<Napi::Array>();
    for (uint32_t j = 0; j < sideModifiers.Length(); ++j) {
      if (sideModifiers.Get(j).IsNumber()) {
        binding.sideModifiers.push_back(
            sideModifiers.Get(j).As<Napi::Number>().Uint32Value());
      }
    }
    bindings.push_back(std::move(binding));
  }

  std::unordered_set<uint32_t> suppressedModifiers;
  const Napi::Array modifierInput = info[1].As<Napi::Array>();
  for (uint32_t i = 0; i < modifierInput.Length(); ++i) {
    if (modifierInput.Get(i).IsNumber()) {
      suppressedModifiers.insert(modifierInput.Get(i).As<Napi::Number>().Uint32Value());
    }
  }

  if (mSystemShortcutCallbackEnabled.exchange(false)) {
    mSystemShortcutCallback.Release();
  }

  {
    std::lock_guard<std::mutex> lock(mSuppressedKeysMutex);
    mSystemShortcuts          = std::move(bindings);
    mSuppressedModifierKeys   = std::move(suppressedModifiers);
  }

  if (!mSystemShortcuts.empty()) {
    mSystemShortcutCallback = Napi::ThreadSafeFunction::New(
        env, info[2].As<Napi::Function>(), "Kando system shortcuts", 0, 1);
    mSystemShortcutCallbackEnabled.store(true);
  }

  return Napi::Number::New(env, mSystemShortcuts.size());
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

Napi::Value Native::isModifierPressed(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Modifier name expected").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  static const std::unordered_map<std::string, int> virtualKeys = {
      {"ShiftLeft", VK_LSHIFT},
      {"ShiftRight", VK_RSHIFT},
      {"ControlLeft", VK_LCONTROL},
      {"CtrlLeft", VK_LCONTROL},
      {"CommandOrControlLeft", VK_LCONTROL},
      {"CmdOrCtrlLeft", VK_LCONTROL},
      {"ControlRight", VK_RCONTROL},
      {"CtrlRight", VK_RCONTROL},
      {"CommandOrControlRight", VK_RCONTROL},
      {"CmdOrCtrlRight", VK_RCONTROL},
      {"AltLeft", VK_LMENU},
      {"OptionLeft", VK_LMENU},
      {"AltGrLeft", VK_LMENU},
      {"AltRight", VK_RMENU},
      {"OptionRight", VK_RMENU},
      {"AltGrRight", VK_RMENU},
      {"CommandLeft", VK_LWIN},
      {"CmdLeft", VK_LWIN},
      {"MetaLeft", VK_LWIN},
      {"SuperLeft", VK_LWIN},
      {"CommandRight", VK_RWIN},
      {"CmdRight", VK_RWIN},
      {"MetaRight", VK_RWIN},
      {"SuperRight", VK_RWIN},
  };

  const auto modifier   = info[0].As<Napi::String>().Utf8Value();
  const auto virtualKey = virtualKeys.find(modifier);
  const bool pressed = virtualKey != virtualKeys.end() &&
                       (GetAsyncKeyState(virtualKey->second) & 0x8000) != 0;

  return Napi::Boolean::New(env, pressed);
}

//////////////////////////////////////////////////////////////////////////////////////////

// This is based on https://github.com/yvesh/active-windows

Napi::Value Native::getWMInfo(const Napi::CallbackInfo& info) {
  Napi::Env    env = info.Env();
  Napi::Object obj = Napi::Object::New(env);

  HWND foreground_window = GetForegroundWindow();

  std::string appName;
  std::string windowName;
  getWindowAppAndName(foreground_window, appName, windowName);

  obj.Set("window", windowName);
  obj.Set("app", appName);

  // Get the pointer position.
  {
    POINT p;
    GetCursorPos(&p);
    obj.Set("pointerX", Napi::Number::New(env, p.x));
    obj.Set("pointerY", Napi::Number::New(env, p.y));
  }

  return obj;
}

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::getOpenWindows(const Napi::CallbackInfo& info) {
  Napi::Env   env    = info.Env();
  Napi::Array result = Napi::Array::New(env);

  WindowListContext context;
  EnumWindows(enumerateWindowsForList, reinterpret_cast<LPARAM>(&context));

  uint32_t index = 0;
  for (const auto& windowInfo : context.windows) {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("app", windowInfo.first);
    obj.Set("window", windowInfo.second);
    result.Set(index++, obj);
  }

  return result;
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::focusWindow(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Two strings expected").ThrowAsJavaScriptException();
    return;
  }

  FocusWindowContext context;
  context.targetWindowName = info[0].As<Napi::String>().Utf8Value();
  context.targetAppName    = info[1].As<Napi::String>().Utf8Value();

  EnumWindows(enumerateWindowsForFocus, reinterpret_cast<LPARAM>(&context));

  if (!context.targetWindow) {
    return;
  }

  if (IsIconic(context.targetWindow)) {
    ShowWindow(context.targetWindow, SW_RESTORE);
  }

  SetForegroundWindow(context.targetWindow);
  BringWindowToTop(context.targetWindow);
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::fixAcrylicEffect(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
  }

  HWND hwnd = (HWND)info[0].As<Napi::Number>().Int64Value();

  DWM_BLURBEHIND bb = {0};
  bb.dwFlags        = DWM_BB_ENABLE;
  bb.fEnable        = TRUE;
  bb.hRgnBlur       = NULL;
  DwmEnableBlurBehindWindow(hwnd, &bb);

  // DWMWCP_ROUND = 2 and DWMWA_WINDOW_CORNER_PREFERENCE = 33 are not always defined.
  unsigned p = 2;
  DwmSetWindowAttribute(hwnd, 33, &p, sizeof(p));
}

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::listInstalledApplications(const Napi::CallbackInfo& info) {
  Napi::Env   env    = info.Env();
  Napi::Array result = Napi::Array::New(env);

  IShellItem* pAppsFolder = nullptr;
  HRESULT     hr          = SHGetKnownFolderItem(
      FOLDERID_AppsFolder, KF_FLAG_DEFAULT, NULL, IID_PPV_ARGS(&pAppsFolder));
  if (FAILED(hr)) {
    return result;
  }

  IEnumShellItems* pEnum = nullptr;
  hr = pAppsFolder->BindToHandler(nullptr, BHID_EnumItems, IID_PPV_ARGS(&pEnum));
  if (FAILED(hr)) {
    pAppsFolder->Release();
    return result;
  }

  IShellItem* pItem;
  UINT        index = 0;
  while (pEnum->Next(1, &pItem, nullptr) == S_OK) {
    IShellItem2* pItem2;
    if (SUCCEEDED(pItem->QueryInterface(IID_PPV_ARGS(&pItem2)))) {
      PWSTR   pszName  = nullptr;
      PWSTR   pszAppId = nullptr;
      HBITMAP hBitmap  = nullptr;

      if (SUCCEEDED(pItem2->GetString(PKEY_ItemNameDisplay, &pszName)) &&
          SUCCEEDED(pItem2->GetString(PKEY_AppUserModel_ID, &pszAppId))) {

        // Get the bitmap using IShellItemImageFactory
        IShellItemImageFactory* pImageFactory = nullptr;
        if (SUCCEEDED(pItem2->QueryInterface(IID_PPV_ARGS(&pImageFactory)))) {
          SIZE    size     = {128, 128};
          HRESULT hrBitmap = pImageFactory->GetImage(
              size, SIIGBF_ICONONLY | SIIGBF_BIGGERSIZEOK, &hBitmap);
          pImageFactory->Release();
        }

        std::string name       = WStringToString(pszName);
        std::string appId      = WStringToString(pszAppId);
        std::string iconBase64 = "";

        try {
          iconBase64 = HBitmapToBase64PNG(hBitmap);
        } catch (const std::exception& e) {
          Napi::Object   global  = env.Global();
          Napi::Object   console = global.Get("console").As<Napi::Object>();
          Napi::Function log     = console.Get("log").As<Napi::Function>();
          log.Call(console, {Napi::String::New(env, "Error converting icon to base64: " +
                                                        std::string(e.what()))});
        }

        Napi::Object appInfo = Napi::Object::New(env);
        appInfo.Set("id", appId);
        appInfo.Set("name", name);
        appInfo.Set("base64Icon", iconBase64);

        result.Set(index++, appInfo);

        CoTaskMemFree(pszName);
        CoTaskMemFree(pszAppId);
        if (hBitmap) {
          DeleteObject(hBitmap);
        }
      }

      pItem2->Release();
    }

    pItem->Release();
  }

  pEnum->Release();
  pAppsFolder->Release();

  return result;
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////
