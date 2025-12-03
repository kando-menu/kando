//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from '../../settings-window-api';
declare const window: WindowWithAPIs;

import React from 'react';
import i18next from 'i18next';
import { TbBackspaceFilled, TbReload } from 'react-icons/tb';

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

type Props = {
  /** Function to call when the color is changed. */
  readonly onChange?: (icon: string, theme: string) => void;

  /** Name of the icon. */
  readonly icon: string;

  /** Name of the icon theme. */
  readonly theme: string;

  /** The size of the icon. */
  readonly iconSize?: number | string;

  /** Size of the button. Defaults to 'medium'. */
  readonly buttonSize?: 'small' | 'medium' | 'large';

  /** Forwarded to the button component. */
  readonly isGrouped?: boolean;

  /** Forwards the variant to the button component. Defaults to 'secondary'. */
  readonly variant?: 'primary' | 'secondary' | 'flat' | 'tool' | 'floating';
};

/**
 * A customizable color button component.
 *
 * @param props - The properties for the color button component.
 * @returns A color button element.
 */
export default function IconChooserButton(props: Props) {
  const [reloadCount, setReloadCount] = React.useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [filterTerm, setFilterTerm] = React.useState('');
  const [theme, setTheme] = React.useState(props.theme);

  React.useEffect(() => {
    setTheme(props.theme);
  }, [props.theme]);

  // Reload the icon pickers when the icon themes are reloaded.
  React.useEffect(() => {
    const onReload = () => {
      setReloadCount((count) => count + 1);
    };

    IconThemeRegistry.getInstance().on('reload-icon-themes', onReload);
    return () => {
      IconThemeRegistry.getInstance().off('reload-icon-themes', onReload);
    };
  }, []);

  const pickerInfo = IconThemeRegistry.getInstance().getIconPickerInfo(theme);

  const getPicker = () => {
    if (pickerInfo.type === 'list') {
      return (
        <GridIconPicker
          key={`${theme}-${reloadCount}`}
          filterTerm={filterTerm}
          selectedIcon={props.icon}
          theme={theme}
          onChange={(value) => props.onChange(value, theme)}
          onClose={() => setIsPopoverOpen(false)}
        />
      );
    } else if (pickerInfo.type === 'base64') {
      return (
        <Base64IconPicker
          key={`${theme}-${reloadCount}`}
          initialValue={props.icon}
          onChange={(value) => props.onChange(value, theme)}
        />
      );
    }
    return null;
  };

  const allThemes = Array.from(
    IconThemeRegistry.getInstance().getThemes().entries()
  ).sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <Popover
      content={
        <div className={classes.container}>
          <div className={classes.row}>
            <div className={classes.iconThemeSelector}>
              <Dropdown
                initialValue={theme}
                options={allThemes.map(([key, name]) => ({
                  value: key,
                  label: name.name,
                }))}
                onChange={setTheme}
              />
              <Button
                isGrouped
                icon={<TbReload />}
                tooltip={i18next.t('settings.icon-picker-dialog.reload-button-tooltip')}
                onClick={() => {
                  window.settingsAPI.reloadIconThemes();
                }}
              />
            </div>
            {pickerInfo.type === 'list' && (
              <div className={classes.searchInput}>
                <input
                  placeholder={i18next.t(
                    'settings.icon-picker-dialog.search-placeholder'
                  )}
                  type="text"
                  value={filterTerm}
                  onChange={(event) => {
                    setFilterTerm(event.target.value);
                  }}
                />
                <Button
                  isGrouped
                  icon={<TbBackspaceFilled />}
                  onClick={() => {
                    setFilterTerm('');
                  }}
                />
              </div>
            )}
          </div>
          {getPicker()}
          <Note useMarkdown marginTop={10}>
            {pickerInfo.hint ||
              i18next.t('settings.icon-picker-dialog.hint', {
                link: 'https://kando.menu/icon-themes/',
              })}
          </Note>
        </div>
      }
      isVisible={isPopoverOpen}
      position="bottom"
      onClose={() => setIsPopoverOpen(false)}>
      <Button
        icon={<ThemedIcon name={props.icon} size={props.iconSize} theme={props.theme} />}
        isGrouped={props.isGrouped}
        size={props.buttonSize}
        variant={props.variant}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      />
    </Popover>
  );
}
