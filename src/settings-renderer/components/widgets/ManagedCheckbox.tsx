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

import Checkbox from './Checkbox';
import { IAppSettings } from '../../../common';

interface IProps<K extends keyof IAppSettings> {
  settingsKey: K;
  label?: string;
  info?: string;
  disabled?: boolean;
}

type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

export default <K extends BooleanKeys<IAppSettings>>(props: IProps<K>) => {
  const [state, setState] = React.useState(false);

  React.useEffect(() => {
    window.commonAPI.appSettings.getKey(props.settingsKey).then(setState);
    window.commonAPI.appSettings.onChange(props.settingsKey, setState);
  }, [props.settingsKey]);

  return (
    <Checkbox
      label={props.label}
      info={props.info}
      initialValue={state}
      onToggle={(value) => window.commonAPI.appSettings.setKey(props.settingsKey, value)}
      disabled={props.disabled}
    />
  );
};
