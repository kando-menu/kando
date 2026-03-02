//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

/** The tips component for submenu items shows a list of useful tips for submenu items. */
export function getSubmenuItemTips() {
  return [
    i18next.t('menu-items.submenu.tip-1'),
    i18next.t('menu-items.submenu.tip-2'),
    i18next.t('menu-items.submenu.tip-3'),
    i18next.t('menu-items.submenu.tip-4'),
    i18next.t('menu-items.submenu.tip-5'),
    i18next.t('menu-items.submenu.tip-6'),
    i18next.t('menu-items.submenu.tip-7'),
  ];
}
