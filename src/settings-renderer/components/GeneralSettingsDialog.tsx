//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import Modal from './Modal';
import Swirl from './Swirl';

interface IProps {
  visible: boolean;
  onClose: () => void;
}

export default (props: IProps) => {
  return (
    <Modal visible={props.visible} onClose={props.onClose} maxWidth={600}>
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
          <a href="file:///home/simon" target="_blank">
            here
          </a>{' '}
          to open the directory where the config.json file is stored.
        </p>
        <Swirl />
      </div>
    </Modal>
  );
};
