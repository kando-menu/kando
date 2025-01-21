//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { RiInformation2Fill } from 'react-icons/ri';

import Modal from './Modal';

interface IProps {
  visible: boolean;
  onClose: () => void;
}

export default (props: IProps) => {
  return (
    <Modal
      visible={props.visible}
      onClose={props.onClose}
      icon={<RiInformation2Fill />}
      title="About Kando">
      About
    </Modal>
  );
};
