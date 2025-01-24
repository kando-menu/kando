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
import Checkbox from './widgets/Checkbox';

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
    <Modal visible={props.visible} onClose={props.onClose} maxWidth={500}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'center',
          margin: '0 20px 20px 20px',
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
        <Checkbox label="Transparent Settings Window" info="Make ofoo" />
      </div>
    </Modal>
  );
};
