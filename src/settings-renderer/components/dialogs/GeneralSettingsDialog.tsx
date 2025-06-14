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

import { useAppState } from '../../state';

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

  return (
    <Modal
      title={i18next.t('settings.general-settings-dialog.title')}
      icon={<TbSettingsFilled />}
      visible={settingsDialogVisible}
      onClose={() => setSettingsDialogVisible(false)}
      maxWidth={600}
      paddingTop={0}
      paddingBottom={5}
      paddingLeft={5}
      paddingRight={5}>
      <Scrollbox maxHeight={'min(80vh, 800px)'}>
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
            marginLeft="10%"
            marginRight="10%"
            marginTop={10}
            markdown
            onLinkClick={() => {
              window.settingsAPI.getConfigDirectory().then((dir) => {
                window.open('file://' + dir, '_blank');
              });
            }}>
            {i18next.t('settings.general-settings-dialog.message', { link: '' })}
          </Note>

          <Swirl variant="2" width={350} marginBottom={10} />

          <h1>{i18next.t('settings.general-settings-dialog.app-behavior')}</h1>
          <SettingsCheckbox
            label={i18next.t('settings.general-settings-dialog.check-for-new-versions')}
            info={i18next.t(
              'settings.general-settings-dialog.check-for-new-versions-info'
            )}
            settingsKey="enableVersionCheck"
          />
          <SettingsCheckbox
            label={i18next.t(
              'settings.general-settings-dialog.invisible-settings-button'
            )}
            info={i18next.t(
              'settings.general-settings-dialog.invisible-settings-button-info'
            )}
            settingsKey="hideSettingsButton"
          />
          <SettingsDropdown
            maxWidth={200}
            label={i18next.t('settings.general-settings-dialog.settings-button-position')}
            info={i18next.t(
              'settings.general-settings-dialog.settings-button-position-info'
            )}
            settingsKey="settingsButtonPosition"
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
          />
          <SettingsDropdown
            maxWidth={200}
            label={i18next.t(
              'settings.general-settings-dialog.settings-window-color-scheme'
            )}
            info={i18next.t(
              'settings.general-settings-dialog.settings-window-color-scheme-info'
            )}
            settingsKey="settingsWindowColorScheme"
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
          />
          <SettingsDropdown
            maxWidth={200}
            label={i18next.t('settings.general-settings-dialog.settings-window-flavor')}
            info={i18next.t(
              'settings.general-settings-dialog.settings-window-flavor-info'
            )}
            settingsKey="settingsWindowFlavor"
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
          />
          <SettingsDropdown
            maxWidth={200}
            label={i18next.t('settings.general-settings-dialog.tray-icon-flavor')}
            info={i18next.t('settings.general-settings-dialog.tray-icon-flavor-info')}
            settingsKey="trayIconFlavor"
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
          />
          <SettingsCheckbox
            label={i18next.t('settings.general-settings-dialog.lazy-initialization')}
            info={i18next.t('settings.general-settings-dialog.lazy-initialization-info')}
            settingsKey="lazyInitialization"
          />

          <h1>{i18next.t('settings.general-settings-dialog.menu-behavior')}</h1>
          <SettingsCheckbox
            label={i18next.t('settings.general-settings-dialog.enable-marking-mode')}
            info={i18next.t('settings.general-settings-dialog.enable-marking-mode-info')}
            settingsKey="enableMarkingMode"
          />
          <SettingsCheckbox
            label={i18next.t('settings.general-settings-dialog.enable-turbo-mode')}
            info={i18next.t('settings.general-settings-dialog.enable-turbo-mode-info')}
            settingsKey="enableTurboMode"
          />
          <SettingsCheckbox
            label={i18next.t(
              'settings.general-settings-dialog.move-pointer-to-menu-center'
            )}
            info={i18next.t(
              'settings.general-settings-dialog.move-pointer-to-menu-center-info'
            )}
            settingsKey="warpMouse"
          />
          <SettingsCheckbox
            label={i18next.t(
              'settings.general-settings-dialog.require-click-for-hover-mode'
            )}
            info={i18next.t(
              'settings.general-settings-dialog.require-click-for-hover-mode-info'
            )}
            settingsKey="hoverModeNeedsConfirmation"
          />
          <SettingsCheckbox
            label={i18next.t(
              'settings.general-settings-dialog.right-mouse-button-selects-parent'
            )}
            info={i18next.t(
              'settings.general-settings-dialog.right-mouse-button-selects-parent-info'
            )}
            settingsKey="rmbSelectsParent"
          />
          <SettingsCheckbox
            label={i18next.t('settings.general-settings-dialog.enable-gamepad-support')}
            info={i18next.t(
              'settings.general-settings-dialog.enable-gamepad-support-info'
            )}
            settingsKey="enableGamepad"
          />
          <SettingsDropdown
            maxWidth={200}
            label="Press-shortcut-again behavior"
            info="This determines what happens when the shortcut is pressed again while a menu is shown. If multiple menus are assigned to the same shortcut, you can use this to cycle through all matching menus. Make sure to only hold down a modifier key if you want to use Turbo Mode together with an option other than 'Nothing'."
            settingsKey="sameShortcutBehavior"
            options={[
              { value: 'nothing', label: 'Nothing' },
              { value: 'cycle', label: 'Cycle through menus' },
              { value: 'close', label: 'Close menu' },
            ]}
          />

          <h1>{i18next.t('settings.general-settings-dialog.menu-sounds')}</h1>
          <Note marginTop={-5} markdown>
            {i18next.t('settings.general-settings-dialog.learn-how-to-add-sound-themes', {
              link: 'https://kando.menu/sound-themes/',
            })}
          </Note>
          <SettingsDropdown
            maxWidth={200}
            label={i18next.t('settings.general-settings-dialog.sound-theme')}
            info={i18next.t('settings.general-settings-dialog.sound-theme-info')}
            settingsKey="soundTheme"
            options={soundThemeOptions}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.general-settings-dialog.volume')}
            info={i18next.t('settings.general-settings-dialog.volume-info')}
            settingsKey="soundVolume"
            width={spinbuttonWidth}
            min={0}
            max={1}
            step={0.01}
          />

          <h1>{i18next.t('settings.general-settings-dialog.advanced-menu-options')}</h1>
          <Note marginTop={-5}>
            {i18next.t('settings.general-settings-dialog.advanced-menu-options-note')}
          </Note>
          <SettingsSpinbutton
            label={i18next.t('settings.general-settings-dialog.center-click-zone-radius')}
            info={i18next.t(
              'settings.general-settings-dialog.center-click-zone-radius-info'
            )}
            settingsKey="centerDeadZone"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.general-settings-dialog.minimum-submenu-distance')}
            info={i18next.t(
              'settings.general-settings-dialog.minimum-submenu-distance-info'
            )}
            settingsKey="minParentDistance"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.general-settings-dialog.movement-threshold')}
            info={i18next.t('settings.general-settings-dialog.movement-threshold-info')}
            settingsKey="dragThreshold"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={10}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.general-settings-dialog.minimum-gesture-length')}
            info={i18next.t(
              'settings.general-settings-dialog.minimum-gesture-length-info'
            )}
            settingsKey="gestureMinStrokeLength"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.general-settings-dialog.minimum-gesture-angle')}
            info={i18next.t(
              'settings.general-settings-dialog.minimum-gesture-angle-info'
            )}
            settingsKey="gestureMinStrokeAngle"
            width={spinbuttonWidth}
            min={0}
            max={30}
            step={1}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.general-settings-dialog.gesture-jitter-threshold')}
            info={i18next.t(
              'settings.general-settings-dialog.gesture-jitter-threshold-info'
            )}
            settingsKey="gestureJitterThreshold"
            width={spinbuttonWidth}
            min={0}
            max={50}
            step={1}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.general-settings-dialog.gesture-pause-timeout')}
            info={i18next.t(
              'settings.general-settings-dialog.gesture-pause-timeout-info'
            )}
            settingsKey="gesturePauseTimeout"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={50}
          />
          <SettingsSpinbutton
            label={i18next.t('settings.general-settings-dialog.fixed-stroke-length')}
            info={i18next.t('settings.general-settings-dialog.fixed-stroke-length-info')}
            settingsKey="fixedStrokeLength"
            width={spinbuttonWidth}
            min={0}
            max={999}
            step={10}
          />

          <h1>{i18next.t('settings.general-settings-dialog.developer-options')}</h1>
          <div
            style={{ display: 'flex', gap: 15, alignItems: 'center', marginBottom: 10 }}>
            <Note>{i18next.t('settings.general-settings-dialog.reload-note')}</Note>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minWidth: '40%',
              }}>
              <Button
                label={i18next.t('settings.general-settings-dialog.reload-menu-theme')}
                icon={<TbReload />}
                block
                onClick={() => {
                  window.settingsAPI.reloadMenuTheme();
                }}
              />
              <Button
                label={i18next.t('settings.general-settings-dialog.reload-sound-theme')}
                icon={<TbReload />}
                block
                onClick={() => {
                  window.settingsAPI.reloadSoundTheme();
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
            <Note>{i18next.t('settings.general-settings-dialog.dev-tools-note')}</Note>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minWidth: '40%',
              }}>
              <Button
                label={i18next.t(
                  'settings.general-settings-dialog.menu-window-dev-tools'
                )}
                icon={<TbPointer />}
                grow
                onClick={() => {
                  window.settingsAPI.showDevTools('menu-window');
                }}
              />
              <Button
                label={i18next.t(
                  'settings.general-settings-dialog.settings-window-dev-tools'
                )}
                icon={<TbPointerCog />}
                grow
                onClick={() => {
                  window.settingsAPI.showDevTools('settings-window');
                }}
              />
            </div>
          </div>
        </div>
      </Scrollbox>
    </Modal>
  );
}
