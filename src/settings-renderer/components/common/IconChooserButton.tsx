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
import { TbBackspaceFilled } from 'react-icons/tb';

import {
  Popover,
  ThemedIcon,
  Button,
  Note,
  Base64IconPicker,
  GridIconPicker,
  Dropdown,
} from '.';

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
export default function IconChooserButton(props: IProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [filterTerm, setFilterTerm] = React.useState('');
  const [theme, setTheme] = React.useState(props.theme);

  React.useEffect(() => {
    setTheme(props.theme);
  }, [props.theme]);

  const pickerInfo = IconThemeRegistry.getInstance().getIconPickerInfo(theme);

  const getPicker = () => {
    if (pickerInfo.type === 'list') {
      return (
        <GridIconPicker
          theme={theme}
          selectedIcon={props.icon}
          filterTerm={filterTerm}
          onChange={(value) => props.onChange(value, theme)}
          onClose={() => setIsPopoverOpen(false)}
        />
      );
    } else if (pickerInfo.type === 'base64') {
      return (
        <Base64IconPicker
          initialValue={props.icon}
          onChange={(value) => props.onChange(value, theme)}
        />
      );
    }
    return <></>;
  };

  const allThemes = Array.from(
    IconThemeRegistry.getInstance().getThemes().entries()
  ).sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <Popover
      visible={isPopoverOpen}
      onClose={() => setIsPopoverOpen(false)}
      position="bottom"
      content={
        <div className={classes.container}>
          <div className={classes.row}>
            <Dropdown
              options={allThemes.map(([key, name]) => ({
                value: key,
                label: name.name,
              }))}
              initialValue={theme}
              onChange={setTheme}
            />
            {pickerInfo.type === 'list' && (
              <div className={classes.searchInput}>
                <input
                  type="text"
                  placeholder={i18next.t(
                    'settings.icon-picker-dialog.search-placeholder'
                  )}
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
          <Note marginTop={10} markdown>
            {pickerInfo.hint ||
              i18next.t('settings.icon-picker-dialog.hint', {
                link: 'https://kando.menu/icon-themes/',
              })}
          </Note>
        </div>
      }>
      <Button
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        grouped={props.grouped}
        variant={props.variant}
        size={props.buttonSize}
        icon={<ThemedIcon name={props.icon} theme={props.theme} size={props.iconSize} />}
      />
    </Popover>
  );
}
