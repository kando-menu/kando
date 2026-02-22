//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2000T <https://github.com/yar2000T>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';
import classNames from 'classnames/bind';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TbCheck, TbX } from 'react-icons/tb';

import { Modal, Button } from '../common';

import * as classes from './SavePresetDialog.module.scss';
const cx = classNames.bind(classes);

type Props = {
  /** Function to call when the preset should be saved. */
  readonly onSave: (name: string) => Promise<void> | void;

  /** Function to call when the dialog should be closed. */
  readonly onClose: () => void;

  /** Visibility of the modal. */
  readonly isVisible: boolean;

  /** List of existing preset names to check for overwrites. */
  readonly existingPresetNames?: string[];
};

/**
 * This component allows the user to save the current theme colors as a preset. It follows
 * the same pattern as AppPicker for consistency.
 */
export default function SavePresetDialog(props: Props) {
  const [presetName, setPresetName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);

  const [containerRef] = useAutoAnimate({ duration: 250 });
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Clear the value when the modal is shown.
  React.useEffect(() => {
    if (props.isVisible) {
      setPresetName('');
      setError(null);
      setWarning(null);
      inputRef.current?.focus();
    }
  }, [props.isVisible]);

  const validatePresetName = (
    name: string
  ): { error: string | null; warning: string | null } => {
    const trimmed = name.trim();

    if (!trimmed) {
      return {
        error: i18next.t('settings.menu-themes-dialog.preset-name-empty'),
        warning: null,
      };
    }

    if (!/^[a-zA-Z0-9_\-\s]+$/.test(trimmed)) {
      return {
        error: i18next.t('settings.menu-themes-dialog.preset-name-invalid'),
        warning: null,
      };
    }

    if (
      props.existingPresetNames?.some(
        (existingName) => existingName.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      return {
        error: null,
        warning: i18next.t('settings.menu-themes-dialog.preset-name-exists'),
      };
    }

    return { error: null, warning: null };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setPresetName(name);
    const { error: validationError, warning: validationWarning } =
      validatePresetName(name);
    setError(validationError);
    setWarning(validationWarning);
  };

  const handleSave = async () => {
    const { error: validationError } = validatePresetName(presetName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await props.onSave(presetName);
      setPresetName('');
      setError(null);
      setWarning(null);
      props.onClose();
    } catch (e) {
      console.error('Failed to save preset:', e);
      setError((e as Error).message || 'Failed to save preset');
    }
  };

  return (
    <Modal
      isVisible={props.isVisible}
      maxWidth={400}
      paddingTop={15}
      onClose={props.onClose}>
      <div className={classes.container}>
        <input
          ref={inputRef}
          className={cx({ input: true, error: !!error, warning: !!warning })}
          placeholder={i18next.t('settings.menu-themes-dialog.preset-name-placeholder')}
          type="text"
          value={presetName}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !error && presetName.trim()) {
              handleSave();
            } else if (e.key === 'Escape') {
              props.onClose();
            }
          }}
        />

        <div ref={containerRef}>
          {error ? <div className={classes.errorMessage}>{error}</div> : null}
          {warning ? <div className={classes.warningMessage}>{warning}</div> : null}
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
            isDisabled={!presetName.trim() || !!error}
            label={i18next.t('settings.menu-themes-dialog.save-preset')}
            variant="primary"
            onClick={handleSave}
          />
        </div>
      </div>
    </Modal>
  );
}
