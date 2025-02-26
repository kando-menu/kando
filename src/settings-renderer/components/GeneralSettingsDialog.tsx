//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from '../settings-window-api';
declare const window: WindowWithAPIs;

import React from 'react';

import { TbReload, TbCode, TbSettingsFilled } from 'react-icons/tb';

import Button from './widgets/Button';
import AppSettingsCheckbox from './AppSettingsCheckbox';
import AppSettingsDropdown from './AppSettingsDropdown';
import AppSettingsSpinbutton from './AppSettingsSpinbutton';
import Modal from './widgets/Modal';
import Note from './widgets/Note';
import Scrollbox from './widgets/Scrollbox';
import Swirl from './widgets/Swirl';

interface IProps {
  visible: boolean;
  onClose: () => void;
}

export default (props: IProps) => {
  // We make sure that the spinbuttons have a consistent width.
  const spinbuttonWidth = 60;

  return (
    <Modal
      title="General Settings"
      icon={<TbSettingsFilled />}
      visible={props.visible}
      onClose={props.onClose}
      maxWidth={500}
      paddingTop={0}
      paddingBottom={0}
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
          <AppSettingsCheckbox
            label="Check for new versions"
            info="If enabled, Kando will show a notification when a new version is available."
            settingsKey="enableVersionCheck"
          />
          <AppSettingsCheckbox
            label="Transparent settings window"
            info="Reopen the settings window to fully apply the effect."
            settingsKey="transparentSettingsWindow"
          />
          <AppSettingsCheckbox
            label="Hide settings button"
            info="The button in the screen corner that opens the settings will still be there, but invisible."
            settingsKey="hideSettingsButton"
          />
          <AppSettingsDropdown
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
          <AppSettingsCheckbox
            label="Enable Marking Mode"
            info="With Marking Mode enabled, you can select items by dragging the mouse over them."
            settingsKey="enableMarkingMode"
          />
          <AppSettingsCheckbox
            label="Enable Turbo Mode"
            info="With Turbo Mode enabled, you can perform gestures as long as you hold down a modifier key such as Shift or Ctrl."
            settingsKey="enableTurboMode"
          />
          <AppSettingsCheckbox
            label="Require click for Hover Mode selections"
            info="If unchecked, items will be selected immediately when the mouse is moved over them for menus using Hover Mode."
            settingsKey="hoverModeNeedsConfirmation"
          />
          <AppSettingsCheckbox
            label="Right mouse button selects parent"
            info="If unchecked, the right mouse button will close the menu instead."
            settingsKey="rmbSelectsParent"
          />

          <h1>Advanced Menu Options</h1>
          <Note marginTop={-10}>
            Usually, you can leave these settings at their default values.
          </Note>
          <AppSettingsSpinbutton
            label="Center click zone radius"
            info="The size of the area in the middle of the menu which will either close or navigate a level up when clicked. Default is 50px."
            settingsKey="centerDeadZone"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <AppSettingsSpinbutton
            label="Minimum submenu distance"
            info="If a submenu is opened close to the parent menu, the parent will be moved away to this distance. Default is 150px."
            settingsKey="minParentDistance"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <AppSettingsSpinbutton
            label="Movement threshold"
            info="Smaller mouse movements will not be considered in Marking or Turbo mode. Default is 15px."
            settingsKey="dragThreshold"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={10}
          />
          <AppSettingsSpinbutton
            label="Minimum Gesture Length"
            info="Straight movements must be at least this long to trigger a selection. Default is 150px."
            settingsKey="gestureMinStrokeLength"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <AppSettingsSpinbutton
            label="Minimum Gesture Angle"
            info="Smaller deviations from straight movements will not trigger selections. Default is 20°."
            settingsKey="gestureMinStrokeAngle"
            width={spinbuttonWidth}
            min={0}
            max={30}
            step={1}
          />
          <AppSettingsSpinbutton
            label="Minimum Gesture Angle"
            info="Smaller movements will not be considered in the gesture detection. Default is 10px."
            settingsKey="gestureJitterThreshold"
            width={spinbuttonWidth}
            min={0}
            max={50}
            step={1}
          />
          <AppSettingsSpinbutton
            label="Gesture Pause Timeout"
            info="Stop your gesture for this long to trigger a selection. Default is 100ms."
            settingsKey="gesturePauseTimeout"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <AppSettingsSpinbutton
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
          <Button
            label="Show developer tools"
            icon={<TbCode />}
            onClick={() => {
              window.settingsAPI.showDevTools();
            }}
          />
        </div>
      </Scrollbox>
    </Modal>
  );
};
