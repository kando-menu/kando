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
import i18next from 'i18next';

import { RiSettings4Fill, RiInformation2Fill, RiPaletteFill } from 'react-icons/ri';

import * as classes from './App.module.scss';

import Button from './Button';
import Sidebar from './Sidebar';
import Preview from './Preview';
import Properties from './Properties';
import MenuList from './MenuList';
import Headerbar from './Headerbar';

export default () => {
  const [transparent, setTransparent] = React.useState(true);

  React.useEffect(() => {
    window.commonAPI.appSettings.getKey('transparentSettingsWindow').then(setTransparent);
    return window.commonAPI.appSettings.onChange(
      'transparentSettingsWindow',
      setTransparent
    );
  }, []);

  const headerButtons = (
    <>
      <Button
        onClick={() => console.log('About button clicked')}
        icon={<RiInformation2Fill />}
      />
      <Button
        onClick={() => console.log('Themes button clicked')}
        icon={<RiPaletteFill />}
      />
      <Button
        onClick={() => console.log('Settings button clicked')}
        icon={<RiSettings4Fill />}
      />
    </>
  );

  const leftHeaderbar = (
    <Headerbar left={i18next.t('settings.title')} right={headerButtons} />
  );
  const rightHeaderbar = <Headerbar />;

  return (
    <div className={`${classes.container} ${transparent ? classes.transparent : ''}`}>
      <Sidebar position="left" header={leftHeaderbar} content={<MenuList />} />
      <Preview />
      <Sidebar position="right" header={rightHeaderbar} content={<Properties />} />
    </div>
  );
};
