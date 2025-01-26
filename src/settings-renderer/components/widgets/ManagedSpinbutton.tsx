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

import Spinbutton from './Spinbutton';
import { IAppSettings } from '../../../common';

interface IProps<K extends keyof IAppSettings> {
  settingsKey: K;
  label?: string;
  info?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

export default <K extends NumberKeys<IAppSettings>>(props: IProps<K>) => {
  const [state, setState] = React.useState(0);

  React.useEffect(() => {
    window.commonAPI.appSettings.getKey(props.settingsKey).then(setState);
    window.commonAPI.appSettings.onChange(props.settingsKey, setState);
  }, [props.settingsKey]);

  return (
    <Spinbutton
      label={props.label}
      info={props.info}
      initialValue={state}
      onChange={(value) => window.commonAPI.appSettings.setKey(props.settingsKey, value)}
      disabled={props.disabled}
      min={props.min}
      max={props.max}
      step={props.step}
    />
  );
};
