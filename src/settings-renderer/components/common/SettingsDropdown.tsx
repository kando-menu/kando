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
import { GeneralSettings } from '../../../common';

type Props<K extends keyof GeneralSettings> = {
  /** The key in the general settings to manage. */
  readonly settingsKey: K;

  /** Array of options to display in the dropdown. Each option has a value and a label. */
  readonly options: { value: GeneralSettings[K]; label: string }[];

  /** Optional label text to display next to the dropdown. */
  readonly label?: string;

  /** Optional additional information to display next to the label. */
  readonly info?: string;

  /** Whether the dropdown is disabled. Defaults to false. */
  readonly isDisabled?: boolean;

  /** Optional minimum width of the dropdown. */
  readonly minWidth?: number;

  /** Optional maximum width of the dropdown. */
  readonly maxWidth?: number;
};

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
export default function SettingsDropdown<K extends EnumKeys<GeneralSettings>>(
  props: Props<K>
) {
  const [state, setState] = useGeneralSetting(props.settingsKey);

  return (
    <Dropdown
      info={props.info}
      initialValue={state}
      isDisabled={props.isDisabled}
      label={props.label}
      maxWidth={props.maxWidth}
      minWidth={props.minWidth}
      options={props.options}
      onChange={setState}
    />
  );
}
