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

import Modal from './widgets/Modal';
import ManagedCheckbox from './widgets/ManagedCheckbox';
import ManagedSpinbutton from './widgets/ManagedSpinbutton';

interface IProps {
  visible: boolean;
  onClose: () => void;
}

export default (props: IProps) => {
  return (
    <Modal
      title="Menu Themes"
      visible={props.visible}
      onClose={props.onClose}
      maxWidth={800}>
      <ManagedCheckbox
        label={i18next.t('toolbar.menu-themes-tab.dark-mode')}
        info={i18next.t('toolbar.menu-themes-tab.system-mode-subheading')}
        settingsKey="enableDarkModeForMenuThemes"
      />
      <ManagedSpinbutton
        label="Menu Scale"
        info="The scale of the menu. Default is 1."
        settingsKey="zoomFactor"
        min={0.5}
        max={5}
        step={0.1}
      />
    </Modal>
  );
};