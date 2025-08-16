//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "Native.hpp"

#include <AppKit/AppKit.h>
#include <ApplicationServices/ApplicationServices.h>
#include <Carbon/Carbon.h>

#include <iostream>
#include <sys/mman.h>
#include <unistd.h>

//////////////////////////////////////////////////////////////////////////////////////////

namespace {

Napi::Object processAppAtPath(const Napi::Env& env, NSString* appPath) {
  Napi::Object appInfo = Napi::Object::New(env);

  NSBundle* bundle = [NSBundle bundleWithPath:appPath];
  if (!bundle) {
    return appInfo;
  }

  NSString* name     = [[bundle objectForInfoDictionaryKey:@"CFBundleName"] description];
  NSString* execName = [bundle objectForInfoDictionaryKey:@"CFBundleExecutable"];
  NSImage*  icon     = [[NSWorkspace sharedWorkspace] iconForFile:appPath];

  // Create a 64x64 bitmap and draw the icon into it
  NSImage* resizedIcon = [[NSImage alloc] initWithSize:NSMakeSize(64, 64)];
  [resizedIcon lockFocus];
  [icon drawInRect:NSMakeRect(0, 0, 64, 64)
            fromRect:NSZeroRect
           operation:NSCompositingOperationSourceOver
            fraction:1.0
      respectFlipped:YES
               hints:@{
                 NSImageHintInterpolation: @(NSImageInterpolationHigh)
               }];
  [resizedIcon unlockFocus];

  NSData* tiffData = [resizedIcon TIFFRepresentation];
  if (tiffData) {
    NSBitmapImageRep* rep        = [NSBitmapImageRep imageRepWithData:tiffData];
    NSData*           pngData    = [rep representationUsingType:NSBitmapImageFileTypePNG
                                        properties:@{}];
    NSString*         base64Icon = [pngData base64EncodedStringWithOptions:0];

    if (base64Icon) {
      // Add data: prefix to the base64 string.
      base64Icon = [NSString stringWithFormat:@"data:image/png;base64,%@", base64Icon];

      appInfo.Set("name", Napi::String::New(env, name.UTF8String));
      appInfo.Set("id", Napi::String::New(env, execName.UTF8String));
      appInfo.Set("base64Icon", Napi::String::New(env, base64Icon.UTF8String));
    }
  }
  return appInfo;
}

} // namespace

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(exports,
      {
          InstanceMethod("movePointer", &Native::movePointer),
          InstanceMethod("simulateKey", &Native::simulateKey),
          InstanceMethod("getActiveWindow", &Native::getActiveWindow),
          InstanceMethod("listInstalledApplications", &Native::listInstalledApplications),
      });
}

//////////////////////////////////////////////////////////////////////////////////////////

