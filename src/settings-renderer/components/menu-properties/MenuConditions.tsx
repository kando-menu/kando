//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

import * as classes from './MenuConditions.module.scss';

import { useAppState, useMenuSettings } from '../../state';
import { TextInput, Checkbox, Note } from '../common';

/** This component shows the conditions for displaying the currently selected menu. */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const editMenu = useMenuSettings((state) => state.editMenu);

  const [screenMinX, setScreenMinX] = React.useState('');
  const [screenMinY, setScreenMinY] = React.useState('');
  const [screenMaxX, setScreenMaxX] = React.useState('');
  const [screenMaxY, setScreenMaxY] = React.useState('');

  const [appConditionVisible, setAppConditionVisible] = React.useState(false);
  const [windowConditionVisible, setWindowConditionVisible] = React.useState(false);
  const [screenConditionVisible, setScreenConditionVisible] = React.useState(false);

  // Initialize the conditions for the selected menu.
  React.useEffect(() => {
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

  const saveAppCondition = (value: string) => {
    editMenu(selectedMenu, (menu) => {
      menu.conditions = menu.conditions || {};

      if (value === null || value === '') {
        delete menu.conditions.appName;
      } else {
        menu.conditions.appName = value;
      }
      return menu;
    });
  };

  const saveWindowCondition = (value: string) => {
    editMenu(selectedMenu, (menu) => {
      menu.conditions = menu.conditions || {};

      if (value === null || value === '') {
        delete menu.conditions.windowName;
      } else {
        menu.conditions.windowName = value;
      }
      return menu;
    });
  };

  const saveScreenCondition = () => {
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
  };

  return (
    <>
      <h1>Menu Conditions</h1>
      <Note marginTop={-8}>
        You can bind multiple menus to the same shortcut and then choose under which
        conditions each menu should be shown.
      </Note>
      <Checkbox
        label="Limit to Specific Apps"
        info="Show the menu only if a specific application is focused. This supports regular expressions like /firefox|chrome/i."
        initialValue={appConditionVisible}
        onChange={(value) => {
          setAppConditionVisible(value);
          if (!value) {
            saveAppCondition(null);
          }
        }}
      />
      <div ref={appConditionRef}>
        {appConditionVisible && (
          <TextInput
            initialValue={menus[selectedMenu].conditions?.appName || ''}
            placeholder="e.g. /firefox|chrome/i"
            onChange={(name) => saveAppCondition(name)}
          />
        )}
      </div>
      <Checkbox
        label="Limit to Specific Window Titles"
        info="Show the menu only if the focused window's title contains a given text. This supports regular expressions like /youtube|vimeo/i."
        initialValue={windowConditionVisible}
        onChange={(value) => {
          setWindowConditionVisible(value);
          if (!value) {
            saveWindowCondition(null);
          }
        }}
      />
      <div ref={windowConditionRef}>
        {windowConditionVisible && (
          <TextInput
            initialValue={menus[selectedMenu].conditions?.windowName || ''}
            placeholder="e.g. /youtube|vimeo/i"
            onChange={(name) => saveWindowCondition(name)}
          />
        )}
      </div>
      <Checkbox
        label="Limit to Specific Screen Area"
        info="Show the menu only if the pointer is in a given area on the screen. In pixels, relative to the top left corner of your main display."
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
      <div ref={screenConditionRef} className={classes.screenCondition}>
        {screenConditionVisible &&
          [
            { value: screenMinX, setValue: setScreenMinX, label: 'Left' },
            { value: screenMaxX, setValue: setScreenMaxX, label: 'Right' },
            { value: screenMinY, setValue: setScreenMinY, label: 'Top' },
            { value: screenMaxY, setValue: setScreenMaxY, label: 'Bottom' },
          ].map(({ value, setValue, label }, index) => (
            <input
              key={index}
              value={value}
              type="number"
              onBlur={saveScreenCondition}
              placeholder={label}
              onChange={(event) => setValue(event.target.value)}
            />
          ))}
      </div>
    </>
  );
};
