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
import { PiSelection } from 'react-icons/pi';

import { Modal, Button } from '../common';

import * as classes from './ScreenAreaPicker.module.scss';

interface IProps {
  /** Function to call when a new area is selected. */
  onSelect: (minX: number, maxX: number, minY: number, maxY: number) => void;

  /** Function to call when the dialog should be closed. */
  onClose: () => void;

  /** Visibility of the modal. */
  visible: boolean;
}

export default (props: IProps) => {
  return (
    <Modal
      title="Pick a Screen Area"
      icon={<PiSelection />}
      visible={props.visible}
      onClose={props.onClose}
      maxWidth={300}>
      <Button
        label="Select"
        onClick={() => {
          props.onSelect(0, 0, 0, 0);
          props.onClose();
        }}
      />
      <Button
        label="Cancel"
        onClick={() => {
          props.onClose();
        }}
      />
    </Modal>
  );
};
