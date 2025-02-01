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
import {
  TbSettingsFilled,
  TbInfoSquareRoundedFilled,
  TbPaletteFilled,
} from 'react-icons/tb';

import AboutDialog from './AboutDialog';
import GeneralSettingsDialog from './GeneralSettingsDialog';
import MenuThemesDialog from './MenuThemesDialog';
import Button from './widgets/Button';
import Sidebar from './widgets/Sidebar';
import Preview from './Preview';
import Properties from './Properties';
import MenuList from './MenuList';
import Headerbar from './widgets/Headerbar';

import * as classes from './App.module.scss';

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
  const [aboutVisible, setAboutVisible] = React.useState(false);
  const [themesVisible, setThemesVisible] = React.useState(false);

  // Hide settings on escape
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (settingsVisible) {
          setSettingsVisible(false);
        }
        if (aboutVisible) {
          setAboutVisible(false);
        }
        if (themesVisible) {
          setThemesVisible(false);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const headerButtons = (
    <>
      <Button
        tooltip="About Kando"
        icon={<TbInfoSquareRoundedFilled />}
        onClick={() => setAboutVisible(true)}
        variant="flat"
        grouped
      />
      <Button
        tooltip="Menu Themes"
        icon={<TbPaletteFilled />}
        onClick={() => setThemesVisible(true)}
        variant="flat"
        grouped
      />
      <Button
        tooltip="General Settings"
        icon={<TbSettingsFilled />}
        onClick={() => setSettingsVisible(true)}
        variant="flat"
        grouped
      />
    </>
  );

  const leftHeaderbar = <Headerbar paddingLeft={10} paddingRight={5} />;
  const centerHeaderbar = <Headerbar center={headerButtons} transparent />;
  const rightHeaderbar = <Headerbar />;

  return (
    <>
      <div className={`${classes.container} ${transparent ? classes.transparent : ''}`}>
        <Sidebar position="left" header={leftHeaderbar} content={<MenuList />} />
        <Preview header={centerHeaderbar} />
        <Sidebar position="right" header={rightHeaderbar} content={<Properties />} />
        <GeneralSettingsDialog
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
        />
        <AboutDialog visible={aboutVisible} onClose={() => setAboutVisible(false)} />
        <MenuThemesDialog
          visible={themesVisible}
          onClose={() => setThemesVisible(false)}
        />
      </div>
      <Tooltip id="main-tooltip" delayShow={500} />
    </>
  );
};
