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
import { TbCheck, TbX, TbStopwatch } from 'react-icons/tb';
import { BiTargetLock } from 'react-icons/bi';

import { Modal, Button } from '../common';

import * as classes from './WindowPicker.module.scss';

interface IProps {
  /** Function to call when a new window is selected. */
  onSelect: (value: string) => void;

  /** Function to call when the dialog should be closed. */
  onClose: () => void;

  /** The picking mode. */
  mode: 'application' | 'title';

  /** Visibility of the modal. */
  visible: boolean;
}

/**
 * This component allows the user to select an application name or a window title by
 * clicking on a button. The user has to wait for a few seconds during which the
 * application or window should be focused. After that, the application name or window
 * title is read and returned to the parent component.
 */
export default function WindowPicker(props: IProps) {
  const timeout = 5;
  const [value, setValue] = React.useState(null);
  const [timer, setTimer] = React.useState(timeout + 1);

  // Clear the value when the modal is shown.
  React.useEffect(() => {
    if (props.visible) {
      setValue(null);
      setTimer(timeout + 1);
    }
  }, [props.visible]);

  // Reduce the timer every second.
  React.useEffect(() => {
    if (timer === 0) {
      // Stop the timer.
      setTimer(timeout + 1);

      window.settingsAPI.getWMInfo().then((wmInfo) => {
        if (props.mode === 'application') {
          setValue(wmInfo.appName);
        } else {
          setValue(wmInfo.windowName);
        }
      });
    } else if (timer <= timeout) {
      // Start the timer.
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [timer]);

  const getCaption = () => {
    if (timer > timeout) {
      if (value) {
        return i18next.t('settings.window-picker-dialog.result', { name: value });
      }

      return i18next.t('settings.window-picker-dialog.instructions');
    }

    return '';
  };

  const getButtonLabel = () => {
    if (value && timer > timeout) {
      return i18next.t('settings.window-picker-dialog.restart-countdown');
    }
    if (timer > timeout) {
      return i18next.t('settings.window-picker-dialog.start-countdown');
    }
    return i18next.t('settings.window-picker-dialog.countdown', { count: timer });
  };

  return (
    <Modal
      title={
        props.mode === 'application'
          ? i18next.t('settings.window-picker-dialog.pick-app-name-title')
          : i18next.t('settings.window-picker-dialog.pick-window-title-title')
      }
      icon={<BiTargetLock />}
      visible={props.visible}
      onClose={props.onClose}
      maxWidth={400}>
      <div className={classes.container}>
        <div className={classes.caption}>{getCaption()}</div>
        <div className={classes.recordButton}>
          <Button
            label={getButtonLabel()}
            icon={<TbStopwatch />}
            variant="primary"
            size="large"
            disabled={timer <= timeout}
            onClick={() => {
              setTimer(5);
            }}
          />
        </div>
        <div className={classes.buttons}>
          <Button
            label={i18next.t('settings.cancel')}
            icon={<TbX />}
            block
            onClick={() => {
              props.onClose();
            }}
          />
          <Button
            label={i18next.t('settings.window-picker-dialog.confirm')}
            variant="primary"
            disabled={!value || value === ''}
            icon={<TbCheck />}
            block
            onClick={() => {
              props.onSelect(value);
              props.onClose();
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
