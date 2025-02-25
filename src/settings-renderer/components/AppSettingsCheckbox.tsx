//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import Checkbox from './widgets/Checkbox';
import { useAppSetting } from '../state';
import { IAppSettings } from '../../common';

interface IProps<K extends keyof IAppSettings> {
  /** The key in the app settings to manage. */
  settingsKey: K;

  /** Optional label text to display next to the checkbox. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /** Whether the checkbox is disabled. Defaults to false. */
  disabled?: boolean;
}

/**
 * Used to ensure that the settings key K used for the AppSettingsCheckbox component
 * refers to a boolean property in the app settings.
 */
type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

/**
 * A managed checkbox component that syncs its state with a boolean property of the app
 * settings.
 *
 * @param props - The properties for the managed checkbox component.
 * @returns A managed checkbox element.
 */
export default <K extends BooleanKeys<IAppSettings>>(props: IProps<K>) => {
  const [state, setState] = useAppSetting(props.settingsKey);

  return (
    <Checkbox
      label={props.label}
      info={props.info}
      initialValue={state}
      onChange={setState}
      disabled={props.disabled}
    />
  );
};
