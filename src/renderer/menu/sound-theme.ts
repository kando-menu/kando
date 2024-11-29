//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Howl } from 'howler';

import { ISoundThemeDescription, SoundType } from '../../common';

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
   * Loads the given theme description.
   *
   * @param description The description of the sound theme to load.
   */
  public loadDescription(description: ISoundThemeDescription) {
    this.description = description;
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
      const volume = (sound.volume || 1) * this.volume;
      const src =
        'file://' +
        this.description.directory +
        '/' +
        this.description.id +
        '/' +
        sound.file;
      const minRate = sound.minPitch || 1;
      const maxRate = sound.maxPitch || 1;
      const rate = Math.random() * (maxRate - minRate) + minRate;

      try {
        new Howl({ src: [src], volume, rate }).play();
      } catch (error) {
        window.api.log(`Error playing sound ${type}: ${error}`);
      }
    }
  }
}
