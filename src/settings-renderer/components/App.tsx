//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { Tooltip } from 'react-tooltip';
import {
  TbSettingsFilled,
  TbInfoSquareRoundedFilled,
  TbPaletteFilled,
} from 'react-icons/tb';

import { useAppSetting } from '../state';

import AboutDialog from './AboutDialog';
import GeneralSettingsDialog from './GeneralSettingsDialog';
import MenuThemesDialog from './MenuThemesDialog';
import Button from './widgets/Button';
import Sidebar from './widgets/Sidebar';
import Preview from './Preview';
import Properties from './Properties';
import MenuList from './MenuList';
import CollectionList from './CollectionList';

import * as classes from './App.module.scss';

export default () => {
  const [transparent] = useAppSetting('transparentSettingsWindow');
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

  return (
    <>
      <div className={`${classes.container} ${transparent ? classes.transparent : ''}`}>
        <Sidebar position="left">
          <div className={classes.leftSidebar}>
            <CollectionList />
            <MenuList />
          </div>
        </Sidebar>
        <Preview headerButtons={headerButtons} />
        <Sidebar position="right">
          <Properties />
        </Sidebar>
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
