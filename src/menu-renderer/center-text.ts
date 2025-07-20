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
  
  private static _originalFontSize: number = 0;

  /**
   * getBoundingClientRectAsync() takes relatively a lot of time and we call it in a loop, 
   * so to improve performance we cache calcualted width, height & fontSize, and then we just take them from the dictionary.
   * The key will be a word, and the value is a set of width, height & font fize.
   */
  static wordSizeDictionary: Record<string, [width: number, height: number, fontSize: number]> = {};

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
    /*
    Simon: 
    I think the absolute ideal approach would be this:
    - If the text fits in the circle using multiple lines, go for it.
    - If not, reduce the font size until it does.
    - Words should not be broken in the middle.

    So add lines as required and if that does not work, reduce the font size and start again with trying one line and then adding more as required.
    - So "Bookmarks" should be on one line with reduced font size (and not split in the middle of the word)
    - "Extra clipboard" should be on two lines with reduced size.
    */

    if (text in CenterText.wordSizeDictionary)
    {
      const [width, height, fontSize] = CenterText.wordSizeDictionary[text];
      this.setTextLocationAndFontSze(text, width, height, fontSize);
      return;
    }

    // We query the line height only once for performance reasons.
    if (this.lineHeight === 0) {
      this.lineHeight = parseInt(window.getComputedStyle(this.div).lineHeight, 10);
    }

    // We use a temporary div to compute the optimum width and height of the text element
    // to avoid any flickering.
    const tmpDiv            = this.createTextDiv();
    tmpDiv.textContent      = text;
    tmpDiv.style.visibility = 'hidden';
    tmpDiv.style.position   = 'absolute';
    tmpDiv.style.whiteSpace = 'nowrap'; // Prevent word breaking during measurement
    this.container.appendChild(tmpDiv);

    // We only allow text areas with an aspect ratio >= 1.
    const maxHeight = this.maxWidth / Math.SQRT2;
    const maxLines  = Math.floor(maxHeight / this.lineHeight);

    // Store original font size for iterative reduction
    if (CenterText._originalFontSize == 0)
      CenterText._originalFontSize = parseInt(window.getComputedStyle(this.div).fontSize, 10);

    let currentFontSize = CenterText._originalFontSize;
    let width    = 0;
    let height   = 0;
    let textFits = false;

    // Try different font sizes until text fits or minimum size reached
    while (currentFontSize >= 8 && !textFits) { // Minimum font size of 8px
        // Reset target lines for each font size attempt
        let targetLines = 1;
        
        while (targetLines <= maxLines) {
            height = this.lineHeight * targetLines;
            width  = Math.sqrt(this.maxWidth * this.maxWidth - height * height);

            // First, check if individual words fit within the width
            tmpDiv.style.width      = 'auto';
            tmpDiv.style.height     = 'auto';
            tmpDiv.style.fontSize   = `${currentFontSize}px`;
            tmpDiv.style.whiteSpace = 'nowrap'; // Ensure whole words are measured

            // Check if any word is too wide
            let wordsFit = true;
            const words  = text.split(/\s+/);

            for (const word of words) {
                tmpDiv.textContent = word;
                const wordBounds   = await this.getBoundingClientRectAsync(tmpDiv);
                
                if (wordBounds.width > width) {
                    wordsFit = false;
                    break;
                }
            }

            if (!wordsFit)
              break;

            // If words fit, check full text wrapping
            tmpDiv.textContent      = text;
            tmpDiv.style.width      = `${width}px`;
            tmpDiv.style.whiteSpace = 'normal'; // Allow wrapping at spaces
            const bounds            = await this.getBoundingClientRectAsync(tmpDiv);
            const actualLines       = Math.ceil(bounds.height / this.lineHeight);

            // If the text fits into the available space, we are done
            if (actualLines <= targetLines) {
                textFits = true;
                break;
            }

            // Try with one more line
            targetLines++;
        }

        // If text still doesn't fit, reduce font size and try again
        if (!textFits) {
            currentFontSize        -= 1; // Reduce font size by 1px
            // Update line height for new font size
            tmpDiv.style.fontSize   = `${currentFontSize}px`;
            tmpDiv.style.whiteSpace = 'nowrap';
            this.lineHeight         = parseInt(window.getComputedStyle(tmpDiv).lineHeight, 10);
        }
    }

    // We remove the temporary div again. There are cases where the container got cleared
    // before the promise resolved, so we have to check if the div is still in the DOM.
    if (tmpDiv.parentElement) {
      this.container.removeChild(tmpDiv);

      CenterText.wordSizeDictionary[text] = [width, height, currentFontSize];

      // We set the computed values to the actual text element
      this.setTextLocationAndFontSze(text, width, height, currentFontSize);
    }
  }

  private setTextLocationAndFontSze(text: string, width: number, height: number, fontSize: number)
  {
    this.div.textContent      = text;
    this.div.style.width      = `${width}px`;
    this.div.style.height     = `${height}px`;
    this.div.style.top        = `${-height / 2}px`;
    this.div.style.left       = `${-width / 2}px`;
    this.div.style.fontSize   = `${fontSize}px`;
    this.div.style.whiteSpace = 'normal'; // Allow wrapping at spaces for final display
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
