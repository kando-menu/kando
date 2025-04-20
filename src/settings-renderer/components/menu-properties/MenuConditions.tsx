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

import { useAppState, useMenuSettings } from '../../state';
import { TextInput, Checkbox, Note } from '../common';

/** This component shows the conditions for displaying the currently selected menu. */
export default () => {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const editMenu = useMenuSettings((state) => state.editMenu);

  const [appConditionVisible, setAppConditionVisible] = React.useState(false);
  const [windowConditionVisible, setWindowConditionVisible] = React.useState(false);
  const [screenConditionVisible, setScreenConditionVisible] = React.useState(false);

  // Initialize the conditions for the selected menu.
  React.useEffect(() => {
    setAppConditionVisible(!!menus[selectedMenu].conditions?.appName);
    setWindowConditionVisible(!!menus[selectedMenu].conditions?.windowName);
    setScreenConditionVisible(!!menus[selectedMenu].conditions?.screenArea);
  }, [selectedMenu, menus]);

  // This is used to animate the height condition inputs.
  const [appConditionRef] = useAutoAnimate({ duration: 250 });
  const [windowConditionRef] = useAutoAnimate({ duration: 250 });
  const [screenConditionRef] = useAutoAnimate({ duration: 250 });

  const setAppCondition = (value: string) => {
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
            setAppCondition(null);
          }
        }}
      />
      <div ref={appConditionRef}>
        {appConditionVisible && (
          <TextInput
            initialValue={menus[selectedMenu].conditions?.appName || ''}
            placeholder="e.g. /firefox|chrome/i"
            onChange={(name) => setAppCondition(name)}
          />
        )}
      </div>
      <Checkbox
        label="Limit to Specific Window Titles"
        info="Show the menu only if the focused window's title contains a given text. This supports regular expressions like /youtube|vimeo/i."
      />

      <Checkbox
        label="Limit to Specific Screen Area"
        info="Show the menu only if the pointer is in a given area on the screen. In pixels, relative to the top left corner of your main display."
      />
    </>
  );
};
