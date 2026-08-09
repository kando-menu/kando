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
import classNames from 'classnames/bind';

import * as classes from './MenuBehavior.module.scss';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings } from '../../state';
import { Button, Checkbox, Dropdown, Note } from '../common';
import { Vec2ToFixedPosition, FixedPositionToVec2, FixedPosition } from '../../../common';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import ScreenPositionPicker from './ScreenPositionPicker';
import { BiTargetLock } from 'react-icons/bi';

/** This component shows the behavior options for the currently selected menu. */
export default function MenuBehavior() {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const editMenu = useMenuSettings((state) => state.editMenu);

  const [fixedPositionInputVisible, setFixedPositionInputVisible] = React.useState(false);
  const [fixedPositionPickerVisible, setFixedPositionPickerVisible] =
    React.useState(false);

  React.useEffect(() => {
    setFixedPositionInputVisible(menus[selectedMenu].useFixedPosition);
  }, [selectedMenu, menus]);

  const [menuPositionBehaviorRef] = useAutoAnimate({ duration: 250 });

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
          setFixedPositionInputVisible(enableFixedPosition);
          editMenu(selectedMenu, (menu) => {
            menu.useFixedPosition = enableFixedPosition;
            return menu;
          });
        }}
      />
      <div ref={menuPositionBehaviorRef} className={cx(classes.fixedPositionInput)}>
        {fixedPositionInputVisible ? (
          <>
            <Dropdown
              isDisabled={!menus[selectedMenu].useFixedPosition}
              initialValue={Vec2ToFixedPosition(menus[selectedMenu].fixedMenuPosition)}
              options={(
                Object.keys(FixedPosition) as Array<keyof typeof FixedPosition>
              ).map((key) => ({
                value: FixedPosition[key],
                label: i18next.t(`${FixedPosition[key]}`),
              }))}
              onChange={(newPosition) => {
                editMenu(selectedMenu, (menu) => {
                  menu.fixedMenuPosition = FixedPositionToVec2(newPosition);
                  return menu;
                });
              }}
            />
            <Button
              isGrouped
              icon={<BiTargetLock />}
              tooltip={i18next.t('settings.area-condition-tooltip')}
              variant="secondary"
              onClick={() => {
                setFixedPositionPickerVisible(true);
              }}
            />
          </>
        ) : null}
      </div>
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
      <ScreenPositionPicker
        isVisible={fixedPositionPickerVisible}
        onClose={() => setFixedPositionPickerVisible(false)}
        onSelect={(newPosition) => {
          editMenu(selectedMenu, (menu) => {
            menu.fixedMenuPosition = newPosition;
            return menu;
          });
        }}
      />
    </div>
  );
}
