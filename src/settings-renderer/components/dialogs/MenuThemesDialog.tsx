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
export default () => {
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
            Accent Colors
            {useDarkMode ? (darkMode ? ' (Dark)' : ' (Light)') : ''}
            <InfoItem info="The set of available accent colors depends on the selected theme." />
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
                    if (!currentColorOverrides[currentTheme.id]) {
                      currentColorOverrides[currentTheme.id] = {};
                    }

                    currentColorOverrides[currentTheme.id][key] = color;

                    if (darkMode && useDarkMode) {
                      setDarkColors(currentColorOverrides);
                    } else {
                      setColors(currentColorOverrides);
                    }
                  }}
                />
              );
            })}
          </div>
          <Button
            icon={<RiDeleteBack2Fill />}
            size="small"
            tooltip="Reset colors to theme defaults."
            onClick={() => {
              if (darkMode && useDarkMode) {
                delete darkColors[currentTheme.id];
                setDarkColors(darkColors);
              } else {
                delete colors[currentTheme.id];
                setColors(colors);
              }
            }}
          />
        </div>
      </>
    );
  } else {
    accentColorsNode = (
      <>
        <h1>Theme Colors</h1>
        <Note marginTop={-10}>The selected theme does not expose any accent colors.</Note>
      </>
    );
  }

  const spinbuttonWidth = 40;

  return (
    <Modal
      title="Menu Themes"
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
            label="Fade-in time"
            info="The time in milliseconds for the fade-in animation of the menu. Set to zero to disable the animation. Default is 150ms."
            settingsKey="fadeInDuration"
            width={spinbuttonWidth}
            min={0}
            max={500}
            step={10}
          />
          <SettingsSpinbutton
            label="Fade-out time"
            info="The time in milliseconds for the fade-out animation of the menu. Some actions are only executed after this animation is finished, so setting this to zero makes them execute faster. Default is 200ms."
            settingsKey="fadeOutDuration"
            width={spinbuttonWidth}
            min={0}
            max={500}
            step={10}
          />
          <SettingsSpinbutton
            label="Menu scale"
            info="A global scale factor for all menus. Default is 1."
            settingsKey="zoomFactor"
            width={spinbuttonWidth}
            min={0.5}
            max={5}
            step={0.1}
          />
          <SettingsCheckbox
            label={'Dark and light mode'}
            info="If enabled, you can choose a different theme and a different set of accent colors if your system is currently in dark or light mode."
            settingsKey="enableDarkModeForMenuThemes"
          />

          {accentColorsNode}
          <div style={{ flexGrow: 1 }} />

          <Swirl variant="1" width={250} marginTop={10} marginBottom={20} />
          <Button
            label="Get themes online"
            icon={<TbExternalLink />}
            tooltip="https://github.com/kando-menu/menu-themes"
            onClick={() =>
              window.open('https://github.com/kando-menu/menu-themes', '_blank')
            }
            block
          />
          <Button
            label="Create your own themes"
            icon={<TbExternalLink />}
            tooltip="https://kando.menu/create-menu-themes/"
            onClick={() =>
              window.open('https://kando.menu/create-menu-themes/', '_blank')
            }
            block
          />
          <Button
            label="Open theme directory"
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
                  <div className={classes.themeAuthor}>by {theme.author}</div>
                </div>
              );
            })}
          </div>
        </Scrollbox>
      </div>
    </Modal>
  );
};
