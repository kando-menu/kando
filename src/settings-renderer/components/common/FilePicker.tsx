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
  readonly onChange?: (path: string) => void;

  /** Initial shortcut. */
  readonly initialValue: string;

  /** Optional label text to display next to the shortcut picker. */
  readonly label?: string;

  /** Optional information to display next to the label. */
  readonly info?: string;

  /** Optional placeholder text to display in the input field. */
  readonly placeholder?: string;
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
    <SettingsRow isGrowing info={props.info} label={props.label}>
      <div className={classes.filePicker}>
        <input
          placeholder={props.placeholder}
          spellCheck="false"
          type="text"
          value={path}
          onBlur={(event) => {
            if (event.target.value !== path) {
              props.onChange?.(event.target.value);
            }
          }}
          onChange={(event) => {
            setPath(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
        />
        <Button
          isGrouped
          icon={<TbFile />}
          tooltip={i18next.t('settings.file-picker.select-file')}
          variant="secondary"
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
          isGrouped
          icon={<TbFolderOpen />}
          tooltip={`${i18next.t('settings.file-picker.select-directory')}`}
          variant="secondary"
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
