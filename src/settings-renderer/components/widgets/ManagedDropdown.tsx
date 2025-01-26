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

import Dropdown from './Dropdown';
import { IAppSettings } from '../../../common';

interface IProps<K extends keyof IAppSettings> {
  settingsKey: K;
  options: { value: IAppSettings[K]; label: string }[];
  label?: string;
  info?: string;
  disabled?: boolean;
}

type EnumKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

export default <K extends EnumKeys<IAppSettings>>(props: IProps<K>) => {
  const [state, setState] = React.useState<IAppSettings[K]>();

  React.useEffect(() => {
    window.commonAPI.appSettings.getKey(props.settingsKey).then(setState);
    window.commonAPI.appSettings.onChange(props.settingsKey, setState);
  }, [props.settingsKey]);

  return (
    <Dropdown
      options={props.options}
      label={props.label}
      info={props.info}
      initialValue={state}
      onChange={(value) => window.commonAPI.appSettings.setKey(props.settingsKey, value)}
      disabled={props.disabled}
    />
  );
};
