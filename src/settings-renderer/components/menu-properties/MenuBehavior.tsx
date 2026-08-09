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
import { Button, Checkbox, Note } from '../common';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import ScreenPositionPicker from './ScreenPositionPicker';
import { BiTargetLock } from 'react-icons/bi';
import { clamp, isNaN, toNumber } from 'lodash';
import { fixedMenuPositionToString } from '../../../common';

/** This component shows the behavior options for the currently selected menu. */
export default function MenuBehavior() {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const editMenu = useMenuSettings((state) => state.editMenu);

  const [fixedPositionInputVisible, setFixedPositionInputVisible] = React.useState(false);
  const [fixedPositionPickerVisible, setFixedPositionPickerVisible] =
    React.useState(false);
  const [fixedPositionValueX, setFixedPositionValueX] = React.useState('');
  const [fixedPositionValueY, setFixedPositionValueY] = React.useState('');

  React.useEffect(() => {
    setFixedPositionInputVisible(menus[selectedMenu].useFixedPosition);
    setFixedPositionValueX(
      fixedMenuPositionToString(menus[selectedMenu].fixedMenuPosition.x)
    );
    setFixedPositionValueY(
      fixedMenuPositionToString(menus[selectedMenu].fixedMenuPosition.y)
    );
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
      <div
        ref={menuPositionBehaviorRef}
        className={cx(classes.conditionInput, classes.screenCondition)}>
        {fixedPositionInputVisible ? (
          <>
            {[
              {
                value: fixedPositionValueX,
                setValue: setFixedPositionValueX,
                label: i18next.t('settings.fixed-position-x-placeholder'),
              },
              {
                value: fixedPositionValueY,
                setValue: setFixedPositionValueY,
                label: i18next.t('settings.fixed-position-y-placeholder'),
              },
            ].map(({ value, setValue, label }, index) => (
              <input
                key={`list-${String(index)}`}
                placeholder={label}
                type="text"
                value={value}
                onBlur={() => {
                  editMenu(selectedMenu, (menu) => {
                    let xVal = toNumber(fixedPositionValueX);
                    let yVal = toNumber(fixedPositionValueY);

                    // Default to center of the screen.
                    if (isNaN(xVal)) {
                      xVal = 0.5;
                    }
                    if (isNaN(yVal)) {
                      yVal = 0.5;
                    }

                    menu.fixedMenuPosition = {
                      x: clamp(xVal, 0, 1),
                      y: clamp(yVal, 0, 1),
                    };
                    return menu;
                  });
                }}
                onChange={(event) => {
                  if (!event.target.value || event.target.value.match(/^\d*\.?\d*$/)) {
                    setValue(event.target.value);
                  }
                }}
              />
            ))}
            <Button
              isGrouped
              icon={<BiTargetLock />}
              tooltip={i18next.t('settings.fixed-position-tooltip')}
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
          setFixedPositionValueX(fixedMenuPositionToString(newPosition.x));
          setFixedPositionValueY(fixedMenuPositionToString(newPosition.y));
          editMenu(selectedMenu, (menu) => {
            menu.fixedMenuPosition = newPosition;
            return menu;
          });
        }}
      />
    </div>
  );
}
