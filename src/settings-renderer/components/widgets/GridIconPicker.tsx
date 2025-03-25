//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import classNames from 'classnames/bind';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid } from 'react-window';

import { IconThemeRegistry } from '../../../common/icon-themes/icon-theme-registry';
import ThemedIcon from './ThemedIcon';

import * as classes from './GridIconPicker.module.scss';
import { pick } from '@types/lodash';
const cx = classNames.bind(classes);

interface IProps {
  /** Function to call when a new icon is selected. */
  onChange?: (icon: string) => void;

  /** Function to call when the picker should be closed. */
  onClose?: () => void;

  /** Initially selected icon. */
  selectedIcon: string;

  /** The icon theme. */
  theme: string;

  /** The current filter term. */
  filterTerm: string;
}

/**
 * An icon picker which shows a virtualized grid of icons. The icons are loaded
 * asynchronously in batches to avoid blocking the UI thread. Also, icons are only shown
 * when they are scrolled into view. Overall, this allows for decent performance even with
 * a large number of icons.
 *
 * @param props - The properties for the icon picker component.
 * @returns A grid icon picker element.
 */
export default (props: IProps) => {
  const theme = IconThemeRegistry.getInstance().getTheme(props.theme);
  const fetchedIcons = theme.iconPickerInfo.listIcons(props.filterTerm);

  const columns = 8;
  const padding = 4;
  const rows = Math.ceil(fetchedIcons.length / columns);
  const iconSize = 61;

  interface ICellProps {
    style: React.CSSProperties;
    rowIndex: number;
    columnIndex: number;
  }

  const cell: React.FC<ICellProps> = ({ style, columnIndex, rowIndex }) => {
    const index = rowIndex * columns + columnIndex;

    if (index >= fetchedIcons.length) {
      return null;
    }

    const icon = fetchedIcons[index];

    return (
      <button
        className={cx({
          pickerIcon: true,
          selected: icon === props.selectedIcon,
        })}
        style={style}
        data-tooltip-id="main-tooltip"
        data-tooltip-content={icon}
        onClick={() => {
          if (props.onChange) {
            props.onChange(icon);
          }
        }}
        onDoubleClick={() => {
          if (props.onClose) {
            props.onClose();
          }
        }}>
        <ThemedIcon name={icon} theme={props.theme} size={iconSize - 2 * padding} />
      </button>
    );
  };

  return (
    <div style={{ flexGrow: 1, minHeight: 0 }}>
      <AutoSizer>
        {({ width, height }: { width: number; height: number }) => (
          <Grid
            columnCount={columns}
            rowCount={rows}
            columnWidth={iconSize}
            rowHeight={iconSize}
            height={height}
            width={width}>
            {cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
};
