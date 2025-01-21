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

import * as classes from './AboutDialog.module.scss';

const logo = require('../../../assets/icons/square-icon.svg');

interface IProps {
  visible: boolean;
  onClose: () => void;
}

export default (props: IProps) => {
  return (
    <Modal visible={props.visible} onClose={props.onClose} maxWidth={500}>
      <div className={classes.container}>
        <div className={classes.hero}>
          <img src={logo} width={128} />
          <p>
            I am creating Kando out of sheer passion. If you enjoy using it as much as I
            love creating it, you can{' '}
            <a target="_blank" href="https://ko-fi.com/schneegans">
              buy me a coffee
            </a>
            !
          </p>
          <p>- Simon</p>
        </div>
      </div>
    </Modal>
  );
};
