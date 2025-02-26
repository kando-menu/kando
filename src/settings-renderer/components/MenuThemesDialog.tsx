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

import React, { ReactNode } from 'react';
import {
  TbExternalLink,
  TbFolderOpen,
  TbCircleCheck,
  TbPaletteFilled,
} from 'react-icons/tb';
import { RiDeleteBack2Fill } from 'react-icons/ri';
import lodash from 'lodash';

import { useAppSetting, useAppState } from '../state';

import Button from './widgets/Button';
import ColorButton from './widgets/ColorButton';
import Modal from './widgets/Modal';
import Note from './widgets/Note';
import Scrollbox from './widgets/Scrollbox';
import AppSettingsCheckbox from './AppSettingsCheckbox';
import AppSettingsSpinbutton from './AppSettingsSpinbutton';
import Swirl from './widgets/Swirl';

import * as classes from './MenuThemesDialog.module.scss';

interface IProps {
  visible: boolean;
  onClose: () => void;
}

// This is called when the user clicks the "Open theme directory" button.
const openThemeDirectory = () => {
  window.settingsAPI
    .getMenuThemesDirectory()
    .then((dir) => window.open('file://' + dir, '_blank'));
};

export default (props: IProps) => {
  const darkMode = useAppState((state) => state.darkMode);
  const themes = useAppState((state) => state.menuThemes);

  const [currentThemeID, setCurrentThemeID] = useAppSetting('menuTheme');
  const [currentDarkThemeID, setCurrentDarkThemeID] = useAppSetting('darkMenuTheme');
  const [colors, setColors] = useAppSetting('menuThemeColors');
  const [darkColors, setDarkColors] = useAppSetting('darkMenuThemeColors');
  const [useDarkMode] = useAppSetting('enableDarkModeForMenuThemes');

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
        <h1>
          Theme Colors
          {useDarkMode ? (darkMode ? ' (Dark Mode)' : ' (Light Mode)') : ''}
        </h1>
        <Note marginTop={-10}>
          The set of available accent colors depends on the selected theme.
        </Note>
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
      visible={props.visible}
      onClose={props.onClose}
      maxWidth={1200}
      paddingBottom={0}
      paddingTop={0}
      paddingLeft={0}
      paddingRight={5}>
      <div className={classes.container}>
        <div className={classes.sidebar}>
          <Note marginTop={-6}>
            The options below are used regardless of the selected theme.
          </Note>

          <AppSettingsSpinbutton
            label="Fade-in time"
            info="The time in milliseconds for the fade-in animation of the menu. Set to zero to disable the animation. Default is 150ms."
            settingsKey="fadeInDuration"
            width={spinbuttonWidth}
            min={0}
            max={500}
            step={10}
          />
          <AppSettingsSpinbutton
            label="Fade-out time"
            info="The time in milliseconds for the fade-out animation of the menu. Some actions are only executed after this animation is finished, so setting this to zero makes them execute faster. Default is 200ms."
            settingsKey="fadeOutDuration"
            width={spinbuttonWidth}
            min={0}
            max={500}
            step={10}
          />
          <AppSettingsSpinbutton
            label="Menu scale"
            info="A global scale factor for all menus. Default is 1."
            settingsKey="zoomFactor"
            width={spinbuttonWidth}
            min={0.5}
            max={5}
            step={0.1}
          />
          <AppSettingsCheckbox
            label={'Dark and light mode'}
            info="If enabled, you can choose a different theme and a different set of accent colors if your system is currently in dark or light mode."
            settingsKey="enableDarkModeForMenuThemes"
          />

          {accentColorsNode}
          <div style={{ flexGrow: 1 }} />

          <Swirl variant="1" width={200} marginTop={10} marginBottom={20} />
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
        <Scrollbox maxHeight={'min(80vh, 600px)'}>
          <div className={classes.themesGrid}>
            {themes.map((theme) => {
              let previewPath =
                'file://' + theme.directory + '/' + theme.id + '/preview.jpg';

              // On Windows, we have to replace backslashes with slashes to make the path work.
              if (cIsWindows) {
                previewPath = previewPath.replace(/\\/g, '/');
              }

              // Highlight the selected theme.
              const className =
                classes.themeCard + ' ' + (isSelected(theme.id) ? classes.selected : '');

              return (
                <div
                  key={theme.id}
                  className={className}
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
