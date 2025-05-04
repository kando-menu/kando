//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IVec2 } from '../common';

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
 * times every time the text changes. We do this asynchronously using an
 * IntersectionObserver to avoid blocking the main thread, however, this is still not
 * ideal.
 */
export class CenterText {
  /**
   * The div that contains the text. It will be positioned absolutely and translated
   * relative to the center of the pie menu's root element.
   */
  private div: HTMLDivElement;

  /** We query this once to compute the amount of lines which fit into the circle. */
  private lineHeight: number = 0;

  /**
   * The constructor creates the text element and appends it to the given container.
   *
   * @param container The parent element of the text element.
   * @param maxWidth The diameter of the circle in which the text is displayed.
   */
  constructor(
    private container: HTMLElement,
    private maxWidth: number
  ) {
    this.div = this.createTextDiv();
    this.container.appendChild(this.div);
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
   * The text is updated asynchronously, so it will not be updated immediately.
   *
   * @param text The text to display.
   */
  public async setText(text: string) {
    // We query the line height only once for performance reasons.
    if (this.lineHeight === 0) {
      this.lineHeight = parseInt(window.getComputedStyle(this.div).lineHeight, 10);
    }

    // We use a temporary div to compute the optimum width and height of the text element
    // to avoid any flickering.
    const tmpDiv = this.createTextDiv();
    tmpDiv.textContent = text;
    tmpDiv.style.visibility = 'hidden';
    tmpDiv.style.position = 'absolute';
    this.container.appendChild(tmpDiv);

    // We only allow text areas with a aspect ratio >= 1.
    const maxHeight = this.maxWidth / Math.SQRT2;
    const maxLines = Math.floor(maxHeight / this.lineHeight);

    // We first assume that the text fits into one line. We compute the maximum available
    // width for this line and then check if the text actually fits into this width. If
    // not, we increase the number of lines and try again.
    let targetLines = 1;
    let width = 0;
    let height = 0;

    while (targetLines <= maxLines) {
      height = this.lineHeight * targetLines;
      width = Math.sqrt(this.maxWidth * this.maxWidth - height * height);

      tmpDiv.style.width = `${width}px`;
      tmpDiv.style.height = 'auto';

      // Get number of lines required to fit the text.
      const bounds = await this.getBoundingClientRectAsync(tmpDiv);
      const actualLines = Math.floor(bounds.height / this.lineHeight);

      // If the text fits into the available space, we are done.
      if (actualLines <= targetLines) {
        break;
      }

      // Else we try again with one more line.
      targetLines++;
    }

    // We remove the temporary div again. There are cases where the container got cleared
    // before the promise resolved, so we have to check if the div is still in the DOM.
    if (tmpDiv.parentElement) {
      this.container.removeChild(tmpDiv);

      // We set the computed values to the actual text element.
      this.div.textContent = text;
      this.div.style.width = `${width}px`;
      this.div.style.height = `${height}px`;
      this.div.style.top = `${-height / 2}px`;
      this.div.style.left = `${-width / 2}px`;
    }
  }

  /**
   * This method sets the position of the text element. The position is relative to the
   * container element given in the constructor.
   *
   * @param position The position of the text element.
   */
  public setPosition(position: IVec2) {
    this.div.style.transform = `translate(${position.x}px, ${position.y}px)`;
  }

  /**
   * This method creates the text element. The element is hidden by default.
   *
   * @returns The created text element.
   */
  private createTextDiv(): HTMLDivElement {
    const div = document.createElement('div');
    div.classList.add('center-text');
    div.classList.add('hidden');
    return div;
  }

  /**
   * This method returns the bounding box of the given element. We use an
   * IntersectionObserver to do this asynchronously.
   *
   * @param element The element to get the bounding box of.
   * @returns A promise that resolves to the bounding box of the element.
   */
  private getBoundingClientRectAsync(element: HTMLElement): Promise<DOMRectReadOnly> {
    return new Promise((resolve) => {
      const observer = new IntersectionObserver((entries) => {
        observer.disconnect();
        resolve(entries[0].boundingClientRect);
      });
      observer.observe(element);
    });
  }
}
