//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import Dropdown from './Dropdown';
import { useGeneralSetting } from '../../state';
import { IGeneralSettings } from '../../../common';

interface IProps<K extends keyof IGeneralSettings> {
  /** The key in the general settings to manage. */
  settingsKey: K;

  /** Array of options to display in the dropdown. Each option has a value and a label. */
  options: { value: IGeneralSettings[K]; label: string }[];

  /** Optional label text to display next to the dropdown. */
  label?: string;

  /** Optional additional information to display next to the label. */
  info?: string;

  /** Whether the dropdown is disabled. Defaults to false. */
  disabled?: boolean;

  /** Optional minimum width of the dropdown. */
  minWidth?: number;

  /** Optional maximum width of the dropdown. */
  maxWidth?: number;
}

/**
 * Used to ensure that the settings key K used for the GeneralSettingsDropdown component
 * refers to a string property in the general settings. This adds some type safety to the
 * component as it should only be used with enum-like settings.
 */
type EnumKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

/**
 * A managed dropdown component that syncs its state with a enum-like string property of
 * the general settings.
 *
 * @param props - The properties for the managed dropdown component.
 * @returns A managed dropdown element.
 */
export default function SettingsDropdown<K extends EnumKeys<IGeneralSettings>>(
  props: IProps<K>
) {
  const [state, setState] = useGeneralSetting(props.settingsKey);

  return (
    <Dropdown
      options={props.options}
      label={props.label}
      info={props.info}
      initialValue={state}
      onChange={setState}
      disabled={props.disabled}
      minWidth={props.minWidth}
      maxWidth={props.maxWidth}
    />
  );
}
