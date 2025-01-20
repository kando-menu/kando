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

import { WindowWithAPIs } from '../settings-window-api';
declare const window: WindowWithAPIs;

import * as classes from './App.module.scss';

import Sidebar from './Sidebar';
import Preview from './Preview';

export default () => {
  const [transparent, setTransparent] = React.useState(true);

  React.useEffect(() => {
    window.commonAPI.appSettings.getKey('transparentSettingsWindow').then(setTransparent);
    return window.commonAPI.appSettings.onChange(
      'transparentSettingsWindow',
      setTransparent
    );
  }, []);

  const containerClass = `${classes.container} ${transparent ? classes.transparent : ''}`;

  return (
    <div className={containerClass}>
      <Sidebar title={i18next.t('settings.title')} position="left" />
      <Preview />
      <Sidebar position="right" />
    </div>
  );
};
