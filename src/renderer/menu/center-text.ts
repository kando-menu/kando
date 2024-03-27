//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IVec2 } from '../../common';

/**
 * This class is used to display the text in the center of the pie menu.
 *
 * Properly wrapping text inside a circular area is surprisingly difficult. It can be done
 * using the CSS `shape-outside` property, but this only works for floating elements. As a
 * consequence, it is impossible possible to vertically center the text inside the circle
 * using CSS only (see this for an explanation: https://stackoverflow.com/a/46228534). And
 * even with JavaScript this does not get much easier. It would require some kind of
 * iterative approach to find the ideal top padding for the text.
 *
 * A potential approach would be to wrap the text in a square-shaped div instead. However,
 * this leads to excessive padding on the left and right side of the text. This looks
 * weird especially if the text would fit into one line.
 *
 * Instead, we wrap the text in a rectangular container. The width of the container is
 * determined by the number of lines required for the text. If there is only one line, the
 * div will be wider than if it has to wrap the text over multiple lines:
 *
 *             , - ~ ~ ~ - ,                                  , - ~ ~ ~ - ,
 *         , '               ' ,                          , '               ' ,
 *       ,                       ,                      ,  ,-----------------,  ,
 *      ,                         ,                    ,   |                 |   ,
 *     , ,-----------------------, ,                  ,    |                 |    ,
 *     , |                       | ,                  ,    |                 |    ,
 *     , '-----------------------' ,                  ,    |                 |    ,
 *      ,                         ,                    ,   |                 |   ,
 *       ,                       ,                      ,  '-----------------'  ,
 *         ,                  , '                         ,                  , '
 *           ' - , _ _ _ ,  '                               ' - , _ _ _ ,  '
 *
 * We will also ensure that the rectangle is always wider than it is high.
 *
 * Overall, this is not perfect, but it works well enough for our purposes. If anyone
 * comes up with a more elegant solution, please let me know! Also, this is not ideal
 * performance-wise as we have to query the bounding box of the text element multiple
 * times every time the text changes.
 */
export class CenterText {
  /**
   * The div that contains the text. It will be positioned absolutely and translated
   * relative to the center of the pie menu's root element.
   */
  private div: HTMLDivElement;

  /** We query this once to compute the amount of lines which fit into the circle. */
  private lineHeight: number = 0;

  /** The diameter of the circle in which the text is displayed. */
  private maxWidth: number = 0;

  /** The computed width and height of the text element. */
  private width: number = 0;
  private height: number = 0;

  /**
   * The constructor creates the text element and appends it to the given container.
   *
   * @param container The parent element of the text element.
   * @param maxWidth The diameter of the circle in which the text is displayed.
   */
  constructor(container: HTMLElement, maxWidth: number) {
    this.div = document.createElement('div');
    this.div.classList.add('center-text');
    this.div.classList.add('hidden');

    container.appendChild(this.div);

    this.maxWidth = maxWidth;
  }

  /** This method shows the text element by removing the `hidden` class. */
  public show() {
    this.div.classList.remove('hidden');
  }

  /** This method hides the text element by adding the `hidden` class. */
  public hide() {
    this.div.classList.add('hidden');
  }

  /**
   * This method sets the text of the text element. The method computes the width and
   * height of the text element based on the text and the available space in the circle.
   *
   * @param text The text to display.
   */
  public setText(text: string) {
    this.div.innerHTML = text;

    // We query the line height only once.
    if (this.lineHeight === 0) {
      this.lineHeight = parseInt(window.getComputedStyle(this.div).lineHeight, 10);
    }

    // We only allow text areas with a aspect ratio >= 1.
    const maxHeight = this.maxWidth / Math.SQRT2;
    const maxLines = Math.floor(maxHeight / this.lineHeight);

    // We first assume that the text fits into one line. We compute the maximum available
    // width for this line and then check if the text actually fits into this width. If
    // not, we increase the number of lines and try again.
    let targetLines = 1;

    while (targetLines <= maxLines) {
      this.height = this.lineHeight * targetLines;
      this.width = Math.sqrt(this.maxWidth * this.maxWidth - this.height * this.height);

      this.div.style.width = `${this.width}px`;
      this.div.style.height = 'auto';

      // Get number of lines required to fit the text. This is a pretty expensive
      // operation, but we have to do it.
      const bounds = this.div.getBoundingClientRect();
      const actualLines = Math.ceil(bounds.height / this.lineHeight);

      // If the text fits into the available space, we are done.
      if (actualLines <= targetLines) {
        break;
      }

      // Else we try again with one more line.
      targetLines++;
    }

    // We set explicit set the height of the div to hide any potential overflow.
    this.div.style.height = `${this.height}px`;
  }

  /**
   * This method sets the position of the text element. The position is relative to the
   * container element given in the constructor.
   *
   * @param position The position of the text element.
   */
  public setPosition(position: IVec2) {
    this.div.style.transform = `translate(${position.x - this.width / 2}px, ${position.y - this.height / 2}px)`;
  }
}
