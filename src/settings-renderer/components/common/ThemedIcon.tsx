//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './ThemedIcon.module.scss';
import { IconThemeRegistry } from '../../../common/icon-themes/icon-theme-registry';

type Props = {
  /** The name of the icon. */
  name: string;

  /** The name of the icon theme to take the icon from. */
  theme: string;

  /** The size of the icon. */
  size?: number | string;
};

/**
 * A component which displays an icon from a Kando icon theme.
 *
 * @param props - The properties for the icon.
 * @returns An icon component.
 */
export default function ThemedIcon(props: Props) {
  const iconRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const iconElement = IconThemeRegistry.getInstance().createIcon(
      props.theme,
      props.name
    );
    if (iconRef.current) {
      iconRef.current.innerHTML = ''; // Clear any previous content.
      iconRef.current.appendChild(iconElement);
    }
  }, [props.theme, props.name]);

  return (
    <div
      style={{ minWidth: props.size, minHeight: props.size }}
      className={classes.icon}
      ref={iconRef}></div>
  );
}
