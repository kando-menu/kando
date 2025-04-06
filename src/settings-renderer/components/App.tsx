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
import MouseTrap from 'mousetrap';
import classNames from 'classnames/bind';

import { useAppSetting, useMenuSettings } from '../state';

import AboutDialog from './dialogs/AboutDialog';
import GeneralSettingsDialog from './dialogs/GeneralSettingsDialog';
import MenuThemesDialog from './dialogs/MenuThemesDialog';

import Sidebar from './common/Sidebar';
import MenuPreview from './menu-preview/MenuPreview';
import PreviewHeader from './menu-preview/PreviewHeader';
import PreviewFooter from './menu-preview/PreviewFooter';
import Properties from './menu-properties/Properties';
import MenuList from './menu-list/MenuList';
import CollectionList from './menu-list/CollectionList';

import * as classes from './App.module.scss';
const cx = classNames.bind(classes);

export default () => {
  const [settingsWindowColorScheme] = useAppSetting('settingsWindowColorScheme');
  const [settingsWindowFlavor] = useAppSetting('settingsWindowFlavor');

  // Bind global undo/redo shortcuts.
  React.useEffect(() => {
    MouseTrap.bind('mod+z', () => useMenuSettings.temporal.getState().undo());
    MouseTrap.bind('mod+y', () => useMenuSettings.temporal.getState().redo());

    return () => {
      MouseTrap.unbind('mod+z');
      MouseTrap.unbind('mod+y');
    };
  }, []);

  return (
    <>
      <div
        id="root-container"
        className={cx({
          container: true,
          systemColors: settingsWindowColorScheme === 'system',
          lightColors: settingsWindowColorScheme === 'light',
          darkColors: settingsWindowColorScheme === 'dark',
        })}>
        <Sidebar position="left" mainDirection="row">
          <CollectionList />
          <MenuList />
        </Sidebar>
        <div
          className={cx({
            centerArea: true,
            transparentLightFlavor: settingsWindowFlavor === 'transparent-light',
            transparentDarkFlavor: settingsWindowFlavor === 'transparent-dark',
            transparentSystemFlavor: settingsWindowFlavor === 'transparent-system',
            sakuraLightFlavor: settingsWindowFlavor === 'sakura-light',
            sakuraDarkFlavor: settingsWindowFlavor === 'sakura-dark',
            sakuraSystemFlavor: settingsWindowFlavor === 'sakura-system',
          })}>
          <PreviewHeader />
          <MenuPreview />
          <PreviewFooter />
        </div>
        <Sidebar position="right" mainDirection="column">
          <Properties />
        </Sidebar>
        <GeneralSettingsDialog />
        <AboutDialog />
        <MenuThemesDialog />
      </div>
      <Tooltip
        id="main-tooltip"
        delayShow={500}
        openEvents={{
          click: true,
          mouseover: true,
          focus: true,
        }}
      />
      <Tooltip
        id="click-to-show-tooltip"
        delayShow={0}
        openEvents={{ click: true }}
        closeEvents={{ click: true }}
        globalCloseEvents={{ escape: true, clickOutsideAnchor: true }}
      />
    </>
  );
};
