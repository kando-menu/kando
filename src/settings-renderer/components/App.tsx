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
import { Tooltip } from 'react-tooltip';
import i18next from 'i18next';

import { RiSettings4Fill, RiInformation2Fill, RiPaletteFill } from 'react-icons/ri';

import * as classes from './App.module.scss';

import GeneralSettings from './GeneralSettings';
import Button from './Button';
import Sidebar from './Sidebar';
import Preview from './Preview';
import Properties from './Properties';
import MenuList from './MenuList';
import Headerbar from './Headerbar';

import logo from '../../../assets/icons/trayColor.png';

export default () => {
  const [transparent, setTransparent] = React.useState(true);

  React.useEffect(() => {
    window.commonAPI.appSettings.getKey('transparentSettingsWindow').then(setTransparent);
    return window.commonAPI.appSettings.onChange(
      'transparentSettingsWindow',
      setTransparent
    );
  }, []);

  const [settingsVisible, setSettingsVisible] = React.useState(false);

  // Hide settings on escape
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (setSettingsVisible && event.key === 'Escape') {
        setSettingsVisible(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const headerButtons = (
    <>
      <Button
        tooltip="About Kando"
        icon={<RiInformation2Fill />}
        onClick={() => console.log('About button clicked')}
        variant="flat"
        grouped
      />
      <Button
        tooltip="Menu Themes"
        icon={<RiPaletteFill />}
        onClick={() => console.log('Themes button clicked')}
        variant="flat"
        grouped
      />
      <Button
        tooltip="General Settings"
        icon={<RiSettings4Fill />}
        onClick={() => setSettingsVisible(true)}
        variant="flat"
        grouped
      />
    </>
  );

  const leftHeaderbar = (
    <Headerbar
      left={<img src={logo} width={20} style={{ verticalAlign: 'middle' }} />}
      center={i18next.t('settings.title')}
      right={headerButtons}
      paddingLeft={10}
      paddingRight={5}
    />
  );
  const rightHeaderbar = <Headerbar />;

  return (
    <>
      <div className={`${classes.container} ${transparent ? classes.transparent : ''}`}>
        <Tooltip id="main-tooltip" delayShow={200} />
        <Sidebar position="left" header={leftHeaderbar} content={<MenuList />} />
        <Preview />
        <Sidebar position="right" header={rightHeaderbar} content={<Properties />} />
        <GeneralSettings
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
        />
      </div>
    </>
  );
};
