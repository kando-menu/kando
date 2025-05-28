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
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { BiTargetLock } from 'react-icons/bi';

import * as classes from './MenuConditions.module.scss';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings } from '../../state';
import { Checkbox, Button, Note } from '../common';
import ScreenAreaPicker from './ScreenAreaPicker';
import WindowPicker from './WindowPicker';

/** This component shows the conditions for displaying the currently selected menu. */
export default function MenuConditions() {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const editMenu = useMenuSettings((state) => state.editMenu);

  const [appCondition, setAppCondition] = React.useState('');
  const [windowCondition, setWindowCondition] = React.useState('');
  const [screenMinX, setScreenMinX] = React.useState('');
  const [screenMinY, setScreenMinY] = React.useState('');
  const [screenMaxX, setScreenMaxX] = React.useState('');
  const [screenMaxY, setScreenMaxY] = React.useState('');

  const [appConditionVisible, setAppConditionVisible] = React.useState(false);
  const [windowConditionVisible, setWindowConditionVisible] = React.useState(false);
  const [screenConditionVisible, setScreenConditionVisible] = React.useState(false);
  const [screenAreaPickerVisible, setScreenAreaPickerVisible] = React.useState(false);
  const [appPickerVisible, setAppPickerVisible] = React.useState(false);
  const [windowPickerVisible, setWindowPickerVisible] = React.useState(false);

  // Initialize the conditions for the selected menu.
  React.useEffect(() => {
    setAppCondition(menus[selectedMenu].conditions?.appName || '');
    setWindowCondition(menus[selectedMenu].conditions?.windowName || '');

    setAppConditionVisible(!!menus[selectedMenu].conditions?.appName);
    setWindowConditionVisible(!!menus[selectedMenu].conditions?.windowName);

    const minX = menus[selectedMenu].conditions?.screenArea?.xMin?.toString() || '';
    const minY = menus[selectedMenu].conditions?.screenArea?.yMin?.toString() || '';
    const maxX = menus[selectedMenu].conditions?.screenArea?.xMax?.toString() || '';
    const maxY = menus[selectedMenu].conditions?.screenArea?.yMax?.toString() || '';

    setScreenMinX(minX);
    setScreenMinY(minY);
    setScreenMaxX(maxX);
    setScreenMaxY(maxY);

    setScreenConditionVisible(minX !== '' || minY !== '' || maxX !== '' || maxY !== '');
  }, [selectedMenu, menus]);

  // This is used to animate the height condition inputs.
  const [appConditionRef] = useAutoAnimate({ duration: 250 });
  const [windowConditionRef] = useAutoAnimate({ duration: 250 });
  const [screenConditionRef] = useAutoAnimate({ duration: 250 });

  return (
    <>
      <h1>{i18next.t('settings.menu-conditions')}</h1>
      <Note marginTop={-5} marginBottom={5}>
        {i18next.t('settings.menu-conditions-info')}
      </Note>
      <Checkbox
        label={i18next.t('settings.app-condition')}
        info={i18next.t('settings.app-condition-info')}
        initialValue={appConditionVisible}
        onChange={(value) => {
          setAppConditionVisible(value);
          if (!value) {
            setAppCondition('');
            editMenu(selectedMenu, (menu) => {
              if (menu.conditions?.appName) {
                delete menu.conditions.appName;
              }
              return menu;
            });
          }
        }}
      />
      <div ref={appConditionRef} className={classes.conditionInput}>
        {appConditionVisible && (
          <>
            <input
              type="text"
              placeholder={i18next.t('settings.app-condition-placeholder')}
              value={appCondition}
              onChange={(event) => setAppCondition(event.target.value)}
              onBlur={() => {
                editMenu(selectedMenu, (menu) => {
                  menu.conditions = menu.conditions || {};

                  if (appCondition === '') {
                    delete menu.conditions.appName;
                  } else {
                    menu.conditions.appName = appCondition;
                  }
                  return menu;
                });
              }}
            />
            <Button
              variant="secondary"
              grouped
              tooltip={i18next.t('settings.app-condition-tooltip')}
              icon={<BiTargetLock />}
              onClick={() => {
                setAppPickerVisible(true);
              }}
            />
          </>
        )}
      </div>
      <Checkbox
        label={i18next.t('settings.window-condition')}
        info={i18next.t('settings.window-condition-info')}
        initialValue={windowConditionVisible}
        onChange={(value) => {
          setWindowConditionVisible(value);
          if (!value) {
            setWindowCondition('');
            editMenu(selectedMenu, (menu) => {
              if (menu.conditions?.windowName) {
                delete menu.conditions.windowName;
              }
              return menu;
            });
          }
        }}
      />
      <div ref={windowConditionRef} className={classes.conditionInput}>
        {windowConditionVisible && (
          <>
            <input
              type="text"
              placeholder={i18next.t('settings.window-condition-placeholder')}
              value={windowCondition}
              onChange={(event) => setWindowCondition(event.target.value)}
              onBlur={() => {
                editMenu(selectedMenu, (menu) => {
                  menu.conditions = menu.conditions || {};

                  if (windowCondition === '') {
                    delete menu.conditions.windowName;
                  } else {
                    menu.conditions.windowName = windowCondition;
                  }
                  return menu;
                });
              }}
            />
            <Button
              variant="secondary"
              grouped
              tooltip={i18next.t('settings.window-condition-tooltip')}
              icon={<BiTargetLock />}
              onClick={() => {
                setWindowPickerVisible(true);
              }}
            />
          </>
        )}
      </div>
      <Checkbox
        label={i18next.t('settings.area-condition')}
        info={i18next.t('settings.area-condition-info')}
        initialValue={screenConditionVisible}
        onChange={(value) => {
          setScreenConditionVisible(value);
          if (!value) {
            setScreenMinX('');
            setScreenMinY('');
            setScreenMaxX('');
            setScreenMaxY('');

            editMenu(selectedMenu, (menu) => {
              if (menu.conditions?.screenArea) {
                delete menu.conditions.screenArea;
              }
              return menu;
            });
          }
        }}
      />
      <div
        ref={screenConditionRef}
        className={cx(classes.conditionInput, classes.screenCondition)}>
        {screenConditionVisible && (
          <>
            {[
              {
                value: screenMinY,
                setValue: setScreenMinY,
                label: i18next.t('settings.area-condition-top-placeholder'),
              },
              {
                value: screenMinX,
                setValue: setScreenMinX,
                label: i18next.t('settings.area-condition-left-placeholder'),
              },
              {
                value: screenMaxY,
                setValue: setScreenMaxY,
                label: i18next.t('settings.area-condition-bottom-placeholder'),
              },
              {
                value: screenMaxX,
                setValue: setScreenMaxX,
                label: i18next.t('settings.area-condition-right-placeholder'),
              },
            ].map(({ value, setValue, label }, index) => (
              <input
                key={index}
                value={value}
                type="number"
                onBlur={() => {
                  editMenu(selectedMenu, (menu) => {
                    menu.conditions = menu.conditions || {};

                    if (
                      screenMinX === '' &&
                      screenMinY === '' &&
                      screenMaxX === '' &&
                      screenMaxY === ''
                    ) {
                      delete menu.conditions.screenArea;
                    } else {
                      menu.conditions.screenArea = {
                        xMin: screenMinX === '' ? null : parseInt(screenMinX),
                        yMin: screenMinY === '' ? null : parseInt(screenMinY),
                        xMax: screenMaxX === '' ? null : parseInt(screenMaxX),
                        yMax: screenMaxY === '' ? null : parseInt(screenMaxY),
                      };
                    }
                    return menu;
                  });
                }}
                placeholder={label}
                onChange={(event) => setValue(event.target.value)}
              />
            ))}
            <Button
              variant="secondary"
              grouped
              tooltip={i18next.t('settings.area-condition-tooltip')}
              icon={<BiTargetLock />}
              onClick={() => {
                setScreenAreaPickerVisible(true);
              }}
            />
          </>
        )}
      </div>
      <WindowPicker
        mode="application"
        visible={appPickerVisible}
        onSelect={(value) => {
          setAppCondition(value);
          editMenu(selectedMenu, (menu) => {
            menu.conditions = menu.conditions || {};
            menu.conditions.appName = value;
            return menu;
          });
        }}
        onClose={() => setAppPickerVisible(false)}
      />
      <WindowPicker
        mode="title"
        visible={windowPickerVisible}
        onSelect={(value) => {
          setWindowCondition(value);
          editMenu(selectedMenu, (menu) => {
            menu.conditions = menu.conditions || {};
            menu.conditions.windowName = value;
            return menu;
          });
        }}
        onClose={() => setWindowPickerVisible(false)}
      />
      <ScreenAreaPicker
        visible={screenAreaPickerVisible}
        onSelect={(top, left, bottom, right) => {
          setScreenMinX(left.toString());
          setScreenMaxX(right.toString());
          setScreenMinY(top.toString());
          setScreenMaxY(bottom.toString());
          editMenu(selectedMenu, (menu) => {
            menu.conditions = menu.conditions || {};
            menu.conditions.screenArea = {
              xMin: left,
              yMin: top,
              xMax: right,
              yMax: bottom,
            };
            return menu;
          });
        }}
        onClose={() => setScreenAreaPickerVisible(false)}
      />
    </>
  );
}
