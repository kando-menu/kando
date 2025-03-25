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
 * An icon picker which shows a virtualized grid of icons. Icons are only shown when they
 * are scrolled into view. Overall, this allows for decent performance even with a large
 * number of icons.
 *
 * @param props - The properties for the icon picker component.
 * @returns A grid icon picker element.
 */
export default (props: IProps) => {
  const gridRef = React.createRef<Grid>();
  const theme = IconThemeRegistry.getInstance().getTheme(props.theme);
  const fetchedIcons = theme.iconPickerInfo.listIcons(props.filterTerm);

  const columns = 8;
  const rows = Math.ceil(fetchedIcons.length / columns);
  const selectedIndex = fetchedIcons.findIndex((icon) => icon === props.selectedIcon);

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
          selected: index === selectedIndex,
        })}
        style={style}
        data-tooltip-id="main-tooltip"
        data-tooltip-content={icon}
        onClick={() => props.onChange(icon)}
        onDoubleClick={props.onClose}>
        <ThemedIcon name={icon} theme={props.theme} size={'80%'} />
      </button>
    );
  };

  // Scroll to the selected icon.
  React.useEffect(() => {
    console.log('Scrolling to selected icon', selectedIndex);
    if (gridRef.current) {
      console.log('Scrolling to selected icon', selectedIndex);
      gridRef.current.scrollToItem({
        columnIndex: selectedIndex % columns,
        rowIndex: Math.floor(selectedIndex / columns),
      });
    }
  }, []);

  return (
    <div style={{ flexGrow: 1, minHeight: 0 }}>
      <AutoSizer>
        {({ width, height }: { width: number; height: number }) => (
          <Grid
            ref={gridRef}
            columnCount={columns}
            rowCount={rows}
            columnWidth={width / columns - 1}
            rowHeight={width / columns - 1}
            height={height}
            width={width}>
            {cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
};
