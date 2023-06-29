//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#ifndef KANDO_SIMULATE_KEY_HPP_INCLUDED
#define KANDO_SIMULATE_KEY_HPP_INCLUDED

#include <napi.h>

namespace simulate_key {
void init(Napi::Env env, Napi::Object exports);
}

#endif // KANDO_SIMULATE_KEY_HPP_INCLUDED