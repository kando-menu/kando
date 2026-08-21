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
import MouseTrap from 'mousetrap';
import classNames from 'classnames/bind';

import type { SettingsWindowSidebarWidths } from '../../common';
import { useAppState, useGeneralSetting, useMenuSettings } from '../state';
import {
  AboutDialog,
  AchievementsDialog,
  GeneralSettingsDialog,
  MenuThemesDialog,
  IntroDialog,
} from './dialogs';
import { MenuList, CollectionList } from './menu-list';
import { MenuPreview, PreviewHeader, PreviewFooter } from './menu-preview';
import { Properties } from './menu-properties';
import { Note, Sidebar } from './common';

import * as classes from './App.module.scss';
const cx = classNames.bind(classes);

/**
 * This is the main component of the settings dialog. It manages the layout of the
 * different components: the menu list on the left, the menu preview in the center, and
 * the properties on the right. It also handles global shortcuts for undo and redo, and
 * sets the color scheme of the body element based on the user's settings.
 */
export default function App() {
  const [settingsWindowColorScheme] = useGeneralSetting('settingsWindowColorScheme');
  const [settingsWindowFlavor] = useGeneralSetting('settingsWindowFlavor');
  const [sidebarWidths, setSidebarWidths] = React.useState<SettingsWindowSidebarWidths>();
  const backend = useAppState((state) => state.backendInfo);
  const settingsWindowBanner = backend?.settingsWindowBanner;

  // Bind global undo/redo shortcuts.
  React.useEffect(() => {
    MouseTrap.bind('mod+z', () => useMenuSettings.temporal.getState().undo());
    MouseTrap.bind('mod+y', () => useMenuSettings.temporal.getState().redo());

    return () => {
      MouseTrap.unbind('mod+z');
      MouseTrap.unbind('mod+y');
    };
  }, []);

  // Set the global color scheme to the body element.
  React.useEffect(() => {
    const body = document.body;

    if (settingsWindowColorScheme === 'system') {
      body.classList.add('systemColors');
    }
    if (settingsWindowColorScheme === 'light') {
      body.classList.add('lightColors');
    }
    if (settingsWindowColorScheme === 'dark') {
      body.classList.add('darkColors');
    }
    return () => {
      body.classList.remove('systemColors');
      body.classList.remove('lightColors');
      body.classList.remove('darkColors');
    };
  }, [settingsWindowColorScheme]);

  // Restore the sidebar widths before notifying the main process that the window can be
  // displayed. This prevents the default widths from flashing briefly during startup.
  React.useEffect(() => {
    let active = true;

    void window.settingsAPI
      .getSidebarWidths()
      .catch((error) => {
        console.error('Failed to load settings window sidebar widths:', error);
        return {};
      })
      .then((widths) => {
        if (active) {
          setSidebarWidths(widths);
          window.settingsAPI.settingsWindowReady();
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const onLeftSidebarWidthChanged = React.useCallback((width: number) => {
    window.settingsAPI.setSidebarWidth('left', width);
  }, []);

  const onRightSidebarWidthChanged = React.useCallback((width: number) => {
    window.settingsAPI.setSidebarWidth('right', width);
  }, []);

  if (sidebarWidths === undefined) {
    return null;
  }

  return (
    <>
      <div
        className={cx({
          outerContainer: true,
          transparentLightFlavor: settingsWindowFlavor === 'transparent-light',
          transparentDarkFlavor: settingsWindowFlavor === 'transparent-dark',
          transparentSystemFlavor: settingsWindowFlavor === 'transparent-system',
          sakuraLightFlavor: settingsWindowFlavor === 'sakura-light',
          sakuraDarkFlavor: settingsWindowFlavor === 'sakura-dark',
          sakuraSystemFlavor: settingsWindowFlavor === 'sakura-system',
        })}>
        <div
          className={cx({
            innerContainer: true,
          })}>
          <Sidebar
            initialWidth={sidebarWidths.left}
            mainDirection="row"
            position="left"
            onWidthChanged={onLeftSidebarWidthChanged}>
            <CollectionList />
            <MenuList />
          </Sidebar>
          <div
            className={cx({
              centerArea: true,
            })}>
            <PreviewHeader />
            <MenuPreview />
            <PreviewFooter />
          </div>
          <Sidebar
            initialWidth={sidebarWidths.right}
            mainDirection="column"
            position="right"
            onWidthChanged={onRightSidebarWidthChanged}>
            <Properties />
          </Sidebar>
        </div>
        {Boolean(settingsWindowBanner) && (
          <div
            className={cx({
              bannerBackground: true,
            })}>
            <Note isCentered useMarkdown noteStyle="warning">
              {settingsWindowBanner}
            </Note>
          </div>
        )}
        <GeneralSettingsDialog />
        <AchievementsDialog />
        <AboutDialog />
        <IntroDialog />
        <MenuThemesDialog />
      </div>
      <Tooltip
        delayShow={500}
        id="main-tooltip"
        openEvents={{
          click: true,
          mouseover: true,
          focus: true,
        }}
      />
    </>
  );
}
