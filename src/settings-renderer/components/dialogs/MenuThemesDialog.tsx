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

import React, { ReactNode } from 'react';
import i18next from 'i18next';
import classNames from 'classnames/bind';
import {
  TbExternalLink,
  TbFolderOpen,
  TbCircleCheck,
  TbPaletteFilled,
} from 'react-icons/tb';
import { RiDeleteBack2Fill } from 'react-icons/ri';
import lodash from 'lodash';

import { useAppState, useGeneralSetting } from '../../state';

import {
  Button,
  ColorButton,
  Modal,
  Note,
  Scrollbox,
  SettingsCheckbox,
  SettingsSpinbutton,
  Swirl,
  InfoItem,
} from '../common';

import * as classes from './MenuThemesDialog.module.scss';
const cx = classNames.bind(classes);

// This is called when the user clicks the "Open theme directory" button.
const openThemeDirectory = () => {
  window.settingsAPI
    .getMenuThemesDirectory()
    .then((dir) => window.open('file://' + dir, '_blank'));
};

/**
 * This dialog allows the user to select a theme for the menu. It shows a grid of
 * available themes, each with a preview image. The user can select a theme by clicking on
 * it. In addition, the user can configure some properties like the theme's accent
 * colors.
 */
export default function MenuThemesDialog() {
  const themesDialogVisible = useAppState((state) => state.themesDialogVisible);
  const setThemesDialogVisible = useAppState((state) => state.setThemesDialogVisible);

  const darkMode = useAppState((state) => state.darkMode);
  const themes = useAppState((state) => state.menuThemes);

  const [currentThemeID, setCurrentThemeID] = useGeneralSetting('menuTheme');
  const [currentDarkThemeID, setCurrentDarkThemeID] = useGeneralSetting('darkMenuTheme');
  const [colors, setColors] = useGeneralSetting('menuThemeColors');
  const [darkColors, setDarkColors] = useGeneralSetting('darkMenuThemeColors');
  const [useDarkMode] = useGeneralSetting('enableDarkModeForMenuThemes');

  // This is called when the user clicks on a theme. If different settings are used for
  // dark and light mode, we have to set the correct setting.
  const selectTheme = (themeID: string) => {
    if (darkMode && useDarkMode) {
      setCurrentDarkThemeID(themeID);
    } else {
      setCurrentThemeID(themeID);
    }
  };

  // Returns true if the given theme should be highlighted. This incorporates the
  // current theme and dark mode settings.
  const isSelected = (themeID: string) => {
    const currentID = darkMode && useDarkMode ? currentDarkThemeID : currentThemeID;
    return currentID === themeID;
  };

  const currentTheme = themes.find((theme) => isSelected(theme.id));
  let accentColorsNode: ReactNode = null;

  if (currentTheme && Object.keys(currentTheme.colors).length > 0) {
    const currentColorOverrides = darkMode && useDarkMode ? darkColors : colors;

    const currentColors = lodash.merge(
      {},
      currentTheme.colors,
      currentColorOverrides[currentTheme.id]
    );
    accentColorsNode = (
      <>
        <div style={{ marginTop: 15, marginBottom: 10 }}>
          <h1>
            {i18next.t('settings.menu-themes-dialog.accent-colors')}
            {useDarkMode
              ? darkMode
                ? ` (${i18next.t('settings.menu-themes-dialog.dark')})`
                : ` (${i18next.t('settings.menu-themes-dialog.light')})`
              : ''}
            <InfoItem
              info={i18next.t('settings.menu-themes-dialog.accent-colors-info')}
            />
          </h1>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'space-between',
          }}>
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}>
            {Object.keys(currentColors).map((key, index) => {
              return (
                <ColorButton
                  key={index}
                  name={key}
                  color={currentColors[key]}
                  onChange={(color) => {
                    // Create a new object to avoid mutating the state directly.
                    const overrides = lodash.cloneDeep(currentColorOverrides);

                    if (!overrides[currentTheme.id]) {
                      overrides[currentTheme.id] = {};
                    }

                    overrides[currentTheme.id][key] = color;

                    if (darkMode && useDarkMode) {
                      setDarkColors(overrides);
                    } else {
                      setColors(overrides);
                    }
                  }}
                />
              );
            })}
          </div>
          <Button
            icon={<RiDeleteBack2Fill />}
            size="small"
            tooltip={i18next.t('settings.menu-themes-dialog.reset-color-picker')}
            onClick={() => {
              if (darkMode && useDarkMode) {
                const updatedDarkColors = { ...darkColors };
                delete updatedDarkColors[currentTheme.id];
                setDarkColors(updatedDarkColors);
              } else {
                const updatedColors = { ...colors };
                delete updatedColors[currentTheme.id];
                setColors(updatedColors);
              }
            }}
          />
        </div>
      </>
    );
  } else {
    accentColorsNode = (
      <>
        <h1>{i18next.t('settings.menu-themes-dialog.accent-colors')}</h1>
        <Note marginTop={-10}>
          {i18next.t('settings.menu-themes-dialog.no-accent-colors')}
        </Note>
      </>
    );
  }

  const spinbuttonWidth = 40;

  return (
    <Modal
      title={i18next.t('settings.menu-themes-dialog.title')}
      icon={<TbPaletteFilled />}
      visible={themesDialogVisible}
      onClose={() => setThemesDialogVisible(false)}
      maxWidth={1200}
      paddingBottom={5}
      paddingTop={0}
      paddingLeft={0}
      paddingRight={5}>
      <div className={classes.container}>
        <div className={classes.sidebar}>
          <SettingsSpinbutton
            label={i18next.t('settings.menu-themes-dialog.fade-in-time')}
            info={i18next.t('settings.menu-themes-dialog.fade-in-time-info')}
            settingsKey="fadeInDuration"
            width={spinbuttonWidth}
            min={0}
            max={500}
            step={10}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.menu-themes-dialog.fade-out-time')}
            info={i18next.t('settings.menu-themes-dialog.fade-out-time-info')}
            settingsKey="fadeOutDuration"
            width={spinbuttonWidth}
            min={0}
            max={500}
            step={10}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.menu-themes-dialog.menu-scale')}
            info={i18next.t('settings.menu-themes-dialog.menu-scale-info')}
            settingsKey="zoomFactor"
            width={spinbuttonWidth}
            min={0.5}
            max={5}
            step={0.1}
          />
          <SettingsCheckbox
            label={i18next.t('settings.menu-themes-dialog.light-dark-mode')}
            info={i18next.t('settings.menu-themes-dialog.light-dark-mode-info')}
            settingsKey="enableDarkModeForMenuThemes"
          />

          {accentColorsNode}
          <div style={{ flexGrow: 1 }} />

          <Swirl variant="1" width={250} marginTop={10} marginBottom={20} />
          <Button
            label={i18next.t('settings.menu-themes-dialog.get-themes-online')}
            icon={<TbExternalLink />}
            tooltip="https://github.com/kando-menu/menu-themes"
            onClick={() =>
              window.open('https://github.com/kando-menu/menu-themes', '_blank')
            }
            block
          />
          <Button
            label={i18next.t('settings.menu-themes-dialog.create-your-own-themes')}
            icon={<TbExternalLink />}
            tooltip="https://kando.menu/create-menu-themes/"
            onClick={() =>
              window.open('https://kando.menu/create-menu-themes/', '_blank')
            }
            block
          />
          <Button
            label={i18next.t('settings.menu-themes-dialog.open-theme-directory')}
            icon={<TbFolderOpen />}
            onClick={openThemeDirectory}
            block
          />
        </div>
        <Scrollbox maxHeight={'min(80vh, 600px)'} width="100%">
          <div className={classes.themesGrid}>
            {themes.map((theme) => {
              let previewPath =
                'file://' + theme.directory + '/' + theme.id + '/preview.jpg';

              // On Windows, we have to replace backslashes with slashes to make the path work.
              if (cIsWindows) {
                previewPath = previewPath.replace(/\\/g, '/');
              }

              return (
                <div
                  key={theme.id}
                  className={cx({
                    themeCard: true,
                    selected: isSelected(theme.id),
                  })}
                  style={{ backgroundImage: `url("${previewPath}")` }}
                  onClick={() => selectTheme(theme.id)}>
                  {isSelected(theme.id) && (
                    <div className={classes.selectedOverlay}>
                      <TbCircleCheck />
                    </div>
                  )}
                  <div className={classes.themeName}>{theme.name}</div>
                  <div className={classes.themeAuthor}>
                    {i18next.t('settings.menu-themes-dialog.author', {
                      author: theme.author,
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Scrollbox>
      </div>
    </Modal>
  );
}
