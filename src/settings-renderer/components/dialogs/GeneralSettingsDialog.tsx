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

import React from 'react';
import i18next from 'i18next';

import { TbReload, TbPointer, TbPointerCog, TbSettingsFilled } from 'react-icons/tb';
import { useAppState, useGeneralSetting } from '../../state';

import {
  Button,
  SettingsCheckbox,
  SettingsDropdown,
  SettingsSpinbutton,
  Modal,
  Note,
  Scrollbox,
  Swirl,
} from '../common';

/** This dialog allows the user to configure some general settings of Kando. */
export default function GeneralSettingsDialog() {
  const settingsDialogVisible = useAppState((state) => state.settingsDialogVisible);
  const setSettingsDialogVisible = useAppState((state) => state.setSettingsDialogVisible);
  const soundThemes = useAppState((state) => state.soundThemes);
  const [keepInputFocus] = useGeneralSetting('keepInputFocus');

  const soundThemeOptions = soundThemes.map((theme) => ({
    value: theme.id,
    label: theme.name,
  }));
  soundThemeOptions.unshift({
    value: 'none',
    label: i18next.t('settings.general-settings-dialog.none'),
  });

  // We make sure that some widgets have a consistent width.
  const spinbuttonWidth = 60;

  const localeOptions = cLocales.map((code) => {
    const display = new Intl.DisplayNames([code], { type: 'language' });
    return {
      value: code,
      label: display.of(code),
    };
  });

  localeOptions.unshift({
    value: 'auto',
    label: i18next.t('settings.general-settings-dialog.auto-language'),
  });

  return (
    <Modal
      icon={<TbSettingsFilled />}
      maxWidth={600}
      paddingBottom={5}
      paddingLeft={5}
      paddingRight={5}
      paddingTop={0}
      title={i18next.t('settings.general-settings-dialog.title')}
      visible={settingsDialogVisible}
      onClose={() => setSettingsDialogVisible(false)}>
      <Scrollbox maxHeight="min(80vh, 800px)">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: 5,
          }}>
          <Note
            center
            markdown
            marginLeft="10%"
            marginRight="10%"
            marginTop={10}
            onLinkClick={() => {
              window.settingsAPI.getConfigDirectory().then((dir) => {
                window.open('file://' + dir, '_blank');
              });
            }}>
            {i18next.t('settings.general-settings-dialog.message', { link: '' })}
          </Note>

          <Swirl marginBottom={10} variant="2" width={350} />
          <h1>{i18next.t('settings.general-settings-dialog.app-settings')}</h1>
          <SettingsDropdown
            info={i18next.t('settings.general-settings-dialog.localization-info')}
            label={i18next.t('settings.general-settings-dialog.localization-label')}
            maxWidth={200}
            options={localeOptions}
            settingsKey="locale"
          />
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.hardware-acceleration-info'
            )}
            label={i18next.t('settings.general-settings-dialog.hardware-acceleration')}
            settingsKey="hardwareAcceleration"
          />
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.check-for-new-versions-info'
            )}
            label={i18next.t('settings.general-settings-dialog.check-for-new-versions')}
            settingsKey="enableVersionCheck"
          />
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.invisible-settings-button-info'
            )}
            label={i18next.t(
              'settings.general-settings-dialog.invisible-settings-button'
            )}
            settingsKey="hideSettingsButton"
          />
          <SettingsDropdown
            info={i18next.t(
              'settings.general-settings-dialog.settings-button-position-info'
            )}
            label={i18next.t('settings.general-settings-dialog.settings-button-position')}
            maxWidth={200}
            options={[
              {
                value: 'top-left',
                label: i18next.t('settings.general-settings-dialog.top-left'),
              },
              {
                value: 'top-right',
                label: i18next.t('settings.general-settings-dialog.top-right'),
              },
              {
                value: 'bottom-left',
                label: i18next.t('settings.general-settings-dialog.bottom-left'),
              },
              {
                value: 'bottom-right',
                label: i18next.t('settings.general-settings-dialog.bottom-right'),
              },
            ]}
            settingsKey="settingsButtonPosition"
          />
          <SettingsDropdown
            info={i18next.t(
              'settings.general-settings-dialog.settings-window-color-scheme-info'
            )}
            label={i18next.t(
              'settings.general-settings-dialog.settings-window-color-scheme'
            )}
            maxWidth={200}
            options={[
              {
                value: 'system',
                label: i18next.t('settings.general-settings-dialog.system'),
              },
              {
                value: 'light',
                label: i18next.t('settings.general-settings-dialog.light'),
              },
              {
                value: 'dark',
                label: i18next.t('settings.general-settings-dialog.dark'),
              },
            ]}
            settingsKey="settingsWindowColorScheme"
          />
          <SettingsDropdown
            info={i18next.t(
              'settings.general-settings-dialog.settings-window-flavor-info'
            )}
            label={i18next.t('settings.general-settings-dialog.settings-window-flavor')}
            maxWidth={200}
            options={[
              {
                value: 'transparent-light',
                label: i18next.t('settings.general-settings-dialog.transparent-light'),
              },
              {
                value: 'transparent-dark',
                label: i18next.t('settings.general-settings-dialog.transparent-dark'),
              },
              {
                value: 'transparent-system',
                label: i18next.t('settings.general-settings-dialog.transparent-system'),
              },
              {
                value: 'sakura-light',
                label: i18next.t('settings.general-settings-dialog.sakura-light'),
              },
              {
                value: 'sakura-dark',
                label: i18next.t('settings.general-settings-dialog.sakura-dark'),
              },
              {
                value: 'sakura-system',
                label: i18next.t('settings.general-settings-dialog.sakura-system'),
              },
            ]}
            settingsKey="settingsWindowFlavor"
          />
          <SettingsDropdown
            info={i18next.t('settings.general-settings-dialog.tray-icon-flavor-info')}
            label={i18next.t('settings.general-settings-dialog.tray-icon-flavor')}
            maxWidth={200}
            options={[
              {
                value: 'none',
                label: i18next.t('settings.general-settings-dialog.hidden'),
              },
              {
                value: 'color',
                label: i18next.t('settings.general-settings-dialog.color'),
              },
              {
                value: 'white',
                label: i18next.t('settings.general-settings-dialog.white'),
              },
              {
                value: 'light',
                label: i18next.t('settings.general-settings-dialog.light'),
              },
              {
                value: 'dark',
                label: i18next.t('settings.general-settings-dialog.dark'),
              },
              {
                value: 'black',
                label: i18next.t('settings.general-settings-dialog.black'),
              },
            ]}
            settingsKey="trayIconFlavor"
          />
          <SettingsCheckbox
            info={i18next.t('settings.general-settings-dialog.lazy-initialization-info')}
            label={i18next.t('settings.general-settings-dialog.lazy-initialization')}
            settingsKey="lazyInitialization"
          />

          <h1>{i18next.t('settings.general-settings-dialog.menu-behavior')}</h1>
          <SettingsCheckbox
            info={i18next.t('settings.general-settings-dialog.keep-input-focus-info')}
            label={i18next.t('settings.general-settings-dialog.keep-input-focus')}
            settingsKey="keepInputFocus"
          />
          <SettingsCheckbox
            info={i18next.t('settings.general-settings-dialog.enable-marking-mode-info')}
            label={i18next.t('settings.general-settings-dialog.enable-marking-mode')}
            settingsKey="enableMarkingMode"
          />
          <SettingsCheckbox
            disabled={keepInputFocus}
            info={i18next.t('settings.general-settings-dialog.enable-turbo-mode-info')}
            label={i18next.t('settings.general-settings-dialog.enable-turbo-mode')}
            settingsKey="enableTurboMode"
          />
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.move-pointer-to-menu-center-info'
            )}
            label={i18next.t(
              'settings.general-settings-dialog.move-pointer-to-menu-center'
            )}
            settingsKey="warpMouse"
          />
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.require-click-for-hover-mode-info'
            )}
            label={i18next.t(
              'settings.general-settings-dialog.require-click-for-hover-mode'
            )}
            settingsKey="hoverModeNeedsConfirmation"
          />
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.right-mouse-button-selects-parent-info'
            )}
            label={i18next.t(
              'settings.general-settings-dialog.right-mouse-button-selects-parent'
            )}
            settingsKey="rmbSelectsParent"
          />
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.enable-gamepad-support-info'
            )}
            label={i18next.t('settings.general-settings-dialog.enable-gamepad-support')}
            settingsKey="enableGamepad"
          />
          <SettingsDropdown
            info={i18next.t('settings.general-settings-dialog.press-again-behavior-info')}
            label={i18next.t('settings.general-settings-dialog.press-again-behavior')}
            maxWidth={200}
            options={[
              {
                value: 'nothing',
                label: i18next.t('settings.general-settings-dialog.do-nothing'),
              },
              {
                value: 'cycle-from-first',
                label: i18next.t('settings.general-settings-dialog.cycle-from-first'),
              },
              {
                value: 'cycle-from-recent',
                label: i18next.t('settings.general-settings-dialog.cycle-from-recent'),
              },
              {
                value: 'close',
                label: i18next.t('settings.general-settings-dialog.close-menu'),
              },
            ]}
            settingsKey="sameShortcutBehavior"
          />

          <h1>{i18next.t('settings.general-settings-dialog.menu-sounds')}</h1>
          <Note markdown marginTop={-5}>
            {i18next.t('settings.general-settings-dialog.learn-how-to-add-sound-themes', {
              link: 'https://kando.menu/sound-themes/',
            })}
          </Note>
          <SettingsDropdown
            info={i18next.t('settings.general-settings-dialog.sound-theme-info')}
            label={i18next.t('settings.general-settings-dialog.sound-theme')}
            maxWidth={200}
            options={soundThemeOptions}
            settingsKey="soundTheme"
          />
          <SettingsSpinbutton
            info={i18next.t('settings.general-settings-dialog.volume-info')}
            label={i18next.t('settings.general-settings-dialog.volume')}
            max={1}
            min={0}
            settingsKey="soundVolume"
            step={0.01}
            width={spinbuttonWidth}
          />

          <h1>{i18next.t('settings.general-settings-dialog.advanced-menu-options')}</h1>
          <Note marginTop={-5}>
            {i18next.t('settings.general-settings-dialog.advanced-menu-options-note')}
          </Note>
          <SettingsSpinbutton
            info={i18next.t(
              'settings.general-settings-dialog.center-click-zone-radius-info'
            )}
            label={i18next.t('settings.general-settings-dialog.center-click-zone-radius')}
            max={999}
            min={0}
            settingsKey="centerDeadZone"
            step={50}
            width={spinbuttonWidth}
          />
          <SettingsSpinbutton
            info={i18next.t(
              'settings.general-settings-dialog.minimum-submenu-distance-info'
            )}
            label={i18next.t('settings.general-settings-dialog.minimum-submenu-distance')}
            max={999}
            min={0}
            settingsKey="minParentDistance"
            step={50}
            width={spinbuttonWidth}
          />
          <SettingsSpinbutton
            info={i18next.t('settings.general-settings-dialog.movement-threshold-info')}
            label={i18next.t('settings.general-settings-dialog.movement-threshold')}
            max={999}
            min={0}
            settingsKey="dragThreshold"
            step={10}
            width={spinbuttonWidth}
          />
          <SettingsSpinbutton
            info={i18next.t(
              'settings.general-settings-dialog.minimum-gesture-length-info'
            )}
            label={i18next.t('settings.general-settings-dialog.minimum-gesture-length')}
            max={999}
            min={0}
            settingsKey="gestureMinStrokeLength"
            step={50}
            width={spinbuttonWidth}
          />
          <SettingsSpinbutton
            info={i18next.t(
              'settings.general-settings-dialog.minimum-gesture-angle-info'
            )}
            label={i18next.t('settings.general-settings-dialog.minimum-gesture-angle')}
            max={30}
            min={0}
            settingsKey="gestureMinStrokeAngle"
            step={1}
            width={spinbuttonWidth}
          />
          <SettingsSpinbutton
            info={i18next.t(
              'settings.general-settings-dialog.gesture-jitter-threshold-info'
            )}
            label={i18next.t('settings.general-settings-dialog.gesture-jitter-threshold')}
            max={50}
            min={0}
            settingsKey="gestureJitterThreshold"
            step={1}
            width={spinbuttonWidth}
          />
          <SettingsSpinbutton
            info={i18next.t(
              'settings.general-settings-dialog.gesture-pause-timeout-info'
            )}
            label={i18next.t('settings.general-settings-dialog.gesture-pause-timeout')}
            max={999}
            min={0}
            settingsKey="gesturePauseTimeout"
            step={50}
            width={spinbuttonWidth}
          />
          <SettingsSpinbutton
            info={i18next.t('settings.general-settings-dialog.fixed-stroke-length-info')}
            label={i18next.t('settings.general-settings-dialog.fixed-stroke-length')}
            max={999}
            min={0}
            settingsKey="fixedStrokeLength"
            step={10}
            width={spinbuttonWidth}
          />

          <h1>{i18next.t('settings.general-settings-dialog.developer-options')}</h1>
          <Note>{i18next.t('settings.general-settings-dialog.reload-note')}</Note>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              block
              icon={<TbReload />}
              label={i18next.t('settings.general-settings-dialog.reload-menu-theme')}
              onClick={() => {
                window.settingsAPI.reloadMenuTheme();
              }}
            />
            <Button
              block
              icon={<TbReload />}
              label={i18next.t('settings.general-settings-dialog.reload-sound-theme')}
              onClick={() => {
                window.settingsAPI.reloadSoundTheme();
              }}
            />
          </div>

          <Note marginTop={8}>
            {i18next.t('settings.general-settings-dialog.dev-tools-note')}
          </Note>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              block
              icon={<TbPointer />}
              label={i18next.t('settings.general-settings-dialog.menu-window-dev-tools')}
              onClick={() => {
                window.settingsAPI.showDevTools('menu-window');
              }}
            />
            <Button
              block
              icon={<TbPointerCog />}
              label={i18next.t(
                'settings.general-settings-dialog.settings-window-dev-tools'
              )}
              onClick={() => {
                window.settingsAPI.showDevTools('settings-window');
              }}
            />
          </div>
        </div>
      </Scrollbox>
    </Modal>
  );
}
