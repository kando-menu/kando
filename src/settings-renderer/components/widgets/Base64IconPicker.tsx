//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './Base64IconPicker.module.scss';

interface IProps {
  /**
   * Function to call when the value changes. This will be called when the user entered a
   * valid base64 image string.
   */
  onChange?: (value: string) => void;

  /** Initial value of the base64 picker. */
  initialValue: string;
}

/**
 * This component is a textarea that allows the user to enter a base64 encoded image.
 *
 * @param props - The properties for the icon picker component.
 * @returns A textarea element that allows the user to enter a base64 encoded image.
 */
export default (props: IProps) => {
  const [value, setValue] = React.useState(props.initialValue);

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(() => setValue(props.initialValue.toString()), [props.initialValue]);

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    const img = new Image();
    img.src = newValue;
    const valid = await new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });

    if (valid) {
      e.target.classList.remove(classes.invalid);
      props.onChange?.(newValue);
    } else {
      e.target.classList.add(classes.invalid);
    }
  };

  return (
    <textarea
      className={classes.picker}
      value={value}
      onChange={handleChange}
      spellCheck="false"
      placeholder="data:image/svg;base64,..."
    />
  );
};
