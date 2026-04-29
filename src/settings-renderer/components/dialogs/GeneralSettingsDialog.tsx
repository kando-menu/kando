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

import {
  TbSettingsFilled,
  TbReload,
  TbPointer,
  TbPointerCog,
  TbRestore,
} from 'react-icons/tb';
import { FaDownload } from 'react-icons/fa';
import { useAppState, useGeneralSetting } from '../../state';
import {
  Button,
  SettingsCheckbox,
  SettingsDropdown,
  SettingsSpinbutton,
  Modal,
  Note,
  Swirl,
  Blossom,
} from '../common';
import classNames from 'classnames/bind';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import * as classes from './GeneralSettingsDialog.module.scss';
const cx = classNames.bind(classes);

/** This dialog allows the user to configure some general settings of Kando. */
export default function GeneralSettingsDialog() {
  type TransitionDirection = 'down' | 'up';

  const settingsDialogVisible = useAppState((state) => state.settingsDialogVisible);
  const setSettingsDialogVisible = useAppState((state) => state.setSettingsDialogVisible);
  const soundThemes = useAppState((state) => state.soundThemes);
  const [keepInputFocus] = useGeneralSetting('keepInputFocus');
  const backend = useAppState((state) => state.backendInfo);
  const [activeCategory, setActiveCategory] = React.useState(0);
  const [transitionDirection, setTransitionDirection] =
    React.useState<TransitionDirection>('down');
  const categoryTransitionDuration = 320; // 280ms animation + 40ms enter delay
  const activeOptionsPageRef = React.createRef<HTMLDivElement>();

  const handleCategorySelect = (categoryIndex: number) => {
    if (categoryIndex === activeCategory) {
      return;
    }

    setTransitionDirection(categoryIndex > activeCategory ? 'down' : 'up');
    setActiveCategory(categoryIndex);
  };

  const pageTransitionClasses =
    transitionDirection === 'down'
      ? {
          enter: classes.optionsPageEnterFromBottom,
          enterActive: classes.optionsPageEnterActive,
          enterDone: classes.optionsPageEnterDone,
          exit: classes.optionsPageExit,
          exitActive: classes.optionsPageExitToBottom,
        }
      : {
          enter: classes.optionsPageEnterFromTop,
          enterActive: classes.optionsPageEnterActive,
          enterDone: classes.optionsPageEnterDone,
          exit: classes.optionsPageExit,
          exitActive: classes.optionsPageExitToTop,
        };

  // Widget width
  const spinbuttonWidth = 60;

  // Options for dropdowns
  const soundThemeOptions = soundThemes.map((theme) => ({
    value: theme.id,
    label: theme.name,
  }));
  soundThemeOptions.unshift({
    value: 'none',
    label: i18next.t('settings.general-settings-dialog.none'),
  });

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

  // Categories and their content
  const categories = [
    {
      label: i18next.t('settings.general-settings-dialog.app-settings'),
      content: (
        <>
          <SettingsDropdown
            info={i18next.t('settings.general-settings-dialog.localization-info')}
            label={i18next.t('settings.general-settings-dialog.localization-label')}
            maxWidth={200}
            options={localeOptions}
            settingsKey="locale"
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
              'settings.general-settings-dialog.hardware-acceleration-info'
            )}
            label={i18next.t('settings.general-settings-dialog.hardware-acceleration')}
            settingsKey="hardwareAcceleration"
          />
          <SettingsCheckbox
            info={i18next.t('settings.general-settings-dialog.lazy-initialization-info')}
            label={i18next.t('settings.general-settings-dialog.lazy-initialization')}
            settingsKey="lazyInitialization"
          />
          <h1>Settings Dialog & Tray Icon</h1>
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
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.invisible-settings-button-info'
            )}
            label={i18next.t(
              'settings.general-settings-dialog.invisible-settings-button'
            )}
            settingsKey="hideSettingsButton"
          />
          <h1>Achievements</h1>
          <SettingsCheckbox
            info={i18next.t('settings.general-settings-dialog.enable-achievements-info')}
            label={i18next.t('settings.general-settings-dialog.enable-achievements')}
            settingsKey="enableAchievements"
          />
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.enable-achievement-notifications-info'
            )}
            label={i18next.t(
              'settings.general-settings-dialog.enable-achievement-notifications'
            )}
            settingsKey="enableAchievementNotifications"
          />
        </>
      ),
    },
    {
      label: i18next.t('settings.general-settings-dialog.menu-behavior'),
      content: (
        <>
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
              'settings.general-settings-dialog.right-mouse-button-selects-parent-info'
            )}
            label={i18next.t(
              'settings.general-settings-dialog.right-mouse-button-selects-parent'
            )}
            settingsKey="rmbSelectsParent"
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
          <h1>{i18next.t('settings.general-settings-dialog.interaction-modes')}</h1>
          <SettingsCheckbox
            info={i18next.t('settings.general-settings-dialog.enable-marking-mode-info')}
            label={i18next.t('settings.general-settings-dialog.enable-marking-mode')}
            settingsKey="enableMarkingMode"
          />
          <SettingsCheckbox
            info={i18next.t('settings.general-settings-dialog.enable-turbo-mode-info')}
            isDisabled={keepInputFocus}
            label={i18next.t('settings.general-settings-dialog.enable-turbo-mode')}
            settingsKey="enableTurboMode"
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
          <h1>{i18next.t('settings.general-settings-dialog.input-options')}</h1>
          <SettingsCheckbox
            info={i18next.t('settings.general-settings-dialog.keep-input-focus-info')}
            label={i18next.t('settings.general-settings-dialog.keep-input-focus')}
            settingsKey="keepInputFocus"
          />
          <SettingsCheckbox
            info={i18next.t(
              'settings.general-settings-dialog.enable-gamepad-support-info'
            )}
            label={i18next.t('settings.general-settings-dialog.enable-gamepad-support')}
            settingsKey="enableGamepad"
          />
          <SettingsCheckbox
          info={i18next.t(
            'settings.general-settings-dialog.disable-menu-animations-info'
          )}
          label={i18next.t('settings.general-settings-dialog.disable-menu-animations')}
          settingsKey="disableMenuAnimations"
          />
          <SettingsCheckbox
          info={i18next.t(
            'settings.general-settings-dialog.disable-pointer-scaling-info'
          )}
          label={i18next.t('settings.general-settings-dialog.disable-pointer-scaling')}
          settingsKey="disablePointerScaling"
          />
          {backend.name === 'Windows' && (
            <SettingsCheckbox
              info={i18next.t(
                'settings.general-settings-dialog.windows-ink-workaround-info'
              )}
              label={i18next.t('settings.general-settings-dialog.windows-ink-workaround')}
              settingsKey="windowsInkWorkaround"
            />
          )}
          <Swirl marginBottom={20} marginTop={40} variant="2" width={350} />
          <Note isCentered useMarkdown>
            {i18next.t('settings.general-settings-dialog.learn-interaction-mode', {
              link: 'https://kando.menu/usage/',
            })}
          </Note>
        </>
      ),
    },
    {
      label: i18next.t('settings.general-settings-dialog.menu-sounds'),
      content: (
        <>
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
          <Swirl marginBottom={20} marginTop={40} variant="2" width={350} />
          <Note isCentered useMarkdown>
            {i18next.t('settings.general-settings-dialog.learn-how-to-add-sound-themes', {
              link: 'https://kando.menu/sound-themes/',
            })}
          </Note>
        </>
      ),
    },
    {
      label: i18next.t('settings.general-settings-dialog.advanced-menu-options'),
      content: (
        <>
          <SettingsSpinbutton
            info={i18next.t('settings.general-settings-dialog.max-selection-radius-info')}
            label={i18next.t('settings.general-settings-dialog.max-selection-radius')}
            max={9999}
            min={0}
            settingsKey="maxSelectionRadius"
            step={50}
            width={spinbuttonWidth}
          />
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
          {backend.name === 'Niri' && (
            <>
              <h1>
                {i18next.t('settings.general-settings-dialog.wlroots-specific-options')}
              </h1>
              <Note useMarkdown marginTop={-5}>
                {i18next.t(
                  'settings.general-settings-dialog.options-that-will-only-affect-the-wlroots-backend'
                )}
              </Note>
              <SettingsSpinbutton
                info={i18next.t(
                  'settings.general-settings-dialog.wlroots-pointer-get-timeout-mouse-info'
                )}
                label={i18next.t(
                  'settings.general-settings-dialog.wlroots-pointer-get-timeout-mouse'
                )}
                max={5000}
                min={0}
                settingsKey="wlrootsPointerGetTimeoutMouse"
                step={100}
                width={spinbuttonWidth}
              />
              <SettingsSpinbutton
                info={i18next.t(
                  'settings.general-settings-dialog.wlroots-pointer-get-timeout-touch-info'
                )}
                label={i18next.t(
                  'settings.general-settings-dialog.wlroots-pointer-get-timeout-touch'
                )}
                max={5000}
                min={0}
                settingsKey="wlrootsPointerGetTimeoutTouch"
                step={100}
                width={spinbuttonWidth}
              />
              <SettingsDropdown
                info={i18next.t(
                  'settings.general-settings-dialog.wlroots-pointer-get-timeout-default-behavior-info'
                )}
                label={i18next.t(
                  'settings.general-settings-dialog.wlroots-pointer-get-timeout-default-behavior'
                )}
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
                  {
                    value: 'center',
                    label: i18next.t('settings.general-settings-dialog.center'),
                  },
                  {
                    value: 'previously-reported-position',
                    label: i18next.t(
                      'settings.general-settings-dialog.previously-reported'
                    ),
                  },
                ]}
                settingsKey="wlrootsPointerGetTimeoutDefaultBehavior"
              />
            </>
          )}
          <Swirl marginBottom={20} marginTop={40} variant="2" width={350} />
          <Note isCentered>
            {i18next.t('settings.general-settings-dialog.advanced-menu-options-note')}
          </Note>
        </>
      ),
    },
    {
      label: i18next.t('settings.general-settings-dialog.backup-and-restore'),
      content: (
        <>
          <Note
            isCentered
            useMarkdown
            marginBottom={20}
            onLinkClick={() => {
              window.settingsAPI.getConfigDirectory().then((dir) => {
                window.open('file://' + dir, '_blank');
              });
            }}>
            {i18next.t('settings.general-settings-dialog.message', { link: '' })}
          </Note>
          <div style={{ display: 'flex', gap: 2 }}>
            <Button
              isBlock
              isGrouped
              icon={<FaDownload />}
              label={i18next.t('settings.general-settings-dialog.backup-menus')}
              variant="floating"
              onClick={() => {
                window.settingsAPI.backupMenuSettings();
              }}
            />
            <Button
              isBlock
              isGrouped
              icon={<TbRestore />}
              label={i18next.t('settings.general-settings-dialog.restore-menus')}
              variant="floating"
              onClick={() => {
                window.settingsAPI.restoreMenuSettings();
              }}
            />
          </div>
          <Note isCentered marginBottom={32} marginTop={8}>
            {i18next.t('settings.general-settings-dialog.backup-menus-note')}
          </Note>

          <div style={{ display: 'flex', gap: 2 }}>
            <Button
              isBlock
              isGrouped
              icon={<FaDownload />}
              label={i18next.t('settings.general-settings-dialog.backup-settings')}
              variant="floating"
              onClick={() => {
                window.settingsAPI.backupGeneralSettings();
              }}
            />
            <Button
              isBlock
              isGrouped
              icon={<TbRestore />}
              label={i18next.t('settings.general-settings-dialog.restore-settings')}
              variant="floating"
              onClick={() => {
                window.settingsAPI.restoreGeneralSettings();
              }}
            />
          </div>
          <Note isCentered marginTop={8}>
            {i18next.t('settings.general-settings-dialog.backup-settings-note')}
          </Note>
          <Swirl marginTop={20} variant="3" width={300} />
        </>
      ),
    },
    {
      label: i18next.t('settings.general-settings-dialog.developer-options'),
      content: (
        <>
          <Note>{i18next.t('settings.general-settings-dialog.reload-note')}</Note>
          <div style={{ display: 'flex', gap: 2 }}>
            <Button
              isBlock
              isGrouped
              icon={<TbReload />}
              label={i18next.t('settings.general-settings-dialog.reload-menu-theme')}
              variant="floating"
              onClick={() => {
                window.settingsAPI.reloadMenuTheme();
              }}
            />
            <Button
              isBlock
              isGrouped
              icon={<TbReload />}
              label={i18next.t('settings.general-settings-dialog.reload-sound-theme')}
              variant="floating"
              onClick={() => {
                window.settingsAPI.reloadSoundTheme();
              }}
            />
          </div>
          <Note marginTop={8}>
            {i18next.t('settings.general-settings-dialog.dev-tools-note')}
          </Note>
          <div style={{ display: 'flex', gap: 2 }}>
            <Button
              isBlock
              isGrouped
              icon={<TbPointer />}
              label={i18next.t('settings.general-settings-dialog.menu-window-dev-tools')}
              variant="floating"
              onClick={() => {
                window.settingsAPI.showDevTools('menu-window');
              }}
            />
            <Button
              isBlock
              isGrouped
              icon={<TbPointerCog />}
              label={i18next.t(
                'settings.general-settings-dialog.settings-window-dev-tools'
              )}
              variant="floating"
              onClick={() => {
                window.settingsAPI.showDevTools('settings-window');
              }}
            />
          </div>
          <Swirl marginBottom={20} marginTop={40} variant="3" width={300} />
        </>
      ),
    },
  ];

  return (
    <Modal
      icon={<TbSettingsFilled />}
      isVisible={settingsDialogVisible}
      maxWidth={900}
      paddingBottom={0}
      paddingLeft={0}
      paddingRight={0}
      paddingTop={0}
      title={i18next.t('settings.general-settings-dialog.title')}
      onClose={() => setSettingsDialogVisible(false)}>
      <div className={classes.container}>
        <div className={classes.sidebar}>
          {categories.map((cat, idx) => (
            <div
              key={cat.label}
              className={cx('category', { active: idx === activeCategory })}
              onClick={() => handleCategorySelect(idx)}>
              {cat.label}
            </div>
          ))}
        </div>
        <Blossom bottom={0} cropBottom={50} cropRight={50} right={0} size={350} />
        <div className={classes.options}>
          <TransitionGroup component={null}>
            <CSSTransition
              key={activeCategory}
              classNames={pageTransitionClasses}
              nodeRef={activeOptionsPageRef}
              timeout={categoryTransitionDuration}>
              <div ref={activeOptionsPageRef} className={classes.optionsPage}>
                {categories[activeCategory].content}
              </div>
            </CSSTransition>
          </TransitionGroup>
        </div>
      </div>
    </Modal>
  );
}
