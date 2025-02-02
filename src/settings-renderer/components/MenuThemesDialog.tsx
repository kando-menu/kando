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
import { TbExternalLink, TbFolderOpen, TbCircleCheck } from 'react-icons/tb';
import { RiResetLeftLine } from 'react-icons/ri';
import lodash from 'lodash';

import { IMenuThemeDescription } from '../../common';
import Button from './widgets/Button';
import ColorButton from './widgets/ColorButton';
import Modal from './widgets/Modal';
import Note from './widgets/Note';
import Scrollbox from './widgets/Scrollbox';
import ManagedCheckbox from './widgets/ManagedCheckbox';
import ManagedSpinbutton from './widgets/ManagedSpinbutton';
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
  const [themes, setThemes] = React.useState<Array<IMenuThemeDescription>>([]);
  const [darkMode, setDarkMode] = React.useState<boolean>(false);
  const [currentThemeID, setCurrentThemeID] = React.useState<string>('');
  const [currentDarkThemeID, setCurrentDarkThemeID] = React.useState<string>('');
  const [colors, setColors] = React.useState<Record<string, Record<string, string>>>({});
  const [darkColors, setDarkColors] = React.useState<
    Record<string, Record<string, string>>
  >({});
  const [useDarkMode, setUseDarkMode] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!props.visible) {
      return;
    }

    Promise.all([
      window.settingsAPI.getAllMenuThemes(),
      window.commonAPI.getIsDarkMode(),
      window.commonAPI.appSettings.getKey('menuTheme'),
      window.commonAPI.appSettings.getKey('darkMenuTheme'),
      window.commonAPI.appSettings.getKey('menuThemeColors'),
      window.commonAPI.appSettings.getKey('darkMenuThemeColors'),
      window.commonAPI.appSettings.getKey('enableDarkModeForMenuThemes'),
    ]).then(
      ([themes, darkMode, menuTheme, darkMenuTheme, colors, darkColors, useDarkMode]) => {
        setThemes(themes);
        setDarkMode(darkMode);
        setCurrentThemeID(menuTheme);
        setCurrentDarkThemeID(darkMenuTheme);
        setColors(colors);
        setDarkColors(darkColors);
        setUseDarkMode(useDarkMode);
      }
    );

    const disconnectors = [
      window.commonAPI.appSettings.onChange('menuTheme', setCurrentThemeID),
      window.commonAPI.appSettings.onChange('darkMenuTheme', setCurrentDarkThemeID),
      window.commonAPI.appSettings.onChange('menuThemeColors', setColors),
      window.commonAPI.appSettings.onChange('darkMenuThemeColors', setDarkColors),
      window.commonAPI.appSettings.onChange(
        'enableDarkModeForMenuThemes',
        setUseDarkMode
      ),
      window.commonAPI.darkModeChanged((darkMode) => {
        console.log('Dark mode changed to', darkMode);
        setDarkMode(darkMode);
      }),
    ];

    return () => {
      disconnectors.forEach((disconnect) => disconnect());
    };
  }, [props.visible]);

  // This is called when the user clicks on a theme. If different settings are used for
  // dark and light mode, we have to set the correct setting.
  const selectTheme = (themeID: string) => {
    const key = darkMode && useDarkMode ? 'darkMenuTheme' : 'menuTheme';
    window.commonAPI.appSettings.setKey(key, themeID);
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}>
          <h1>Accent Colors</h1>
          <Button
            label="Reset"
            icon={<RiResetLeftLine />}
            onClick={() => {
              if (darkMode && useDarkMode) {
                delete darkColors[currentTheme.id];
              } else {
                delete colors[currentTheme.id];
              }
              const settingsKey =
                darkMode && useDarkMode ? 'darkMenuThemeColors' : 'menuThemeColors';
              window.commonAPI.appSettings.setKey(settingsKey, darkColors);
            }}
          />
        </div>
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
                  const settingsKey =
                    darkMode && useDarkMode ? 'darkMenuThemeColors' : 'menuThemeColors';
                  window.commonAPI.appSettings.setKey(settingsKey, currentColorOverrides);
                }}
              />
            );
          })}
        </div>
      </>
    );
  } else {
    accentColorsNode = (
      <>
        <h1>Accent Colors</h1>
        <Note marginTop={-10}>The selected theme does not expose any accent colors.</Note>
      </>
    );
  }

  return (
    <Modal
      title="Menu Themes"
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
            If you enable the option below, you can choose a different theme if your
            system is in dark or light mode.
          </Note>
          <ManagedCheckbox
            label={'Dark and light mode'}
            settingsKey="enableDarkModeForMenuThemes"
          />
          <ManagedSpinbutton
            label="Menu Scale"
            settingsKey="zoomFactor"
            width={40}
            min={0.5}
            max={5}
            step={0.1}
          />

          {accentColorsNode}
          <div style={{ flexGrow: 1 }} />

          <Swirl marginTop={10} marginBottom={20} />
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
