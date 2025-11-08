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
#include <vector>

//////////////////////////////////////////////////////////////////////////////////////////

namespace {

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
} // namespace

//////////////////////////////////////////////////////////////////////////////////////////

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(exports,
      {
          InstanceMethod("movePointer", &Native::movePointer),
          InstanceMethod("simulateKey", &Native::simulateKey),
          InstanceMethod("getWMInfo", &Native::getWMInfo),
          InstanceMethod("fixAcrylicEffect", &Native::fixAcrylicEffect),
          InstanceMethod("listInstalledApplications", &Native::listInstalledApplications),
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

Napi::Value Native::getWMInfo(const Napi::CallbackInfo& info) {
  Napi::Env    env = info.Env();
  Napi::Object obj = Napi::Object::New(env);

  // Get the window name.
  {
    WCHAR window_title[256];
    HWND  foreground_window = GetForegroundWindow();
    GetWindowTextW(foreground_window, window_title, 256);

    std::wstring ws(window_title);
    obj.Set("name", WStringToString(ws));
  }

  // Get the app name.
  {
    DWORD pid;
    GetWindowThreadProcessId(foreground_window, &pid);

    CHAR  process_filename[MAX_PATH];
    DWORD charsCarried = MAX_PATH;

    HANDLE hProc = OpenProcess(
        PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_QUERY_INFORMATION, false, pid);

    QueryFullProcessImageNameA(hProc, 0, process_filename, &charsCarried);

    std::string fullpath = process_filename;

    const size_t last_slash_idx = fullpath.find_last_of("\\/");

    if (std::string::npos != last_slash_idx) {
      fullpath.erase(0, last_slash_idx + 1);
    }

    obj.Set("app", fullpath);
  }

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
