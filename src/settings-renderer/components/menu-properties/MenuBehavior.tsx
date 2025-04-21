//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import { useAppState, useMenuSettings } from '../../state';
import { Checkbox, Note } from '../common';

/** This component shows the behavior options for the currently selected menu. */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const editMenu = useMenuSettings((state) => state.editMenu);

  return (
    <>
      <h1>Menu Behavior</h1>
      <Note marginTop={-5} marginBottom={5}>
        Before you enable these options, we recommend learning why we like Kando's default
        behavior{' '}
        <a href="https://www.youtube.com/watch?v=elHUCarOiXQ" target="_blank">
          here
        </a>
        !
      </Note>
      <Checkbox
        label="Centered Mode"
        info="Open the menu in the screen's center instead of at the cursor."
        initialValue={menus[selectedMenu].centered}
        onChange={(centered) => {
          editMenu(selectedMenu, (menu) => {
            menu.centered = centered;
            return menu;
          });
        }}
      />
      <Checkbox
        label="Anchored Mode"
        info="Open submenus at the same position as the parent menu."
        initialValue={menus[selectedMenu].anchored}
        onChange={(anchored) => {
          editMenu(selectedMenu, (menu) => {
            menu.anchored = anchored;
            return menu;
          });
        }}
      />
      <Checkbox
        label="Hover Mode"
        info="For power users only! Select items by hovering over them."
        initialValue={menus[selectedMenu].hoverMode}
        onChange={(hoverMode) => {
          editMenu(selectedMenu, (menu) => {
            menu.hoverMode = hoverMode;
            return menu;
          });
        }}
      />
    </>
  );
};
