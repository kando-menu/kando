//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Howl } from 'howler';

import { ISoundThemeDescription } from '../../common';

/**
 * Sound themes can define different sounds for different actions. This enum is used to
 * identify the different sounds.
 */
export enum SoundType {
  eOpenMenu = 'openMenu',
  eCloseMenu = 'closeMenu',
  eSelectItem = 'selectItem',
  eHoverItem = 'hoverItem',
}

/** This class is responsible for loading a sound theme and playing sounds. */
export class SoundTheme {
  /**
   * The current theme description. When the user changes the theme, this will be updated
   * via the `loadDescription` method.
   */
  private description: ISoundThemeDescription;

  /** The current volume. */
  private volume: number = 0.5;

  /**
   * Creates a new MenuTheme. This will register the custom CSS properties used by the
   * theme.
   */
  constructor() {}

  /**
   * Loads the given theme description.
   *
   * @param description The description of the sound theme to load.
   */
  public loadDescription(description: ISoundThemeDescription) {
    this.description = description;
    window.api.log(JSON.stringify(description));
  }

  /**
   * Sets the volume of the sound theme.
   *
   * @param volume The new volume.
   */
  public setVolume(volume: number) {
    this.volume = volume;
  }

  /**
   * Plays the sound associated with the given type.
   *
   * @param type The type of sound to play.
   */
  public playSound(type: SoundType) {
    const sound = this.description.sounds[type];
    if (sound) {
      const path =
        'file://' + this.description.directory + '/' + this.description.id + '/' + sound;
      try {
        new Howl({
          src: [path],
          volume: this.volume,
          rate: Math.random() * 0.2 + 0.9,
        }).play();
      } catch (error) {
        window.api.log(`Error playing sound ${type}: ${error}`);
      }
    }
  }
}
