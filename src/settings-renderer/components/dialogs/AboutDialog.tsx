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
import i18next from 'i18next';
import { TbExternalLink, TbHeartFilled } from 'react-icons/tb';

import { useAppState } from '../../state';
import { Swirl, Modal, Button, Note } from '../common';

import * as classes from './AboutDialog.module.scss';

const logo = require('../../../../assets/icons/square-icon.svg');

/**
 * This dialog shows information about Kando, including the version number and links to
 * the release notes and the GitHub repository. It also includes a donation button.
 */
export default function AboutDialog() {
  const aboutDialogVisible = useAppState((state) => state.aboutDialogVisible);
  const setAboutDialogVisible = useAppState((state) => state.setAboutDialogVisible);

  const version = useAppState((state) => state.versionInfo);
  const backend = useAppState((state) => state.backendInfo);

  return (
    <Modal
      title={i18next.t('settings.about-dialog.title')}
      icon={<TbHeartFilled />}
      visible={aboutDialogVisible}
      onClose={() => setAboutDialogVisible(false)}
      maxWidth={500}>
      <div className={classes.container}>
        <img src={logo} width={128} />
        <Note
          style="big"
          markdown
          center
          marginTop={10}
          marginLeft={'10%'}
          marginRight={'10%'}>
          {i18next.t('settings.about-dialog.message', {
            link: 'https://ko-fi.com/schneegans',
          })}
        </Note>
        <Swirl variant="2" marginTop={30} marginBottom={20} width={350} />
        <div className={classes.footer}>
          <div className={classes.versionInfo}>
            {`${i18next.t('settings.about-dialog.kando-version')}:`}
            <br />
            {`${i18next.t('settings.about-dialog.kando-backend')}:`}
            <br />
            {`${i18next.t('settings.about-dialog.electron-version')}:`}
            <br />
            {`${i18next.t('settings.about-dialog.chrome-version')}:`}
            <br />
          </div>
          <div className={classes.versionInfo}>
            {version.kandoVersion}
            <br />
            {backend.name}
            <br />
            {version.electronVersion}
            <br />
            {version.chromeVersion}
          </div>
          <div className={classes.buttons}>
            <Button
              label={i18next.t('settings.about-dialog.check-latest-release')}
              icon={<TbExternalLink />}
              tooltip="https://github.com/kando-menu/kando/releases"
              onClick={() =>
                window.open('https://github.com/kando-menu/kando/releases', '_blank')
              }
              block
            />
            <Button
              label={i18next.t('settings.about-dialog.read-release-notes')}
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
}
