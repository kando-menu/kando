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
import { TbFolderOpen, TbFile } from 'react-icons/tb';

import { Button, SettingsRow } from '.';

import * as classes from './FilePicker.module.scss';

type Props = {
  /** Function to call when the selected file changes. */
  onChange?: (path: string) => void;

  /** Initial shortcut. */
  initialValue: string;

  /** Optional label text to display next to the shortcut picker. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /** Optional placeholder text to display in the input field. */
  placeholder?: string;
};

/**
 * This component is an input field that allows the user to select a file path.
 *
 * @param props - The properties for the component.
 * @returns A React component that allows the user to enter a shortcut.
 */
export default function FilePicker(props: Props) {
  const [path, setPath] = React.useState(props.initialValue);

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(() => setPath(props.initialValue), [props.initialValue]);

  return (
    <SettingsRow label={props.label} info={props.info} grow>
      <div className={classes.filePicker}>
        <input
          type="text"
          spellCheck="false"
          placeholder={props.placeholder}
          value={path}
          onChange={(event) => {
            setPath(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
          onBlur={(event) => {
            if (event.target.value !== path) {
              props.onChange?.(event.target.value);
            }
          }}
        />
        <Button
          variant="secondary"
          grouped
          tooltip={i18next.t('settings.file-picker.select-file')}
          icon={<TbFile />}
          onClick={() => {
            window.settingsAPI
              .openFilePicker({ properties: ['openFile'] })
              .then((result) => {
                if (result) {
                  setPath(result);
                  props.onChange?.(result);
                }
              });
          }}
        />
        <Button
          variant="secondary"
          grouped
          tooltip={`${i18next.t('settings.file-picker.select-directory')}`}
          icon={<TbFolderOpen />}
          onClick={() => {
            window.settingsAPI
              .openFilePicker({ properties: ['openDirectory'] })
              .then((result) => {
                if (result) {
                  setPath(result);
                  props.onChange?.(result);
                }
              });
          }}
        />
      </div>
    </SettingsRow>
  );
}
