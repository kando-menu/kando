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
import { TbExternalLink, TbHeartFilled } from 'react-icons/tb';

import { useAppState } from '../../state';
import { Swirl, Modal, Button } from '../common';

import * as classes from './AboutDialog.module.scss';

const logo = require('../../../../assets/icons/square-icon.svg');

/**
 * This dialog shows information about Kando, including the version number and links to
 * the release notes and the GitHub repository. It also includes a donation button.
 */
export default () => {
  const aboutDialogVisible = useAppState((state) => state.aboutDialogVisible);
  const setAboutDialogVisible = useAppState((state) => state.setAboutDialogVisible);

  const version = useAppState((state) => state.versionInfo);
  const backend = useAppState((state) => state.backendInfo);

  return (
    <Modal
      title="About Kando"
      icon={<TbHeartFilled />}
      visible={aboutDialogVisible}
      onClose={() => setAboutDialogVisible(false)}
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
        <Swirl variant="3" marginTop={30} marginBottom={20} width={350} />
        <div className={classes.footer}>
          <div className={classes.versionInfo}>
            Kando Version:
            <br />
            Kando Backend:
            <br />
            License:
            <br />
            Electron Version:
            <br />
            Node Version:
            <br />
            Chromium Version:
            <br />
          </div>
          <div className={classes.versionInfo}>
            {version.kandoVersion}
            <br />
            {backend.name}
            <br />
            MIT
            <br />
            {version.electronVersion}
            <br />
            {version.nodeVersion}
            <br />
            {version.chromeVersion}
          </div>
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
            <Button
              label="Source code"
              icon={<TbExternalLink />}
              tooltip="https://github.com/kando-menu/kando"
              onClick={() => window.open('https://github.com/kando-menu/kando', '_blank')}
              block
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
