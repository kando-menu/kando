//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';

import * as classes from './Base64IconPicker.module.scss';

type Props = {
  /**
   * Function to call when the value changes. This will be called when the user entered a
   * valid base64 image string.
   */
  onChange?: (value: string) => void;

  /** Initial value of the base64 picker. */
  initialValue: string;
};

/**
 * This component is a textarea that allows the user to enter a base64 encoded image.
 *
 * @param props - The properties for the icon picker component.
 * @returns A textarea element that allows the user to enter a base64 encoded image.
 */
export default function Base64IconPicker(props: Props) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = React.useState('');

  const isValidBase64Image = async (base64: string) => {
    const img = new Image();
    img.src = base64;
    const valid = await new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });

    return valid;
  };

  // Update the value when the initialValue prop changes. This is necessary because the
  // initialValue prop might change after the component has been initialized.
  React.useEffect(() => {
    isValidBase64Image(props.initialValue).then((valid) => {
      if (valid) {
        setValue(props.initialValue);
      }
    });
  }, [props.initialValue]);

  const onChange = (text: string) => {
    setValue(text);

    isValidBase64Image(text).then((valid) => {
      if (valid) {
        textareaRef.current.classList.remove(classes.invalid);
        props.onChange?.(text);
      } else {
        textareaRef.current.classList.add(classes.invalid);
      }
    });
  };

  return (
    <textarea
      className={classes.picker}
      value={value}
      ref={textareaRef}
      onChange={(e) => onChange(e.target.value)}
      spellCheck="false"
      placeholder={[
        i18next.t('settings.icon-picker-dialog.base64-example'),
        'data:image/svg+xml;base64,...',
        '',
        i18next.t('settings.icon-picker-dialog.file-example'),
        'file:///path/to/icon.png',
        '',
        i18next.t('settings.icon-picker-dialog.url-example'),
        'https://cdn.simpleicons.org/simpleicons/white',
      ].join('\n')}
    />
  );
}
