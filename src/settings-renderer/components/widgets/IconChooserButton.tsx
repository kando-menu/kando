//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import Popover from './Popover';
import ThemedIcon from './ThemedIcon';
import Button from './Button';
import Note from './Note';

import { IconThemeRegistry } from '../../../common/icon-themes/icon-theme-registry';

import * as classes from './IconChooserButton.module.scss';

interface IProps {
  /** Function to call when the color is changed. */
  onChange?: (icon: string, theme: string) => void;

  /** Name of the icon. */
  icon: string;

  /** Name of the icon theme. */
  theme: string;

  /** The size of the icon. */
  iconSize?: number | string;

  /** Size of the button. Defaults to 'medium'. */
  buttonSize?: 'small' | 'medium' | 'large';

  /** Forwarded to the button component. */
  grouped?: boolean;

  /** Forwards the variant to the button component. Defaults to 'secondary'. */
  variant?: 'primary' | 'secondary' | 'flat' | 'tool' | 'floating';
}

/**
 * A customizable color button component.
 *
 * @param props - The properties for the color button component.
 * @returns A color button element.
 */
export default (props: IProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [icon, setIcon] = React.useState(props.icon);
  const [theme, setTheme] = React.useState(props.theme);

  React.useEffect(() => {
    setIcon(props.icon);
    setTheme(props.theme);
  }, [props.icon, props.theme]);

  const iconPickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (iconPickerRef.current && isPopoverOpen) {
      // const picker = IconThemeRegistry.getInstance().createIconPicker(theme);
      // iconPickerRef.current.innerHTML = '';
      // iconPickerRef.current.appendChild(picker.getFragment());
      // console.log('iconPickerRef.current', iconPickerRef.current);
      // picker.init(icon);
    }
  }, [props.theme, props.icon, isPopoverOpen]);

  return (
    <Popover
      visible={isPopoverOpen}
      onClickOutside={() => {
        if (props.onChange) {
          props.onChange(icon, theme);
        }
        setIsPopoverOpen(false);
      }}
      position="bottom"
      content={
        <div className={classes.container}>
          <Note>
            Font Icons are monochrome but can be colored by your menu theme. All other
            icon types can be colorful but will not be recolored. Learn how to add your
            own icons here.
          </Note>
        </div>
      }>
      <Button
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        grouped={props.grouped}
        variant={props.variant}
        size={props.buttonSize}
        icon={<ThemedIcon name={icon} theme={theme} size={props.iconSize} />}
      />
    </Popover>
  );
};
