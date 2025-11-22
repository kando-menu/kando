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
import { SimpleIconsTheme } from '../../../common/icon-themes/simple-icons-theme';
import ThemedIcon from './ThemedIcon';

import * as classes from './GridIconPicker.module.scss';
const cx = classNames.bind(classes);

type Props = {
  /** Function to call whenever a new icon is selected. */
  readonly onChange?: (icon: string) => void;

  /**
   * Function to call when the picker should be closed. This is emitted if the user
   * double-clicks an icon.
   */
  readonly onClose?: () => void;

  /**
   * Initially selected icon. If this is not in the given theme, nothing will be selected.
   * If it is in the theme, it will be selected and the grid will scroll to the icon.
   */
  readonly selectedIcon: string;

  /** The icon theme. */
  readonly theme: string;

  /** The current filter term. Only icons matching this will be shown. */
  readonly filterTerm: string;
};

/**
 * An icon picker which shows a virtualized grid of icons. Icons are only shown when they
 * are scrolled into view. Overall, this allows for decent performance even with a large
 * number of icons.
 *
 * The icons are retrieved from the IconThemeRegistry using the given theme name.
 *
 * @param props - The properties for the icon picker component.
 * @returns A grid icon picker element.
 */
export default function GridIconPicker(props: Props) {
  const [gridInstance, setGridInstance] = React.useState<Grid | null>(null);

  // Listing the icons is expensive, so we only do it when the theme or filter term
  // changes.
  const fetchedIcons = React.useMemo(() => {
    const theme = IconThemeRegistry.getInstance().getTheme(props.theme);
    return { theme, icons: theme.iconPickerInfo.listIcons(props.filterTerm) };
  }, [props.theme, props.filterTerm]);

  const columns = 8;
  const rows = Math.ceil(fetchedIcons.icons.length / columns);
  const selectedIndex = fetchedIcons.icons.findIndex(
    (icon) => icon === props.selectedIcon
  );

  type CellProps = {
    style: React.CSSProperties;
    rowIndex: number;
    columnIndex: number;
  };

  const cell: React.FC<CellProps> = ({ style, columnIndex, rowIndex }) => {
    const index = rowIndex * columns + columnIndex;

    if (index >= fetchedIcons.icons.length) {
      return null;
    }

    const icon = fetchedIcons.icons[index];

    return (
      <button
        className={cx({
          pickerIcon: true,
          selected: index === selectedIndex,
        })}
        data-tooltip-content={
          // If the theme is a SimpleIconsTheme, we can use its getTitle method to
          // get a more descriptive title for the icon. Otherwise, we just use the
          // icon name.
          fetchedIcons.theme instanceof SimpleIconsTheme
            ? fetchedIcons.theme.getTitle(icon)
            : icon
        }
        data-tooltip-id="main-tooltip"
        style={style}
        type="button"
        onClick={() => props.onChange(icon)}
        onDoubleClick={props.onClose}>
        <ThemedIcon name={icon} size="80%" theme={props.theme} />
      </button>
    );
  };

  React.useEffect(() => {
    if (gridInstance && selectedIndex >= 0) {
      gridInstance.scrollToItem({
        align: 'center',
        columnIndex: selectedIndex % columns,
        rowIndex: Math.floor(selectedIndex / columns),
      });
    }
  }, [gridInstance, props.filterTerm]);

  return (
    <div style={{ flexGrow: 1, minHeight: 0 }}>
      <AutoSizer>
        {/* eslint-disable-next-line react/no-unused-prop-types */}
        {({ width, height }: { readonly width: number; readonly height: number }) => (
          <Grid
            ref={setGridInstance}
            columnCount={columns}
            columnWidth={width / columns - 1}
            height={height}
            overscanRowCount={10}
            rowCount={rows}
            rowHeight={width / columns - 1}
            width={width}>
            {cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
}
