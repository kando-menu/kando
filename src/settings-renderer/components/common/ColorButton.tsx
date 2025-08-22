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
  onChange?: (color: string) => void;

  /** Name of the color. Will be shown in the popover. */
  name?: string;

  /** Initial color. */
  color: string;
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
  const [cssColor, setCSSColor] = React.useState(chroma(props.color).css());
  const [inputColor, setInputColor] = React.useState(chroma(props.color).css());

  React.useEffect(() => {
    setCSSColor(chroma(props.color).css());
    setInputColor(chroma(props.color).css());
  }, [props.color]);

  return (
    <Popover
      visible={isPopoverOpen}
      onClose={() => {
        if (props.onChange) {
          props.onChange(cssColor);
        }
        setIsPopoverOpen(false);
      }}
      position="top"
      content={
        <>
          {props.name && <div className={classes.popoverHeader}>{props.name}</div>}
          <RgbaStringColorPicker
            color={cssColor}
            onChange={(newColor) => {
              const cssColor = chroma(newColor).css();
              setCSSColor(cssColor);
              setInputColor(cssColor);
            }}
          />
          <input
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
            className={classes.colorInput}
          />
        </>
      }>
      <div
        className={classes.colorButton}
        data-tooltip-id="main-tooltip"
        data-tooltip-content={props.name}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
        <div className={classes.color} style={{ backgroundColor: cssColor }} />
      </div>
    </Popover>
  );
}
