//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * Sound themes can define different sounds for different actions. This enum is used to
 * identify the different sounds.
 */
export enum SoundType {
  eOpenMenu = 'openMenu',
  eCloseMenu = 'closeMenu',
  eSelectItem = 'selectItem',
  eSelectSubmenu = 'selectSubmenu',
  eSelectParent = 'selectParent',
  eHoverItem = 'hoverItem',
  eHoverSubmenu = 'hoverSubmenu',
  eHoverParent = 'hoverParent',
}

/**
 * This interface is used to describe a sound effect. It contains the path to the sound
 * file and some optional properties like the volume and pitch shift.
 */
export interface ISoundEffect {
  /** The path to the sound file. */
  file: string;

  /** The volume of the sound. */
  volume?: number;

  /** The maximum pitch shift. */
  maxPitch?: number;

  /** The minimum pitch shift. */
  minPitch?: number;
}

/**
 * This interface is used to describe a sound theme. It contains the properties which can
 * be defined in the JSON file of a sound theme. All paths are relative to the theme
 * directory.
 */
export interface ISoundThemeDescription {
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

  /** The version of the Kando sound theme engine this theme is compatible with. */
  engineVersion: number;

  /** The license of the theme. For instance "CC-BY-4.0". */
  license: string;

  /**
   * All available sound effects. If a given sound is not defined here, no sound will be
   * played for the corresponding action.
   */
  sounds: Record<SoundType, ISoundEffect>;
}
