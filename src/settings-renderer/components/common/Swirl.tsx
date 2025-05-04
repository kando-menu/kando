//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

const swirl1 = require('../../../../assets/images/swirl1.svg');
const swirl2 = require('../../../../assets/images/swirl2.svg');
const swirl3 = require('../../../../assets/images/swirl3.svg');

interface IProps {
  variant: '1' | '2' | '3';
  marginTop?: number;
  marginBottom?: number;
  width?: number | string;
}

export default (props: IProps) => {
  return (
    <img
      src={props.variant === '1' ? swirl1 : props.variant === '2' ? swirl2 : swirl3}
      style={{
        opacity: 0.5,
        marginTop: props.marginTop || 0,
        marginBottom: props.marginBottom || 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: props.width,
      }}
    />
  );
};
