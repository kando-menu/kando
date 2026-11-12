//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "MouseHook.hpp"

#include <atomic>
#include <cmath>
#include <future>

//////////////////////////////////////////////////////////////////////////////////////////

namespace {

// Events injected by us carry this marker in dwExtraInfo so that the hook can ignore
// them. ("KAND" in ASCII.)
constexpr ULONG_PTR kReplayMarker = 0x4B414E44;

const char* const kButtonNames[MouseHook::eButtonCount] = {
    "Right", "Middle", "X1", "X2"};

enum class Phase {
  eIdle,        // No trigger button is down.
  ePending,     // A trigger button is down, we wait for the hold time to pass.
  eHolding,     // The hold time passed, the menu is (being) shown.
  ePassthrough, // The press was replayed as a normal press. We do not interfere anymore.
};

struct Event {
  std::string kind; // "press" or "release"
  int         button;
};

// Configuration. Written from the JS thread, read from the hook thread.
std::mutex                                   gConfigMutex;
std::array<bool, MouseHook::eButtonCount>    gEnabled{};
unsigned                                     gHoldTimeMs     = 250;
int                                          gMoveTolerance  = 6;

// State of the hook thread. Only accessed from the hook thread.
Phase     gPhase        = Phase::eIdle;
int       gActiveButton = -1;
POINT     gDownPos      = {0, 0};
UINT_PTR  gTimerId      = 0;

// Thread management.
std::thread                     gThread;
std::atomic<DWORD>              gThreadId{0};
HHOOK                           gHook = nullptr;
Napi::ThreadSafeFunction        gCallback;
bool                            gRunning = false;

//////////////////////////////////////////////////////////////////////////////////////////

void emit(const char* kind, int button) {
  if (!gCallback) {
    return;
  }

  auto* event = new Event{kind, button};
  napi_status status = gCallback.NonBlockingCall(
      event, [](Napi::Env env, Napi::Function jsCallback, Event* e) {
        if (env != nullptr) {
          jsCallback.Call({Napi::String::New(env, e->kind),
              Napi::String::New(env, kButtonNames[e->button])});
        }
        delete e;
      });

  if (status != napi_ok) {
    delete event;
  }
}

// Sends a button press or release which will be ignored by our own hook.
void injectButton(int button, bool down) {
  INPUT in{};
  in.type           = INPUT_MOUSE;
  in.mi.dwExtraInfo = kReplayMarker;

  switch (button) {
  case MouseHook::eRight:
    in.mi.dwFlags = down ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP;
    break;
  case MouseHook::eMiddle:
    in.mi.dwFlags = down ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_MIDDLEUP;
    break;
  case MouseHook::eX1:
    in.mi.dwFlags   = down ? MOUSEEVENTF_XDOWN : MOUSEEVENTF_XUP;
    in.mi.mouseData = XBUTTON1;
    break;
  case MouseHook::eX2:
    in.mi.dwFlags   = down ? MOUSEEVENTF_XDOWN : MOUSEEVENTF_XUP;
    in.mi.mouseData = XBUTTON2;
    break;
  default:
    return;
  }

  SendInput(1, &in, sizeof(INPUT));
}

void cancelTimer() {
  if (gTimerId != 0) {
    KillTimer(nullptr, gTimerId);
    gTimerId = 0;
  }
}

// Called on the hook thread when the hold time has passed.
void CALLBACK onHoldTimer(HWND, UINT, UINT_PTR, DWORD) {
  cancelTimer();

  if (gPhase == Phase::ePending) {
    gPhase = Phase::eHolding;
    emit("press", gActiveButton);
  }
}

// Returns the button for the given mouse message or -1. Sets 'down' accordingly.
int classify(WPARAM wParam, const MSLLHOOKSTRUCT* ms, bool& down) {
  switch (wParam) {
  case WM_RBUTTONDOWN:
    down = true;
    return MouseHook::eRight;
  case WM_RBUTTONUP:
    down = false;
    return MouseHook::eRight;
  case WM_MBUTTONDOWN:
    down = true;
    return MouseHook::eMiddle;
  case WM_MBUTTONUP:
    down = false;
    return MouseHook::eMiddle;
  case WM_XBUTTONDOWN:
  case WM_XBUTTONUP:
    down = (wParam == WM_XBUTTONDOWN);
    return HIWORD(ms->mouseData) == XBUTTON1 ? MouseHook::eX1 : MouseHook::eX2;
  default:
    return -1;
  }
}

LRESULT CALLBACK lowLevelMouseProc(int nCode, WPARAM wParam, LPARAM lParam) {
  if (nCode != HC_ACTION) {
    return CallNextHookEx(nullptr, nCode, wParam, lParam);
  }

  const auto* ms = reinterpret_cast<const MSLLHOOKSTRUCT*>(lParam);

  // Ignore the clicks which we replayed ourselves. We must not ignore other injected
  // events: Precision touchpads, many mouse drivers, and remote desktop sessions deliver
  // their clicks as injected events, and we want those to work as well.
  if ((ms->flags & LLMHF_INJECTED) && ms->dwExtraInfo == kReplayMarker) {
    return CallNextHookEx(nullptr, nCode, wParam, lParam);
  }

  // If the pointer moves too far while we are waiting for the hold time, the user is
  // dragging. Replay the swallowed press and let everything pass from now on.
  if (wParam == WM_MOUSEMOVE) {
    if (gPhase == Phase::ePending) {
      int tolerance;
      {
        std::lock_guard<std::mutex> lock(gConfigMutex);
        tolerance = gMoveTolerance;
      }

      double dx = static_cast<double>(ms->pt.x - gDownPos.x);
      double dy = static_cast<double>(ms->pt.y - gDownPos.y);

      if (std::sqrt(dx * dx + dy * dy) > tolerance) {
        cancelTimer();
        gPhase = Phase::ePassthrough;
        injectButton(gActiveButton, true);
      }
    }

    return CallNextHookEx(nullptr, nCode, wParam, lParam);
  }

  bool down = false;
  int  button = classify(wParam, ms, down);

  if (button < 0) {
    return CallNextHookEx(nullptr, nCode, wParam, lParam);
  }

  if (down) {
    // A new press of the active button while we think it is still down means we missed a
    // release (e.g. on the secure desktop). Start over.
    if (button == gActiveButton && gPhase != Phase::eIdle) {
      cancelTimer();
      gPhase = Phase::eIdle;
      gActiveButton = -1;
    }

    bool enabled;
    unsigned holdTime;
    {
      std::lock_guard<std::mutex> lock(gConfigMutex);
      enabled  = gEnabled[button];
      holdTime = gHoldTimeMs;
    }

    if (enabled && gPhase == Phase::eIdle) {
      gPhase        = Phase::ePending;
      gActiveButton = button;
      gDownPos      = ms->pt;
      gTimerId      = SetTimer(nullptr, 0, holdTime, onHoldTimer);

      // Swallow the press. It will be replayed if this turns out to be a normal click.
      return 1;
    }

    return CallNextHookEx(nullptr, nCode, wParam, lParam);
  }

  // Button release. We always handle the release of the active button, even if the
  // trigger has been disabled in the meantime.
  if (button == gActiveButton) {
    switch (gPhase) {
    case Phase::ePending:
      // A short click: replay press and release so that the application sees a normal
      // click. Context menus open on release anyway, so this feels identical.
      cancelTimer();
      gPhase        = Phase::eIdle;
      gActiveButton = -1;
      injectButton(button, true);
      injectButton(button, false);
      return 1;

    case Phase::eHolding:
      gPhase        = Phase::eIdle;
      gActiveButton = -1;
      emit("release", button);
      return 1;

    case Phase::ePassthrough:
      gPhase        = Phase::eIdle;
      gActiveButton = -1;
      break;

    default:
      break;
    }
  }

  return CallNextHookEx(nullptr, nCode, wParam, lParam);
}

void hookThreadMain(std::promise<bool> started) {
  gHook = SetWindowsHookExW(WH_MOUSE_LL, lowLevelMouseProc, GetModuleHandleW(nullptr), 0);

  if (gHook == nullptr) {
    started.set_value(false);
    return;
  }

  gPhase        = Phase::eIdle;
  gActiveButton = -1;
  gTimerId      = 0;

  // Force creation of the thread's message queue before we tell the caller that we are
  // ready to receive WM_QUIT.
  MSG msg;
  PeekMessageW(&msg, nullptr, WM_USER, WM_USER, PM_NOREMOVE);
  gThreadId = GetCurrentThreadId();
  started.set_value(true);

  // The message loop is required for the low-level hook and for the timer.
  while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
    TranslateMessage(&msg);
    DispatchMessageW(&msg);
  }

