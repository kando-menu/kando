//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React, { ReactNode } from 'react';

import * as classes from './Preview.module.scss';

import Headerbar from './widgets/Headerbar';

interface IProps {
  headerButtons: ReactNode;
}

export default (props: IProps) => {
  return (
    <div className={classes.preview}>
      <Headerbar center={props.headerButtons} />
    </div>
  );
};
