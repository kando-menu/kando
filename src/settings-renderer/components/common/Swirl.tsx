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
const swirl4 = require('../../../../assets/images/swirl4.svg');

interface IProps {
  variant: '1' | '2' | '3' | '4';
  marginTop?: number;
  marginBottom?: number;
  width?: number | string;
}

/**
 * Swirl component displays a decorative swirl image based on the variant specified.
 *
 * @param props The properties for the swirl component.
 * @returns An image element displaying the selected swirl variant.
 */
export default function Swirl(props: IProps) {
  const swirls = {
    swirl1,
    swirl2,
    swirl3,
    swirl4,
  };

  const swirlKey = `swirl${props.variant}` as keyof typeof swirls;

  return (
    <img
      src={swirls[swirlKey]}
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
}
