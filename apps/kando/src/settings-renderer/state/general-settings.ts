//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { create } from 'zustand';

import { GeneralSettings, GENERAL_SETTINGS_SCHEMA } from '../../common';

// The general settings state object allows access to the settings stored in the user's
// config.json. It is always synchronized with the contents of the file, so any changes
// made in the settings dialog are immediately reflected in the file and vice versa.

/**
 * Use this hook to access the entire general settings object. Usually you will only need
 * a single setting. In this case, use useAppSetting instead.
 */
export const useGeneralSettings = create<GeneralSettings>(() =>
  GENERAL_SETTINGS_SCHEMA.parse({})
);

/**
 * Use this hook to access a single setting from the general settings. This is a
 * convenience wrapper around useGeneralSettings. It returns the value and a setter
 * function.
 */
export const useGeneralSetting = <T extends keyof GeneralSettings>(key: T) => {
  const value = useGeneralSettings((state) => state[key]);
  const setValue = (newValue: GeneralSettings[T]) =>
    useGeneralSettings.setState((state) => ({ ...state, [key]: newValue }));
  return [value, setValue] as const;
};
