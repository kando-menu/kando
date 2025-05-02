//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from '../../settings-window-api';
declare const window: WindowWithAPIs;

import React from 'react';

import { TbReload, TbCode, TbSettingsFilled } from 'react-icons/tb';

import { useAppState } from '../../state';

import {
  Button,
  SettingsCheckbox,
  SettingsDropdown,
  SettingsSpinbutton,
  Modal,
  Note,
  Scrollbox,
  Swirl,
} from '../common';

/** This dialog allows the user to configure some general settings of Kando. */
export default () => {
  const settingsDialogVisible = useAppState((state) => state.settingsDialogVisible);
  const setSettingsDialogVisible = useAppState((state) => state.setSettingsDialogVisible);
  const soundThemes = useAppState((state) => state.soundThemes);

  const soundThemeOptions = soundThemes.map((theme) => ({
    value: theme.id,
    label: theme.name,
  }));
  soundThemeOptions.unshift({
    value: 'none',
    label: 'None',
  });

  // We make sure that some widgets have a consistent width.
  const spinbuttonWidth = 60;

  return (
    <Modal
      title="General Settings"
      icon={<TbSettingsFilled />}
      visible={settingsDialogVisible}
      onClose={() => setSettingsDialogVisible(false)}
      maxWidth={500}
      paddingTop={0}
      paddingBottom={5}
      paddingLeft={5}
      paddingRight={5}>
      <Scrollbox maxHeight={'min(80vh, 600px)'}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: 5,
          }}>
          <Note center>
            All settings of Kando are stored in a JSON file which you can also edit,
            share, or backup. Click{' '}
            <a
              onClick={() =>
                window.settingsAPI.getConfigDirectory().then((dir) => {
                  window.open('file://' + dir, '_blank');
                })
              }
              style={{ cursor: 'pointer' }}>
              here
            </a>{' '}
            to open the directory where the config.json file is stored.
          </Note>

          <Swirl variant="3" marginTop={10} width={350} marginBottom={20} />

          <h1>App Behavior</h1>
          <SettingsCheckbox
            label="Check for new versions"
            info="If enabled, Kando will show a notification when a new version is available."
            settingsKey="enableVersionCheck"
          />
          <SettingsCheckbox
            label="Invisible settings button"
            info="You can still use the button, it will appear when you move the mouse over it."
            settingsKey="hideSettingsButton"
          />
          <SettingsDropdown
            label="Settings button position"
            info="Choose the screen corner where the settings button will be shown."
            settingsKey="settingsButtonPosition"
            options={[
              { value: 'top-left', label: 'Top Left' },
              { value: 'top-right', label: 'Top Right' },
              { value: 'bottom-left', label: 'Bottom Left' },
              { value: 'bottom-right', label: 'Bottom Right' },
            ]}
          />
          <SettingsDropdown
            label="Settings window color scheme"
            info="If you choose 'system', the settings window will use the same color scheme as your operating system."
            settingsKey="settingsWindowColorScheme"
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <SettingsDropdown
            label="Settings window flavor"
            info="If you choose a transparent flavor, you will have to restart the settings window to apply the effect."
            settingsKey="settingsWindowFlavor"
            options={[
              { value: 'transparent-light', label: 'Transparent Light' },
              { value: 'transparent-dark', label: 'Transparent Dark' },
              { value: 'transparent-system', label: 'Transparent System' },
              { value: 'sakura-light', label: 'Sakura Light' },
              { value: 'sakura-dark', label: 'Sakura Dark' },
              { value: 'sakura-system', label: 'Sakura System' },
            ]}
          />
          <SettingsDropdown
            label="Tray icon flavor"
            info="You can also choose to hide the tray icon completely."
            settingsKey="trayIconFlavor"
            options={[
              { value: 'none', label: 'Hidden' },
              { value: 'color', label: 'Color' },
              { value: 'white', label: 'White' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'black', label: 'Black' },
            ]}
          />

          <h1>Menu Behavior</h1>
          <SettingsCheckbox
            label="Enable Marking Mode"
            info="With Marking Mode enabled, you can select items by dragging the mouse over them."
            settingsKey="enableMarkingMode"
          />
          <SettingsCheckbox
            label="Enable Turbo Mode"
            info="With Turbo Mode enabled, you can perform gestures as long as you hold down a modifier key such as Shift or Ctrl."
            settingsKey="enableTurboMode"
          />
          <SettingsCheckbox
            label="Move pointer to the menu center"
            info="If checked, the mouse pointer will be moved to the center of a menu or submenu when necessary. This could be the case if a menu is opened too close to the edge of the screen or if a menu is opened in Centered Mode."
            settingsKey="warpMouse"
          />
          <SettingsCheckbox
            label="Require click for Hover Mode selections"
            info="If unchecked, items will be selected immediately when the mouse is moved over them for menus using Hover Mode."
            settingsKey="hoverModeNeedsConfirmation"
          />
          <SettingsCheckbox
            label="Right mouse button selects parent"
            info="If unchecked, the right mouse button will close the menu instead."
            settingsKey="rmbSelectsParent"
          />
          <SettingsCheckbox
            label="Enable gamepad support"
            info="If checked, you can use a connected gamepad to control the menu."
            settingsKey="enableGamepad"
          />

          <h1>Menu Sounds</h1>
          <Note marginTop={-5}>
            Learn how to add new sound themes to Kando{' '}
            <a href="https://kando.menu/sound-themes/" target="_blank">
              here
            </a>
            !
          </Note>
          <SettingsDropdown
            label="Sound theme"
            info="A sound theme is a collection of sounds that are played when you interact with the menu."
            settingsKey="soundTheme"
            options={soundThemeOptions}
          />
          <SettingsSpinbutton
            label="Volume"
            info="The overall volume of the sound theme. Default is 0.5."
            settingsKey="soundVolume"
            width={spinbuttonWidth}
            min={0}
            max={1}
            step={0.01}
          />

          <h1>Advanced Menu Options</h1>
          <Note marginTop={-5}>
            Usually, you can leave these settings at their default values.
          </Note>
          <SettingsSpinbutton
            label="Center click zone radius"
            info="The size of the area in the middle of the menu which will either close or navigate a level up when clicked. Default is 50px."
            settingsKey="centerDeadZone"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <SettingsSpinbutton
            label="Minimum submenu distance"
            info="If a submenu is opened close to the parent menu, the parent will be moved away to this distance. Default is 150px."
            settingsKey="minParentDistance"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <SettingsSpinbutton
            label="Movement threshold"
            info="Smaller mouse movements will not be considered in Marking or Turbo mode. Default is 15px."
            settingsKey="dragThreshold"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={10}
          />
          <SettingsSpinbutton
            label="Minimum Gesture Length"
            info="Straight movements must be at least this long to trigger a selection. Default is 150px."
            settingsKey="gestureMinStrokeLength"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <SettingsSpinbutton
            label="Minimum Gesture Angle"
            info="Smaller deviations from straight movements will not trigger selections. Default is 20°."
            settingsKey="gestureMinStrokeAngle"
            width={spinbuttonWidth}
            min={0}
            max={30}
            step={1}
          />
          <SettingsSpinbutton
            label="Minimum Gesture Angle"
            info="Smaller movements will not be considered in the gesture detection. Default is 10px."
            settingsKey="gestureJitterThreshold"
            width={spinbuttonWidth}
            min={0}
            max={50}
            step={1}
          />
          <SettingsSpinbutton
            label="Gesture Pause Timeout"
            info="Stop your gesture for this long to trigger a selection. Default is 100ms."
            settingsKey="gesturePauseTimeout"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <SettingsSpinbutton
            label="Fixed Stroke Length"
            info="Usually, items are selected when you stop the movement or make a turn. If you set this to a value greater than 0, this behavior will change: Now items will only be selected if you dragged an item this far away from the center. Default is 0px."
            settingsKey="fixedStrokeLength"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={10}
          />

          <h1>Developer Options</h1>
          <div style={{ display: 'flex' }}>
            <Button
              label="Reload menu theme"
              icon={<TbReload />}
              grouped
              grow
              onClick={() => {
                window.settingsAPI.reloadMenuTheme();
              }}
            />
            <Button
              label="Reload sound theme"
              icon={<TbReload />}
              grouped
              grow
              onClick={() => {
                window.settingsAPI.reloadSoundTheme();
              }}
            />
          </div>
          <div style={{ display: 'flex' }}>
            <Button
              label="Show menu dev-tools"
              icon={<TbCode />}
              grouped
              grow
              onClick={() => {
                window.settingsAPI.showDevTools('menu-window');
              }}
            />
            <Button
              label="Show settings dev-tools"
              icon={<TbCode />}
              grouped
              grow
              onClick={() => {
                window.settingsAPI.showDevTools('settings-window');
              }}
            />
          </div>
        </div>
      </Scrollbox>
    </Modal>
  );
};
