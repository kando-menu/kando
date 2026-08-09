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

import { Button, Modal } from '../common';

import * as classes from './ScreenPositionPicker.module.scss';
import { Vec2 } from '../../../common';
import { useAppState, useMenuSettings } from '../../state';
import { IoAdd } from 'react-icons/io5';
import { fixedMenuPositionToString } from '../../../common';

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
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);

  const [newPosition, setNewPosition] = React.useState(null);

  // Clear the area when the modal is shown.
  React.useEffect(() => {
    if (props.isVisible) {
      setNewPosition(menus[selectedMenu].fixedMenuPosition);
    }
  }, [selectedMenu, menus, props.isVisible]);

  const getNewPositionValue = () => {
    if (newPosition) {
      return i18next.t('settings.screen-position-picker.value', {
        x: fixedMenuPositionToString(newPosition.x),
        y: fixedMenuPositionToString(newPosition.y),
      });
    } else {
      return 'NULL';
    }
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
        <div className={classes.value}>{getNewPositionValue()}</div>
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
                'settings.fixed-position-picker.top-right-preset-tooltip'
              ),
            },
            {
              classname: classes.topRightPresetButton,
              positionToSet: { x: 1, y: 0 },
              tooltip: i18next.t(
                'settings.fixed-position-picker.top-left-preset-tooltip'
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
          <div className={classes.positionPicker}>
            <div
              draggable
              className={classes.crosshair}
              data-tooltip-content={i18next.t(
                'settings.fixed-position-picker.picker-tooltip'
              )}
              data-tooltip-id="main-tooltip"
              onDragEnd={(event) => {
                window.settingsAPI.getWindowPosition().then((position) => {
                  window.settingsAPI.getWMInfo().then((info) => {
                    const x = (event.clientX + position.x) / info.workArea.width;
                    const y = (event.clientY + position.y) / info.workArea.height;
                    setNewPosition({ x, y });
                  });
                });
              }}>
              <BiTargetLock />
            </div>
          </div>
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