Native::~Native() {
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::movePointer(const Napi::CallbackInfo& info) {

  // We need to check the number of arguments and their types. If something is wrong, we
  // throw a JavaScript exception.
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::Error::New(env, "Two Numbers expected!").ThrowAsJavaScriptException();
    return;
  }

  int32_t dx = info[0].As<Napi::Number>().Int32Value();
  int32_t dy = info[1].As<Napi::Number>().Int32Value();

  // Get the current mouse position.
  CGEventRef event = CGEventCreate(NULL);
  CGPoint    pos   = CGEventGetLocation(event);
  CFRelease(event);

  // Move the pointer.
  CGWarpMouseCursorPosition(CGPointMake(dx + pos.x, dy + pos.y));
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::simulateKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // Make sure we have access to the event tap.
  if (!CGRequestPostEventAccess()) {
    Napi::Error::New(env, "Please give accessibility permissions to Kando!")
        .ThrowAsJavaScriptException();
    return;
  }

  // We need to check the number of arguments and their types. If something is wrong, we
  // throw a JavaScript exception.
  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Number and Boolean expected").ThrowAsJavaScriptException();
  }

  int32_t keycode = info[0].As<Napi::Number>().Int32Value();
  bool    press   = info[1].As<Napi::Boolean>().Value();

  auto setOrReleaseBit = [](uint32_t& mask, uint32_t bit, bool set) {
    if (set) {
      mask |= bit;
    } else {
      mask &= ~bit;
    }
  };

  // If this is a modifier key, we need to update our internal modifier mask.
  if (keycode == kVK_Command) {
    setOrReleaseBit(mLeftModifierMask, kCGEventFlagMaskCommand, press);
  } else if (keycode == kVK_RightCommand) {
    setOrReleaseBit(mRightModifierMask, kCGEventFlagMaskCommand, press);
  } else if (keycode == kVK_Shift) {
    setOrReleaseBit(mLeftModifierMask, kCGEventFlagMaskShift, press);
  } else if (keycode == kVK_RightShift) {
    setOrReleaseBit(mRightModifierMask, kCGEventFlagMaskShift, press);
  } else if (keycode == kVK_Control) {
    setOrReleaseBit(mLeftModifierMask, kCGEventFlagMaskControl, press);
  } else if (keycode == kVK_RightControl) {
    setOrReleaseBit(mRightModifierMask, kCGEventFlagMaskControl, press);
  } else if (keycode == kVK_Option) {
    setOrReleaseBit(mLeftModifierMask, kCGEventFlagMaskAlternate, press);
  } else if (keycode == kVK_RightOption) {
    setOrReleaseBit(mRightModifierMask, kCGEventFlagMaskAlternate, press);
  }

  // Create a key event.
  CGEventRef event = CGEventCreateKeyboardEvent(nullptr, keycode, press);
  CGEventSetFlags(event, mLeftModifierMask | mRightModifierMask);
  CGEventPost(kCGHIDEventTap, event);
  CFRelease(event);
}

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::getActiveWindow(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // Set default values.
  Napi::Object result = Napi::Object::New(env);
  result.Set("name", Napi::String::New(env, ""));
  result.Set("app", Napi::String::New(env, ""));

  // We get the PID of the frontmost application and then iterate over all windows to
  // find the first one with the same PID.
  auto app = NSWorkspace.sharedWorkspace.frontmostApplication;

  if (app) {

    std::string appName;

    // We prefer the bundle identifier, but if it is not available we use the
    // localizedName. The former is more portable and more specific.
    if (app.bundleIdentifier) {
      appName = app.bundleIdentifier.UTF8String;
    }

    if (appName.empty() && app.localizedName) {
      appName = app.localizedName.UTF8String;
    }

    result.Set("app", Napi::String::New(env, appName));

    // Now we iterate over all windows and find the first one with the same PID.
    CFArrayRef windows =
        CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly, kCGNullWindowID);

    for (NSMutableDictionary* entry in (NSArray*)windows) {
      NSInteger pid = [[entry objectForKey:(id)kCGWindowOwnerPID] integerValue];

      if (pid == app.processIdentifier) {
        NSString* name = [entry objectForKey:(id)kCGWindowName];

        if (name) {
          result.Set("name", Napi::String::New(env, name.UTF8String));
        } else {
          result.Set(
              "name", Napi::String::New(env, "Missing Screen Recording Permissions"));
          std::cout
              << "Failed to get window name for app " << appName
              << ". Maybe you need to enable screen recording permissions for Kando?"
              << std::endl;
        }

        break;
      }
    }

    CFRelease(windows);
  }

  return result;
}

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::listInstalledApplications(const Napi::CallbackInfo& info) {
  Napi::Env   env    = info.Env();
  Napi::Array result = Napi::Array::New(env);

  @autoreleasepool {
    NSArray<NSString*>* appDirs = @[
      @"/Applications", @"/System/Applications",
      [NSHomeDirectory() stringByAppendingPathComponent:@"Applications"],
      [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Applications"]
    ];

    NSFileManager* fm = [NSFileManager defaultManager];
    for (NSString* dir in appDirs) {
      NSDirectoryEnumerator* enumerator = [fm enumeratorAtPath:dir];
      NSString*              file;
      while ((file = [enumerator nextObject])) {
        if ([[file pathExtension] isEqualToString:@"app"]) {
          NSString*    fullPath = [dir stringByAppendingPathComponent:file];
          Napi::Object appInfo  = processAppAtPath(env, fullPath);
          if (!appInfo.IsEmpty()) {
            result.Set(result.Length(), appInfo);
          }
          [enumerator skipDescendants];
        }
      }
    }
  }

  return result;
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////