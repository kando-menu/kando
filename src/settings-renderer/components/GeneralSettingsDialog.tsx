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

import { TbReload, TbCode } from 'react-icons/tb';

import Button from './widgets/Button';
import Modal from './widgets/Modal';
import Swirl from './widgets/Swirl';
import Note from './widgets/Note';
import ManagedSpinbutton from './widgets/ManagedSpinbutton';
import ManagedCheckbox from './widgets/ManagedCheckbox';
import ManagedDropdown from './widgets/ManagedDropdown';

interface IProps {
  visible: boolean;
  onClose: () => void;
}

export default (props: IProps) => {
  const configLinkRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    if (!props.visible) {
      return;
    }

    window.settingsAPI.getConfigDirectory().then((dir) => {
      if (configLinkRef.current) {
        configLinkRef.current.href = 'file://' + dir;
      }
    });
  });

  return (
    <Modal
      title="General Settings"
      visible={props.visible}
      onClose={props.onClose}
      maxWidth={500}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: 5,
        }}>
        <Note marginTop={20} center>
          All settings of Kando are stored in a JSON file which you can also edit, share,
          or backup. Click{' '}
          <a ref={configLinkRef} target="_blank">
            here
          </a>{' '}
          to open the directory where the config.json file is stored.
        </Note>

        <Swirl marginTop={10} marginBottom={20} />

        <h1>App Behavior</h1>
        <ManagedCheckbox
          label="Check for new versions"
          info="If enabled, Kando will show a notification when a new version is available."
          settingsKey="enableVersionCheck"
        />
        <ManagedCheckbox
          label="Transparent settings window"
          info="Reopen the settings window to fully apply the effect."
          settingsKey="transparentSettingsWindow"
        />
        <ManagedCheckbox
          label="Hide settings button"
          info="The button in the screen corner that opens the settings will still be there, but invisible."
          settingsKey="hideSettingsButton"
        />
        <ManagedDropdown
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
        <ManagedCheckbox
          label="Enable Marking Mode"
          info="With Marking Mode enabled, you can select items by dragging the mouse over them."
          settingsKey="enableMarkingMode"
        />
        <ManagedCheckbox
          label="Enable Turbo Mode"
          info="With Turbo Mode enabled, you can perform gestures as long as you hold down a modifier key such as Shift or Ctrl."
          settingsKey="enableTurboMode"
        />
        <ManagedCheckbox
          label="Right mouse button selects parent"
          info="If unchecked, the right mouse button will close the menu instead."
          settingsKey="rmbSelectsParent"
        />
        <ManagedSpinbutton
          label="Fade-in duration"
          info="The time in milliseconds for the fade-in animation of the menu. Set to zero to disable the animation. Default is 150."
          settingsKey="fadeInDuration"
          min={0}
          max={500}
          step={10}
        />
        <ManagedSpinbutton
          label="Fade-out duration"
          info="The time in milliseconds for the fade-out animation of the menu. Some actions are only executed after this animation is finished, so setting this to zero makes them execute faster. Default is 200."
          settingsKey="fadeOutDuration"
          min={0}
          max={500}
          step={10}
        />

        <h1>Advanced Menu Options</h1>
        <Note marginTop={-10}>
          Usually, you can leave these settings at their default values.
        </Note>

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
    </Modal>
  );
};
