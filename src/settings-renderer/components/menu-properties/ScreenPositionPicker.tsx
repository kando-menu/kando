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
import { numericFormatter } from 'react-number-format';

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
        x: numericFormatter(String(newPosition.x), {
          fixedDecimalScale: true,
          decimalScale: 4,
        }),
        y: numericFormatter(String(newPosition.y), {
          fixedDecimalScale: true,
          decimalScale: 4,
        }),
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
          <div className={classes.centerPresetButton}>
            <Button
              icon={<IoAdd />}
              variant="invisible"
              onClick={() => {
                setNewPosition({ x: 0.5, y: 0.5 });
              }}
            />
          </div>
          <div className={classes.topLeftPresetButton}>
            <Button
              icon={<IoAdd />}
              variant="invisible"
              onClick={() => {
                setNewPosition({ x: 0, y: 0 });
              }}
            />
          </div>
          <div className={classes.topRightPresetButton}>
            <Button
              icon={<IoAdd />}
              variant="invisible"
              onClick={() => {
                setNewPosition({ x: 1, y: 0 });
              }}
            />
          </div>
          <div className={classes.bottomLeftPresetButton}>
            <Button
              icon={<IoAdd />}
              variant="invisible"
              onClick={() => {
                setNewPosition({ x: 0, y: 1 });
              }}
            />
          </div>
          <div className={classes.bottomRightPresetButton}>
            <Button
              icon={<IoAdd />}
              variant="invisible"
              onClick={() => {
                setNewPosition({ x: 1, y: 1 });
              }}
            />
          </div>
          <div className={classes.positionPicker}>
            <div
              draggable
              className={classes.crosshair}
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
            label={i18next.t('settings.screen-area-picker.confirm')}
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
