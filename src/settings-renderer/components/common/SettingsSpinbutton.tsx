//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import Spinbutton from './Spinbutton';
import { useGeneralSetting } from '../../state';
import { IGeneralSettings } from '../../../common';

interface IProps<K extends keyof IGeneralSettings> {
  /** The key in the general settings to manage. */
  settingsKey: K;

  /** Optional label text to display next to the spinbutton. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /** Whether the spinbutton is disabled. Defaults to false. */
  disabled?: boolean;

  /** Optional minimum width of the spinbutton. Useful to align multiple spinbuttons. */
  width?: number;

  /** Optional minimum value of the spinbutton. */
  min?: number;

  /** Optional maximum value of the spinbutton. */
  max?: number;

  /** Step size for the spinbutton. Defaults to 1. */
  step?: number;
}

/**
 * Used to ensure that the settings key K used for the GeneralSettingsSpinbutton component
 * refers to a number property in the general settings.
 */
type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

/**
 * A managed spinbutton component that syncs its state with a number property of the app
 * settings.
 *
 * @param props - The properties for the managed spinbutton component.
 * @returns A managed spinbutton element.
 */
export default function SettingsSpinbutton<K extends NumberKeys<IGeneralSettings>>(
  props: IProps<K>
) {
  const [state, setState] = useGeneralSetting(props.settingsKey);

  return (
    <Spinbutton
      label={props.label}
      info={props.info}
      initialValue={state}
      width={props.width}
      onChange={setState}
      disabled={props.disabled}
      min={props.min}
      max={props.max}
      step={props.step}
    />
  );
}