  cancelTimer();
  UnhookWindowsHookEx(gHook);
  gHook = nullptr;
  gThreadId = 0;
}

} // namespace

//////////////////////////////////////////////////////////////////////////////////////////

int MouseHook::buttonFromName(const std::string& name) {
  for (int i = 0; i < eButtonCount; ++i) {
    if (name == kButtonNames[i]) {
      return i;
    }
  }
  return -1;
}

//////////////////////////////////////////////////////////////////////////////////////////

void MouseHook::start(Napi::Env env, Napi::Function callback) {
  if (gRunning) {
    return;
  }

  gCallback = Napi::ThreadSafeFunction::New(env, callback, "KandoMouseHook", 0, 1);

  // The callback should not keep the process alive on its own.
  gCallback.Unref(env);

  std::promise<bool> started;
  std::future<bool>  startedFuture = started.get_future();
  gThread = std::thread(hookThreadMain, std::move(started));

  if (!startedFuture.get()) {
    gThread.join();
    gCallback.Release();
    gCallback = Napi::ThreadSafeFunction();
    Napi::Error::New(env, "Failed to install the low-level mouse hook.")
        .ThrowAsJavaScriptException();
    return;
  }

  gRunning = true;
}

//////////////////////////////////////////////////////////////////////////////////////////

void MouseHook::stop() {
  if (!gRunning) {
    return;
  }

  PostThreadMessageW(gThreadId, WM_QUIT, 0, 0);
  gThread.join();

  gCallback.Release();
  gCallback = Napi::ThreadSafeFunction();
  gRunning  = false;
}

//////////////////////////////////////////////////////////////////////////////////////////

void MouseHook::setTriggers(
    std::array<bool, eButtonCount> enabled, unsigned holdTimeMs, int moveTolerancePx) {
  std::lock_guard<std::mutex> lock(gConfigMutex);
  gEnabled       = enabled;
  gHoldTimeMs    = holdTimeMs;
  gMoveTolerance = moveTolerancePx;
}
