//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from '../settings-window-api';
import { IMenuThemeDescription } from '../../common';
declare const window: WindowWithAPIs;

import React from 'react';
import i18next from 'i18next';
import { TbExternalLink, TbFolderOpen } from 'react-icons/tb';

import Button from './widgets/Button';
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

export default (props: IProps) => {
  const [themes, setThemes] = React.useState<Array<IMenuThemeDescription>>([]);
  const [currentTheme, setCurrentTheme] = React.useState<string>('');
  const [currentDarkTheme, setCurrentDarkTheme] = React.useState<string>('');
  const [darkMode, setDarkMode] = React.useState<boolean>(false);
  const [useDarkMode, setUseDarkMode] = React.useState<boolean>(false);

  React.useEffect(() => {
    Promise.all([
      window.settingsAPI.getAllMenuThemes(),
      window.commonAPI.getIsDarkMode(),
      window.commonAPI.appSettings.getKey('menuTheme'),
      window.commonAPI.appSettings.getKey('darkMenuTheme'),
      window.commonAPI.appSettings.getKey('enableDarkModeForMenuThemes'),
    ]).then(([themes, darkMode, menuTheme, darkMenuTheme, useDarkMode]) => {
      setThemes(themes);
      setDarkMode(darkMode);
      setCurrentTheme(menuTheme);
      setCurrentDarkTheme(darkMenuTheme);
      setUseDarkMode(useDarkMode);
    });

    window.commonAPI.appSettings.onChange('menuTheme', setCurrentTheme);
    window.commonAPI.appSettings.onChange('darkMenuTheme', setCurrentDarkTheme);
    window.commonAPI.appSettings.onChange('enableDarkModeForMenuThemes', setUseDarkMode);
    window.commonAPI.darkModeChanged(setDarkMode);
  }, []);

  // This is called when the user clicks the "Open theme directory" button.
  const openThemeDirectory = () => {
    window.settingsAPI
      .getMenuThemesDirectory()
      .then((dir) => window.open('file://' + dir, '_blank'));
  };

  // This is called when the user clicks on a theme. If different settings are used for
  // dark and light mode, we have to set the correct setting.
  const selectTheme = (themeID: string) => {
    if (useDarkMode) {
      if (darkMode && currentDarkTheme !== themeID) {
        window.commonAPI.appSettings.setKey('darkMenuTheme', themeID);
      }
      if (!darkMode && currentTheme !== themeID) {
        window.commonAPI.appSettings.setKey('menuTheme', themeID);
      }
    } else {
      if (currentTheme !== themeID) {
        window.commonAPI.appSettings.setKey('menuTheme', themeID);
      }
    }
  };

  // Returns true if the given theme should be highlighted. This incorporates the
  // current theme and dark mode settings.
  const isSelected = (themeID: string) => {
    if (useDarkMode) {
      return (
        (darkMode && currentDarkTheme === themeID) ||
        (!darkMode && currentTheme === themeID)
      );
    } else {
      return currentTheme === themeID;
    }
  };

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
          <Note>
            Menu themes define how your menus look like. If you enable the option below,
            you can choose a different theme and accent colors if your system is in dark
            or light mode.
          </Note>
          <Swirl marginTop={10} marginBottom={20} />
          <ManagedCheckbox
            label={'Dark and light mode'}
            info={i18next.t('toolbar.menu-themes-tab.system-mode-subheading')}
            settingsKey="enableDarkModeForMenuThemes"
          />
          <ManagedSpinbutton
            label="Menu Scale"
            info="The scale of the menu. Default is 1."
            settingsKey="zoomFactor"
            width={40}
            min={0.5}
            max={5}
            step={0.1}
          />
          <div style={{ flexGrow: 1 }} />
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
                  onClick={() => selectTheme(theme.id)}>
                  <div
                    className={classes.themePreview}
                    style={{ backgroundImage: `url("${previewPath}")` }}
                  />

                  <div>{theme.name}</div>
                  <div>{theme.author}</div>
                </div>
              );
            })}
          </div>
        </Scrollbox>
      </div>
    </Modal>
  );
};
