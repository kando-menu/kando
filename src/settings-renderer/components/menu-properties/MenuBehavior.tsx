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

import * as classes from './MenuBehavior.module.scss';

import { useAppState, useMenuSettings } from '../../state';
import { Checkbox, Dropdown, Note } from '../common';
import { Vec2ToFixedPosition, FixedPositionToVec2, FixedPosition } from '../../../common';

/** This component shows the behavior options for the currently selected menu. */
export default function MenuBehavior() {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const editMenu = useMenuSettings((state) => state.editMenu);

  return (
    <div className={classes.container}>
      <Note useMarkdown marginBottom={-5} marginTop={-5}>
        {i18next.t('settings.menu-behavior-info', {
          link: 'https://kando.menu/usage/',
        })}
      </Note>
      <Checkbox
        info={i18next.t('settings.fixed-position-mode-info')}
        initialValue={menus[selectedMenu].useFixedPosition}
        label={i18next.t('settings.fixed-position-mode')}
        onChange={(enableFixedPosition) => {
          editMenu(selectedMenu, (menu) => {
            menu.useFixedPosition = enableFixedPosition;
            return menu;
          });
        }}
      />
      <Dropdown
        isDisabled={!menus[selectedMenu].useFixedPosition}
        initialValue={Vec2ToFixedPosition(menus[selectedMenu].fixedMenuPosition)}
        options={(Object.keys(FixedPosition) as Array<keyof typeof FixedPosition>).map(
          (key) => ({
            value: FixedPosition[key],
            label: i18next.t(`${FixedPosition[key]}`),
          })
        )}
        onChange={(newPosition) => {
          editMenu(selectedMenu, (menu) => {
            menu.fixedMenuPosition = FixedPositionToVec2(newPosition);
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
    </div>
  );
}
