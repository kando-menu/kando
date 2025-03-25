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
  // We store for each icon theme the icon which was selected last. Whenever a new theme is
  // selected, we check if the current icon is available in the new theme. If not, we use the
  // value from the icon map.
  const [iconMap, setIconMap] = React.useState(new Map<string, string>());
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [filterTerm, setFilterTerm] = React.useState('');

  const pickerInfo = IconThemeRegistry.getInstance().getIconPickerInfo(props.theme);

  // Store the selected icon for each theme in the icon map.
  const onChange = (icon: string, theme: string) => {
    const newIconMap = new Map(iconMap);
    newIconMap.set(theme, icon);
    setIconMap(newIconMap);

    console.log('Icon map:', newIconMap);

    if (props.onChange) {
      props.onChange(icon, theme);
    }
  };

  const getPicker = () => {
    if (pickerInfo.type === 'list') {
      // If the icon is not available in the new theme, we use the value from the icon map
      // (which was the icon selected last time). If no icon was selected for this theme
      // before, we use the first icon from the list.
      let icon = props.icon;
      const allIcons = IconThemeRegistry.getInstance()
        .getTheme(props.theme)
        .iconPickerInfo.listIcons('');
      if (!allIcons.includes(icon)) {
        const iconMapValue = iconMap.get(props.theme);
        if (iconMapValue) {
          console.log('Using icon from icon map:', iconMapValue);
          icon = iconMapValue;
        } else {
          console.log('Using default icon:', allIcons[0]);
          icon = allIcons[0];
        }
      } else {
        console.log('Using selected icon:', icon);
      }

      return (
        <GridIconPicker
          theme={props.theme}
          selectedIcon={icon}
          filterTerm={filterTerm}
          onChange={(value) => onChange(value, props.theme)}
          onClose={() => {
            setIsPopoverOpen(false);
          }}
        />
      );
    } else if (pickerInfo.type === 'base64') {
      return (
        <Base64IconPicker
          initialValue={props.icon}
          onChange={(value) => onChange(value, props.theme)}
        />
      );
    }
    return <></>;
  };

  return (
    <Popover
      visible={isPopoverOpen}
      onClickOutside={() => {
        onChange(props.icon, props.theme);
        setIsPopoverOpen(false);
      }}
      position="bottom"
      content={
        <div className={classes.container}>
          <div className={classes.row}>
            <select
              value={props.theme}
              onChange={(event) => onChange(props.icon, event.target.value)}>
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
          <Note marginTop={10}>
            <div
              dangerouslySetInnerHTML={{
                // eslint-disable-next-line @typescript-eslint/naming-convention
                __html: pickerInfo.hint ? pickerInfo.hint : '',
              }}
            />
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
};
