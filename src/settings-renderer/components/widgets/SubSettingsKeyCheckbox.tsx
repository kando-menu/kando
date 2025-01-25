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
  subKey: {
    [P in keyof IAppSettings[K]]: IAppSettings[K][P] extends boolean ? P : never;
  }[keyof IAppSettings[K]];
  label?: string;
  info?: string;
  disabled?: boolean;
}

export default <K extends keyof IAppSettings>(props: IProps<K>) => {
  const [state, setState] = React.useState<IAppSettings[K]>();

  React.useEffect(() => {
    window.commonAPI.appSettings.getKey(props.settingsKey).then((value) => {
      setState(value);
    });
    window.commonAPI.appSettings.onChange(props.settingsKey, (value) => {
      setState(value);
    });
  }, [props.settingsKey, props.subKey]);

  return (
    <Checkbox
      label={props.label}
      info={props.info}
      initialValue={state && (state[props.subKey] as boolean)}
      onToggle={(value) => {
        if (typeof state === 'object') {
          window.commonAPI.appSettings.setKey(props.settingsKey, {
            ...state,
            [props.subKey]: value,
          });
        }
      }}
      disabled={props.disabled}
    />
  );
};
