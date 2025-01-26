//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './Note.module.scss';

interface IProps {
  children: React.ReactNode;
  center?: boolean;
  marginTop?: number;
  marginBottom?: number;
}

export default (props: IProps) => {
  const className = classes.note + ' ' + (props.center ? classes.center : '');
  return (
    <div
      className={className}
      style={{ marginTop: props.marginTop || 0, marginBottom: props.marginBottom || 0 }}>
      {props.children}
    </div>
  );
};
