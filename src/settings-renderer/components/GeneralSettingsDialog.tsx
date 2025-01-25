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

import Modal from './widgets/Modal';
import Swirl from './widgets/Swirl';
import SettingsKeyCheckbox from './widgets/SettingsKeyCheckbox';
import SubSettingsKeyCheckbox from './widgets/SubSettingsKeyCheckbox';

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
        }}>
        <p>
          All settings of Kando are stored in a JSON file which you can also edit, share,
          or backup. Click{' '}
          <a ref={configLinkRef} target="_blank">
            here
          </a>{' '}
          to open the directory where the config.json file is stored.
        </p>

        <Swirl />

        <h1>App Behavior</h1>
        <SettingsKeyCheckbox
          label="Check for new versions"
          info="If enabled, Kando will show a notification when a new version is available."
          settingsKey="enableVersionCheck"
        />
        <SettingsKeyCheckbox
          label="Transparent settings window"
          info="Requires a restart to take full effect."
          settingsKey="transparentSettingsWindow"
        />

        <h1>Menu Behavior</h1>
        <SubSettingsKeyCheckbox
          label="Enable Marking Mode"
          info="With Marking Mode enabled, you can select items by dragging the mouse over them."
          settingsKey="menuOptions"
          subKey="enableMarkingMode"
        />
        <SubSettingsKeyCheckbox
          label="Enable Turbo Mode"
          info="With Turbo Mode enabled, you can perform gestures as long as you hold down a modifier key such as Shift or Ctrl."
          settingsKey="menuOptions"
          subKey="enableTurboMode"
        />
        <SubSettingsKeyCheckbox
          label="Right mouse button selects parent"
          info="If unchecked, the right mouse button will close the menu instead."
          settingsKey="menuOptions"
          subKey="rmbSelectsParent"
        />
      </div>
    </Modal>
  );
};
