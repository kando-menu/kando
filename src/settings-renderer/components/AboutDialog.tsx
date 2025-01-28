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
import { TbExternalLink } from 'react-icons/tb';

import Swirl from './widgets/Swirl';
import Modal from './widgets/Modal';
import Button from './widgets/Button';

import * as classes from './AboutDialog.module.scss';

const logo = require('../../../assets/icons/square-icon.svg');

interface IProps {
  visible: boolean;
  onClose: () => void;
}

export default (props: IProps) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!props.visible) {
      return;
    }

    window.commonAPI.getVersion().then((version) => {
      if (ref.current) {
        ref.current.innerHTML = `${version.kandoVersion}<br />${version.electronVersion}<br />${version.nodeVersion}<br />${version.chromeVersion}`;
      }
    });
  });

  return (
    <Modal
      title="About Kando"
      visible={props.visible}
      onClose={props.onClose}
      maxWidth={500}>
      <div className={classes.container}>
        <img src={logo} width={128} />
        <div className={classes.hero}>
          <p>
            I am creating Kando out of sheer passion. If you enjoy using it as much as I
            love creating it, you can{' '}
            <a target="_blank" href="https://ko-fi.com/schneegans">
              buy me a coffee
            </a>
            !
          </p>
          <p>💖 Simon</p>
        </div>
        <Swirl marginTop={30} marginBottom={20} />
        <div className={classes.footer}>
          <div className={classes.versionInfo}>
            Kando Version:
            <br />
            Electron Version:
            <br />
            Node Version:
            <br />
            Chromium Version:
            <br />
          </div>
          <div ref={ref} className={classes.versionInfo}></div>
          <div className={classes.buttons}>
            <Button
              label="Check latest release"
              icon={<TbExternalLink />}
              tooltip="https://github.com/kando-menu/kando/releases"
              onClick={() =>
                window.open('https://github.com/kando-menu/kando/releases', '_blank')
              }
              block
            />
            <Button
              label="Read release notes"
              icon={<TbExternalLink />}
              tooltip="https://github.com/kando-menu/kando/blob/main/docs/changelog.md"
              block
              onClick={() =>
                window.open(
                  'https://github.com/kando-menu/kando/blob/main/docs/changelog.md',
                  '_blank'
                )
              }
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};