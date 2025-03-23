//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { TbBackspaceFilled } from 'react-icons/tb';

import Popover from './Popover';
import ThemedIcon from './ThemedIcon';
import Button from './Button';
import Note from './Note';
import Base64IconPicker from './Base64IconPicker';
import GridIconPicker from './GridIconPicker';

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
  const [icon, setIcon] = React.useState(props.icon);
  const [theme, setTheme] = React.useState(props.theme);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [filterTerm, setFilterTerm] = React.useState('');

  React.useEffect(() => {
    setIcon(props.icon);
    setTheme(props.theme);
  }, [props.icon, props.theme]);

  const pickerInfo = IconThemeRegistry.getInstance().getIconPickerInfo(theme);

  const getPicker = () => {
    if (pickerInfo.type === 'list') {
      return (
        <GridIconPicker
          theme={theme}
          selectedIcon={icon}
          filterTerm={filterTerm}
          onChange={(value) => {
            setIcon(value);
            if (props.onChange) {
              props.onChange(value, theme);
            }
          }}
          onClose={() => {
            setIsPopoverOpen(false);
          }}
        />
      );
    } else if (pickerInfo.type === 'base64') {
      return (
        <Base64IconPicker
          initialValue={icon}
          onChange={(value) => {
            setIcon(value);
            if (props.onChange) {
              props.onChange(value, theme);
            }
          }}
        />
      );
    }
    return <></>;
  };

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
          <div className={classes.row}>
            <select value={theme} onChange={(event) => setTheme(event.target.value)}>
              {Array.from(IconThemeRegistry.getInstance().getThemes().entries()).map(
                ([key, name]) => (
                  <option key={key} value={key}>
                    {name.name}
                  </option>
                )
              )}
            </select>
            {pickerInfo.type === 'list' && (
              <div className={classes.searchInput}>
                <input
                  type="text"
                  placeholder="Search icons..."
                  value={filterTerm}
                  onChange={(event) => {
                    setFilterTerm(event.target.value);
                  }}
                />
                <Button
                  grouped
                  icon={<TbBackspaceFilled />}
                  onClick={() => {
                    setFilterTerm('');
                  }}
                />
              </div>
            )}
          </div>
          {getPicker()}
          <Note>
            <div
              dangerouslySetInnerHTML={
                // eslint-disable-next-line @typescript-eslint/naming-convention
                { __html: pickerInfo.hint }
              }
            />
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
