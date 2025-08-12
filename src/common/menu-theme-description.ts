//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * The description of a menu theme. These are the properties which can be defined in the
 * JSON file of a menu theme.
 */
export interface IMenuThemeDescription {
  /**
   * The ID of the theme. This is used to identify the theme in the settings file. It is
   * also the directory name of the theme and is set by Kando when loading the theme.json
   * file. So the path to the theme.json file is this.directory/this.id/theme.json.
   */
  id: string;

  /**
   * The absolute path to the directory where the theme is stored. This is set by Kando
   * when loading the theme.json file.
   */
  directory: string;

  /** A human readable name of the theme. */
  name: string;

  /** The author of the theme. */
  author: string;

  /** The version of the theme. Should be a semantic version string like "1.0.0". */
  themeVersion: string;

  /** The version of the Kando theme engine this theme is compatible with. */
  engineVersion: number;

  /** The license of the theme. For instance "CC-BY-4.0". */
  license: string;

  /**
   * The maximum radius in pixels of a menu when using this theme. This is used to move
   * the menu away from the screen edges when it's opened too close to them. Default is
   * 150px.
   */
  maxMenuRadius: number;

  /** The width of the text wrap in the center of the menu in pixels. Default is 90px. */
  centerTextWrapWidth: number;

  /**
   * If this is true, children of a menu item will be drawn below the parent. Otherwise
   * they will be drawn above. Default is true.
   */
  drawChildrenBelow: boolean;

  /**
   * If this is set to true, the center text of the menu will be drawn. This is the text
   * that is displayed in the center of the menu when it is opened. Default is true.
   */
  drawCenterText: boolean;

  /**
   * If this is set to true, a full-screen div will be drawn below the menu with the CSS
   * class "selection-wedges". If any menu item is hovered, it will also receive the class
   * "hovered" and the "--start-angle" and "--end-angle" CSS properties will indicate
   * where the selected child is. Default is false.
   */
  drawSelectionWedges: boolean;

  /**
   * If this is set to true, a full-screen div will be drawn below the menu with the CSS
   * class "wedge-separators". It will contain a div for each separator line between
   * adjacent wedges. They will have the "separator" class. Default is false.
   */
  drawWedgeSeparators: boolean;

  /**
   * These colors will be available as var(--name) in the CSS file and can be adjusted by
   * the user in the settings. The map assigns a default CSS color to each name.
   */
  colors: Record<string, string>;

  /**
   * The layers which are drawn on top of each other for each menu item. Each layer will
   * be a html div element with a class defined in the theme file. Also, each layer can
   * have a `content` property which can be used to make the layer contain the item's icon
   * or name.
   */
  layers: {
    class: string;
    content: 'none' | 'name' | 'icon';
  }[];
}
