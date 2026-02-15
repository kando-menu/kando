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
  TbReload,
  TbDownload,
} from 'react-icons/tb';
import lodash from 'lodash';

import { useAppState, useGeneralSetting } from '../../state';

import {
  Button,
  ColorButton,
  Dropdown,
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

// This is called when the user clicks the "Open presets directory" button.
const openPresetsDirectory = (themeDirectory: string, themeId: string) => {
  window.settingsAPI.openMenuThemePresetsDirectory(themeDirectory, themeId);
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
    window.commonAPI.incrementAchievementStats(['menuThemesSelected']);
  };

  // Returns true if the given theme should be highlighted. This incorporates the
  // current theme and dark mode settings.
  const isSelected = (themeID: string) => {
    const currentID = darkMode && useDarkMode ? currentDarkThemeID : currentThemeID;
    return currentID === themeID;
  };

  const currentTheme = themes.find((theme) => isSelected(theme.id));
  let accentColorsNode: ReactNode = null;

  // Presets state (declared unconditionally so hooks order stays stable)
  const [presets, setPresets] = React.useState<
    Array<{ name: string; colors?: Record<string, string>; error?: string }>
  >([]);
  const [resetDropdown, setResetDropdown] = React.useState(0);

  React.useEffect(() => {
    // Reset presets when theme changes
    setPresets([]);
    setResetDropdown((prev) => prev + 1);
  }, [currentTheme?.id]);

  const fetchPresets = React.useCallback(async () => {
    if (!currentTheme) {
      setPresets([]);
      return;
    }

    try {
      const p = await window.settingsAPI.getMenuThemePresets(
        currentTheme.directory,
        currentTheme.id
      );
      setPresets(p || []);
    } catch (e) {
      console.error('Failed to load presets:', e);
      setPresets([]);
    }
  }, [currentTheme]);

  // Load presets whenever the current theme changes
  React.useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  if (currentTheme && Object.keys(currentTheme.colors).length > 0) {
    const currentColorOverrides = darkMode && useDarkMode ? darkColors : colors;
    const currentColors = lodash.merge(
      {},
      currentTheme.colors,
      currentColorOverrides[currentTheme.id]
    );

    // Build preset options: "Default Colors" + all presets (no placeholder)
    const presetOptions = [
      {
        value: '__default__',
        label: i18next.t('settings.menu-themes-dialog.default-colors'),
      },
      ...presets.filter((p) => !p.error).map((p) => ({ value: p.name, label: p.name })),
    ];

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

        {/* Preset selector with buttons */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 15,
            width: '100%',
          }}>
          <Dropdown
            key={resetDropdown}
            initialValue="__placeholder__"
            options={[
              {
                value: '__placeholder__',
                label: i18next.t(
                  'settings.menu-themes-dialog.choose-preset',
                  'Choose Preset...'
                ),
              },
              ...presetOptions,
            ]}
            onChange={(value) => {
              if (value === '__placeholder__') {
                return;
              }

              if (value === '__default__') {
                // Reset to default by clearing overrides
                if (darkMode && useDarkMode) {
                  const updatedDarkColors = { ...darkColors };
                  delete updatedDarkColors[currentTheme.id];
                  setDarkColors(updatedDarkColors);
                } else {
                  const updatedColors = { ...colors };
                  delete updatedColors[currentTheme.id];
                  setColors(updatedColors);
                }
              } else {
                // Apply the selected preset
                const preset = presets.find((p) => p.name === value);
                if (preset && preset.colors) {
                  const overrides = lodash.cloneDeep(currentColorOverrides);
                  if (!overrides[currentTheme.id]) {
                    overrides[currentTheme.id] = {};
                  }
                  overrides[currentTheme.id] = preset.colors;
                  if (darkMode && useDarkMode) {
                    setDarkColors(overrides);
                  } else {
                    setColors(overrides);
                  }
                }
              }

              // Reset dropdown to show placeholder again
              setResetDropdown((prev) => prev + 1);
            }}
          />

          <Button
            isGrouped
            icon={<TbReload />}
            tooltip={i18next.t('settings.menu-themes-dialog.reload-presets')}
            onClick={async () => {
              await fetchPresets();
            }}
          />

          <Button
            isGrouped
            icon={<TbDownload />}
            tooltip={i18next.t('settings.menu-themes-dialog.export-preset')}
            onClick={() => {
              window.settingsAPI.exportMenuThemePreset(
                currentTheme.directory,
                currentTheme.id,
                currentColors
              );
            }}
          />

          <Button
            isGrouped
            icon={<TbFolderOpen />}
            tooltip={i18next.t('settings.menu-themes-dialog.open-presets-directory')}
            onClick={() => openPresetsDirectory(currentTheme.directory, currentTheme.id)}
          />
        </div>

        {/* Color buttons for manual editing */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}>
          {Object.keys(currentColors).map((key) => {
            return (
              <ColorButton
                key={key}
                color={currentColors[key]}
                name={key}
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
      icon={<TbPaletteFilled />}
      isVisible={themesDialogVisible}
      maxWidth={1200}
      paddingBottom={5}
      paddingLeft={0}
      paddingRight={5}
      paddingTop={0}
      title={i18next.t('settings.menu-themes-dialog.title')}
      onClose={() => setThemesDialogVisible(false)}>
      <div className={classes.container}>
        <div className={classes.sidebar}>
          <SettingsSpinbutton
            info={i18next.t('settings.menu-themes-dialog.fade-in-time-info')}
            label={i18next.t('settings.menu-themes-dialog.fade-in-time')}
            max={500}
            min={0}
            settingsKey="fadeInDuration"
            step={10}
            width={spinbuttonWidth}
          />
          <SettingsSpinbutton
            info={i18next.t('settings.menu-themes-dialog.fade-out-time-info')}
            label={i18next.t('settings.menu-themes-dialog.fade-out-time')}
            max={500}
            min={0}
            settingsKey="fadeOutDuration"
            step={10}
            width={spinbuttonWidth}
          />
          <SettingsSpinbutton
            info={i18next.t('settings.menu-themes-dialog.menu-scale-info')}
            label={i18next.t('settings.menu-themes-dialog.menu-scale')}
            max={5}
            min={0.5}
            settingsKey="zoomFactor"
            step={0.1}
            width={spinbuttonWidth}
          />
          <SettingsCheckbox
            info={i18next.t('settings.menu-themes-dialog.selection-wedges-info')}
            label={i18next.t('settings.menu-themes-dialog.selection-wedges')}
            settingsKey="enableSelectionWedges"
          />
          <SettingsCheckbox
            info={i18next.t('settings.menu-themes-dialog.light-dark-mode-info')}
            label={i18next.t('settings.menu-themes-dialog.light-dark-mode')}
            settingsKey="enableDarkModeForMenuThemes"
          />

          {accentColorsNode}
          <div style={{ flexGrow: 1 }} />

          <Swirl marginBottom={20} marginTop={10} variant="1" width={250} />
          <Button
            isBlock
            icon={<TbExternalLink />}
            label={i18next.t('settings.menu-themes-dialog.get-themes-online')}
            tooltip="https://github.com/kando-menu/menu-themes"
            onClick={() =>
              window.open('https://github.com/kando-menu/menu-themes', '_blank')
            }
          />
          <Button
            isBlock
            icon={<TbExternalLink />}
            label={i18next.t('settings.menu-themes-dialog.create-your-own-themes')}
            tooltip="https://kando.menu/create-menu-themes/"
            onClick={() =>
              window.open('https://kando.menu/create-menu-themes/', '_blank')
            }
          />
          <Button
            isBlock
            icon={<TbFolderOpen />}
            label={i18next.t('settings.menu-themes-dialog.open-theme-directory')}
            onClick={openThemeDirectory}
          />
        </div>
        <Scrollbox maxHeight="min(80vh, 600px)" width="100%">
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
