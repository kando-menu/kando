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
import { TbCheck, TbX } from 'react-icons/tb';
import { BiTargetLock } from 'react-icons/bi';

import { Modal, Button } from '../common';

import * as classes from './ScreenAreaPicker.module.scss';

type Props = {
  /** Function to call when a new area is selected. */
  onSelect: (top: number, left: number, bottom: number, right: number) => void;

  /** Function to call when the dialog should be closed. */
  onClose: () => void;

  /** Visibility of the modal. */
  visible: boolean;
};

/**
 * This component allows the user to select a screen area by dragging two points on the
 * screen.
 */
export default function ScreenAreaPicker(props: Props) {
  const [leftTop, setLeftTop] = React.useState(null);
  const [rightBottom, setRightBottom] = React.useState(null);

  // Clear the area when the modal is shown.
  React.useEffect(() => {
    if (props.visible) {
      setLeftTop(null);
      setRightBottom(null);
    }
  }, [props.visible]);

  const getTopLeftValue = () => {
    if (leftTop) {
      return i18next.t('settings.screen-area-picker.top-left-value', {
        x: leftTop.x,
        y: leftTop.y,
      });
    } else {
      return i18next.t('settings.screen-area-picker.top-left');
    }
  };

  const getBottomRightValue = () => {
    if (rightBottom) {
      return i18next.t('settings.screen-area-picker.bottom-right-value', {
        x: rightBottom.x,
        y: rightBottom.y,
      });
    } else {
      return i18next.t('settings.screen-area-picker.bottom-right');
    }
  };

  const isInvalid = () => {
    if (!leftTop || !rightBottom) {
      return false;
    }

    if (leftTop.x > rightBottom.x) {
      return true;
    }
    if (leftTop.y > rightBottom.y) {
      return true;
    }
    return false;
  };

  const isValid = () => {
    if (leftTop && rightBottom) {
      if (leftTop.x < rightBottom.x && leftTop.y < rightBottom.y) {
        return true;
      }
    }
    return false;
  };

  return (
    <Modal visible={props.visible} onClose={props.onClose} maxWidth={500}>
      <div className={classes.container}>
        <div className={classes.leftTopValue}>{getTopLeftValue()}</div>
        <div className={classes.area}>
          {isValid() && i18next.t('settings.screen-area-picker.valid')}
          {isInvalid() && i18next.t('settings.screen-area-picker.invalid')}
          <div className={classes.leftTopPicker}>
            <div
              className={classes.crosshair}
              draggable
              onDragEnd={(event) => {
                window.settingsAPI.getWindowPosition().then((position) => {
                  const x = event.clientX + position.x;
                  const y = event.clientY + position.y;
                  setLeftTop({ x, y });
                });
              }}>
              <BiTargetLock />
            </div>
          </div>
          <div className={classes.rightBottomPicker}>
            <div
              className={classes.crosshair}
              draggable
              onDragEnd={(event) => {
                window.settingsAPI.getWindowPosition().then((position) => {
                  const x = event.clientX + position.x;
                  const y = event.clientY + position.y;
                  setRightBottom({ x, y });
                });
              }}>
              <BiTargetLock />
            </div>
          </div>
        </div>
        <div className={classes.rightBottomValue}>{getBottomRightValue()}</div>
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
            label={i18next.t('settings.screen-area-picker.confirm')}
            variant="primary"
            disabled={!isValid()}
            icon={<TbCheck />}
            block
            onClick={() => {
              props.onSelect(leftTop.y, leftTop.x, rightBottom.y, rightBottom.x);
              props.onClose();
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
