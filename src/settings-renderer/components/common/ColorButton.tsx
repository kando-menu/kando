//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { RgbaStringColorPicker } from 'react-colorful';
import chroma from 'chroma-js';

import * as classes from './ColorButton.module.scss';
import Popover from './Popover';

type Props = {
  /** Function to call when the color is changed. */
  readonly onChange?: (color: string) => void;

  /** Name of the color. Will be shown in the popover. */
  readonly name?: string;

  /** Initial color. */
  readonly color: string;
};

/**
 * A customizable color button component. Once clicked, a popover will open with a color
 * picker and an input field to enter a color.
 *
 * @param props - The properties for the color button component.
 * @returns A color button element.
 */
export default function ColorButton(props: Props) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [pickerColor, setPickerColor] = React.useState(chroma(props.color).css());
  const [cssColor, setCSSColor] = React.useState(chroma(props.color).css());
  const [inputColor, setInputColor] = React.useState(chroma(props.color).css());

  React.useEffect(() => {
    const color = chroma(props.color).css();
    setPickerColor(color);
    setCSSColor(color);
    setInputColor(color);
  }, [props.color]);

  return (
    <Popover
      content={
        <>
          {props.name ? <div className={classes.popoverHeader}>{props.name}</div> : null}
          <RgbaStringColorPicker
            color={pickerColor}
            onChange={(newColor) => {
              setPickerColor(newColor);
              const converted = chroma(newColor).css();
              setCSSColor(converted);
              setInputColor(converted);
            }}
          />
          <input
            className={classes.colorInput}
            type="text"
            value={inputColor}
            onChange={(event) => {
              setInputColor(event.target.value);
              try {
                setCSSColor(chroma(event.target.value).css());
              } catch (e) {
                // ignore
              }
            }}
          />
        </>
      }
      isVisible={isPopoverOpen}
      position="top"
      onClose={() => {
        if (props.onChange) {
          props.onChange(cssColor);
        }
        setIsPopoverOpen(false);
      }}>
      <div
        className={classes.colorButton}
        data-tooltip-content={props.name}
        data-tooltip-id="main-tooltip"
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
        <div className={classes.color} style={{ backgroundColor: cssColor }} />
      </div>
    </Popover>
  );
}
