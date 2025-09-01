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
import { GeneralSettings } from '../../../common';

type Props<K extends keyof GeneralSettings> = {
  /** The key in the general settings to manage. */
  readonly settingsKey: K;

  /** Optional label text to display next to the spinbutton. */
  readonly label?: string;

  /** Optional information to display next to the label. */
  readonly info?: string;

  /** Whether the spinbutton is disabled. Defaults to false. */
  readonly isDisabled?: boolean;

  /** Optional minimum width of the spinbutton. Useful to align multiple spinbuttons. */
  readonly width?: number;

  /** Optional minimum value of the spinbutton. */
  readonly min?: number;

  /** Optional maximum value of the spinbutton. */
  readonly max?: number;

  /** Step size for the spinbutton. Defaults to 1. */
  readonly step?: number;
};

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
export default function SettingsSpinbutton<K extends NumberKeys<GeneralSettings>>(
  props: Props<K>
) {
  const [state, setState] = useGeneralSetting(props.settingsKey);

  return (
    <Spinbutton
      info={props.info}
      initialValue={state}
      isDisabled={props.isDisabled}
      label={props.label}
      max={props.max}
      min={props.min}
      step={props.step}
      width={props.width}
      onChange={setState}
    />
  );
}
