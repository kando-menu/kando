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
import { TbCheck, TbX } from 'react-icons/tb';
import { IoIosSave } from 'react-icons/io';
import { MdWarning } from 'react-icons/md';

import { Modal, Button, Swirl } from '../common';

import * as classes from './SavePresetDialog.module.scss';

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
  const [isSaving, setIsSaving] = React.useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = React.useState(false);
  const [pendingPresetName, setPendingPresetName] = React.useState('');

  // Clear the value when the modal is shown.
  React.useEffect(() => {
    if (props.isVisible) {
      setPresetName('');
      setError(null);
      setIsSaving(false);
      setShowOverwriteConfirm(false);
      setPendingPresetName('');
    }
  }, [props.isVisible]);

  const performSave = async (name: string) => {
    try {
      setIsSaving(true);
      await props.onSave(name);
      setPresetName('');
      setError(null);
      setShowOverwriteConfirm(false);
      setPendingPresetName('');
      props.onClose();
    } catch (e) {
      console.error('Failed to save preset:', e);
      setError((e as Error).message || 'Failed to save preset');
      setShowOverwriteConfirm(false);
      setPendingPresetName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!presetName.trim()) {
      setError(i18next.t('settings.menu-themes-dialog.preset-name-empty'));
      return;
    }

    // Validate preset name (only letters, numbers, hyphens, underscores, and spaces)
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(presetName)) {
      setError(i18next.t('settings.menu-themes-dialog.preset-name-invalid'));
      return;
    }

    // Check if preset name already exists
    const normalizedName = presetName.trim();
    const presetExists =
      props.existingPresetNames?.some(
        (name) => name.toLowerCase() === normalizedName.toLowerCase()
      ) ?? false;

    if (presetExists) {
      // Show confirmation modal instead of inline error
      setPendingPresetName(normalizedName);
      setShowOverwriteConfirm(true);
      return;
    }

    await performSave(normalizedName);
  };

  return (
    <>
      <Modal
        icon={<IoIosSave />}
        isVisible={props.isVisible}
        maxWidth={400}
        paddingTop={15}
        title={i18next.t('settings.menu-themes-dialog.save-preset-name-title')}
        onClose={props.onClose}>
        <div className={classes.container}>
          <Swirl marginBottom={10} variant="2" width={350} />

          <div className={classes.inputContainer}>
            <label>
              {i18next.t('settings.menu-themes-dialog.save-preset-name-label')}
            </label>
            <input
              autoFocus
              className={classes.input}
              disabled={isSaving}
              placeholder={i18next.t(
                'settings.menu-themes-dialog.preset-name-placeholder'
              )}
              type="text"
              value={presetName}
              onChange={(e) => {
                setPresetName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && presetName.trim()) {
                  handleSave();
                } else if (e.key === 'Escape') {
                  props.onClose();
                }
              }}
            />
          </div>

          {error ? <div className={classes.error}>{error}</div> : null}

          <div className={classes.buttons}>
            <Button
              isBlock
              icon={<TbX />}
              isDisabled={isSaving}
              label={i18next.t('settings.cancel')}
              onClick={() => {
                props.onClose();
              }}
            />
            <Button
              isBlock
              icon={<TbCheck />}
              isDisabled={!presetName.trim() || isSaving}
              label={i18next.t('settings.menu-themes-dialog.save-preset')}
              variant="primary"
              onClick={handleSave}
            />
          </div>
        </div>
      </Modal>

      {/* Overwrite confirmation modal */}
      <Modal
        icon={<MdWarning />}
        isVisible={showOverwriteConfirm}
        maxWidth={400}
        paddingTop={15}
        title={i18next.t('settings.menu-themes-dialog.overwrite-preset-title')}
        onClose={() => setShowOverwriteConfirm(false)}>
        <div className={classes.container}>
          <div className={classes.error} style={{ marginBottom: 20 }}>
            {i18next.t('settings.menu-themes-dialog.overwrite-preset-message')}
          </div>

          <div className={classes.buttons}>
            <Button
              isBlock
              icon={<TbX />}
              label={i18next.t('settings.cancel')}
              onClick={() => setShowOverwriteConfirm(false)}
            />
            <Button
              isBlock
              icon={<TbCheck />}
              label={i18next.t('settings.menu-themes-dialog.save-preset')}
              variant="primary"
              onClick={() => performSave(pendingPresetName)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
