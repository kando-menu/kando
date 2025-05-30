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

import SettingsRow from './SettingsRow';

import * as classes from './Dropdown.module.scss';

interface IProps<T extends string> {
  /** Function to call when the selected option changes. */
  onChange?: (value: T) => void;

  /**
   * Array of options to display in the dropdown. Each option has a value and a label.
   * Both the values here and the initialValue of the component must use the same type.
   */
  options: { value: T; label: string }[];

  /** Initial value of the dropdown. */
  initialValue: T;

  /** Optional label text to display next to the dropdown. */
  label?: string;

  /** Optional additional information to display next to the label. */
  info?: string;

  /** Whether the dropdown is disabled. Defaults to false. */
  disabled?: boolean;

  /** Optional minimum width of the dropdown. */
  minWidth?: number;

  /** Optional maximum width of the dropdown. */
  maxWidth?: number;
}

/**
 * A customizable dropdown component.
 *
 * @param props - The properties for the dropdown component.
 * @returns A dropdown element.
 */
export default function Dropdown<T extends string>(props: IProps<T>) {
  const invalidSelection =
    props.options.find((option) => option.value === props.initialValue) === undefined;

  const selectRef = React.useRef<HTMLSelectElement>(null);

  // Handler to change dropdown value with scroll wheel.
  const handleWheel = (event: WheelEvent) => {
    if (props.disabled) {
      return;
    }

    const currentIdx = props.options.findIndex(
      (option) => option.value === props.initialValue
    );

    const newIdx = Math.min(
      Math.max(currentIdx + (event.deltaY > 0 ? 1 : -1), 0),
      props.options.length - 1
    );

    if (newIdx !== currentIdx && props.onChange) {
      props.onChange(props.options[newIdx].value);
    }

    event.preventDefault();
    event.stopPropagation();
  };

  // We cannot use react's onWheel event here, because it does not allow us to prevent the
  // default behavior of the wheel event. This is necessary to prevent the page from
  // scrolling when the user scrolls over the dropdown.
  React.useEffect(() => {
    const el = selectRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => el.removeEventListener('wheel', handleWheel);
  });

  return (
    <SettingsRow label={props.label} info={props.info} grow maxWidth={props.maxWidth}>
      <select
        ref={selectRef}
        className={classes.select}
        disabled={props.disabled}
        style={{ minWidth: props.minWidth }}
        value={invalidSelection ? '__invalid__' : props.initialValue}
        onChange={(event) => props.onChange && props.onChange(event.target.value as T)}>
        {
          // If the initial value is invalid, we add a placeholder option.
          invalidSelection && (
            <option hidden disabled value="__invalid__">
              {i18next.t('settings.invalid-dropdown-selection')}
            </option>
          )
        }
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </SettingsRow>
  );
}
