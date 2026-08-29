//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-FileCopyrightText: Jonathan Hurst <jpch2k4@gmail.com>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from '../../settings-window-api';
declare const window: WindowWithAPIs;

import React from 'react';
import i18next from 'i18next';
import { TbCheck, TbX } from 'react-icons/tb';
import { BiTargetLock } from 'react-icons/bi';

import { Button, Modal } from '../common';

import * as classes from './ScreenPositionPicker.module.scss';
import { Vec2 } from '../../../common';
import { IoAdd } from 'react-icons/io5';

type Props = {
  /** Function to call when a new position is selected. */
  readonly onSelect: (position: Vec2) => void;

  /** Function to call when the dialog should be closed. */
  readonly onClose: () => void;

  /** Visibility of the modal. */
  readonly isVisible: boolean;
};

/**
 * This component allows the user to select a screen position, by dragging a point on the
 * screen.
 */
export default function ScreenPositionPicker(props: Props) {
  const [newPosition, setNewPosition] = React.useState(null);

  // Reset the selection whenever the modal is shown, so that the confirm button
  // starts out disabled until a new position has been picked.
  React.useEffect(() => {
    if (props.isVisible) {
      setNewPosition(null);
    }
  }, [props.isVisible]);

  const getSelectedPositionValue = () => {
    if (!newPosition) {
      return null;
    }
    return i18next.t('settings.screen-position-picker.value', {
      x: newPosition.x.toFixed(2),
      y: newPosition.y.toFixed(2),
    });
  };

  const isValid = () => {
    if (newPosition) {
      return true;
    }
    return false;
  };

  return (
    <Modal isVisible={props.isVisible} maxWidth={500} onClose={props.onClose}>
      <div className={classes.container}>
        <div className={classes.content}>
          <div className={classes.positionPicker}>
            <div
              draggable
              className={classes.crosshair}
              data-tooltip-id="main-tooltip"
              onDragEnd={() => {
                window.settingsAPI.getWMInfo().then((info) => {
                  const x = (info.pointerX - info.workArea.x) / info.workArea.width;
                  const y = (info.pointerY - info.workArea.y) / info.workArea.height;
                  setNewPosition({ x, y });
                });
              }}>
              <BiTargetLock />
            </div>
          </div>
          <div className={classes.value}>
            {i18next.t('settings.screen-position-picker.instructions')}
          </div>
        </div>
        <div className={classes.area}>
          {[
            {
              classname: classes.centerPresetButton,
              positionToSet: { x: 0.5, y: 0.5 },
              tooltip: i18next.t(
                'settings.fixed-position-picker.centered-preset-tooltip'
              ),
            },
            {
              classname: classes.topLeftPresetButton,
              positionToSet: { x: 0, y: 0 },
              tooltip: i18next.t(
                'settings.fixed-position-picker.top-left-preset-tooltip'
              ),
            },
            {
              classname: classes.topRightPresetButton,
              positionToSet: { x: 1, y: 0 },
              tooltip: i18next.t(
                'settings.fixed-position-picker.top-right-preset-tooltip'
              ),
            },
            {
              classname: classes.bottomLeftPresetButton,
              positionToSet: { x: 0, y: 1 },
              tooltip: i18next.t(
                'settings.fixed-position-picker.bottom-left-preset-tooltip'
              ),
            },
            {
              classname: classes.bottomRightPresetButton,
              positionToSet: { x: 1, y: 1 },
              tooltip: i18next.t(
                'settings.fixed-position-picker.bottom-right-preset-tooltip'
              ),
            },
          ].map(({ classname, positionToSet, tooltip }, index) => (
            <div key={`list-${String(index)}`} className={classname}>
              <Button
                icon={<IoAdd />}
                variant="invisible"
                tooltip={tooltip}
                onClick={() => {
                  setNewPosition(positionToSet);
                }}
              />
            </div>
          ))}
          {newPosition ? (
            <div className={classes.selectedValue}>{getSelectedPositionValue()}</div>
          ) : null}
        </div>
        <div className={classes.buttons}>
          <Button
            isBlock
            icon={<TbX />}
            label={i18next.t('settings.cancel')}
            onClick={() => {
              props.onClose();
            }}
          />
          <Button
            isBlock
            icon={<TbCheck />}
            isDisabled={!isValid()}
            label={i18next.t('settings.fixed-position-picker.confirm')}
            variant="primary"
            onClick={() => {
              props.onSelect(newPosition);
              props.onClose();
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
