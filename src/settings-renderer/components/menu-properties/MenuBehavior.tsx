//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';

import { useAppState, useMenuSettings } from '../../state';
import { Checkbox, Note } from '../common';

/** This component shows the behavior options for the currently selected menu. */
export default function MenuBehavior() {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const editMenu = useMenuSettings((state) => state.editMenu);

  return (
    <>
      <h1>{i18next.t('settings.menu-behavior')}</h1>
      <Note useMarkdown marginBottom={5} marginTop={-5}>
        {i18next.t('settings.menu-behavior-info', {
          link: 'https://www.youtube.com/watch?v=elHUCarOiXQ',
        })}
      </Note>
      <Checkbox
        info={i18next.t('settings.centered-mode-info')}
        initialValue={menus[selectedMenu].centered}
        label={i18next.t('settings.centered-mode')}
        onChange={(centered) => {
          editMenu(selectedMenu, (menu) => {
            menu.centered = centered;
            return menu;
          });
        }}
      />
      <Checkbox
        info={i18next.t('settings.anchored-mode-info')}
        initialValue={menus[selectedMenu].anchored}
        label={i18next.t('settings.anchored-mode')}
        onChange={(anchored) => {
          editMenu(selectedMenu, (menu) => {
            menu.anchored = anchored;
            return menu;
          });
        }}
      />
      <Checkbox
        info={i18next.t('settings.hover-mode-info')}
        initialValue={menus[selectedMenu].hoverMode}
        label={i18next.t('settings.hover-mode')}
        onChange={(hoverMode) => {
          editMenu(selectedMenu, (menu) => {
            menu.hoverMode = hoverMode;
            return menu;
          });
        }}
      />
    </>
  );
}
