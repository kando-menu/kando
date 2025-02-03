//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

const swirl = require('../../../../assets/images/swirl1.svg');

interface IProps {
  marginTop?: number;
  marginBottom?: number;
  width?: number;
}

export default (props: IProps) => {
  return (
    <img
      src={swirl}
      width={props.width || 250}
      style={{
        opacity: 0.5,
        marginTop: props.marginTop || 0,
        marginBottom: props.marginBottom || 0,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    />
  );
};
