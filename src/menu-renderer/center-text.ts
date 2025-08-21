//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Vec2 } from '../common';

/**
 * This class is used to display the text in the center of the pie menu.
 *
 * Properly wrapping text inside a circular area is surprisingly difficult. It can be done
 * using two half-circle `shape-outside` divs, but this only works for floating elements.
 * As a consequence, it is difficult to vertically center the text inside the circle using
 * CSS only (see this for an explanation: https://stackoverflow.com/a/46228534). Hence we
 * have to use an iterative approach to find the top padding which optimally positions the
 * text vertically.
 *
 * We also use an iterative approach to reduce the cont size in case the entire text does
 * not fit into the circle.
 *
 * Overall, this is not perfect, but it works well enough for our purposes. If anyone
 * comes up with a more elegant solution, please let me know! Also, this is not ideal
 * performance-wise as we have to query the height of the text element multiple times
 * every time the text changes. We do this asynchronously using an IntersectionObserver to
 * avoid blocking the main thread, however, this is still not ideal.
 */
export class CenterText {
  /**
   * The div that contains the wrap-shapes and the inner div with the text. It will be
   * positioned absolutely and translated relative to the center of the pie menu's root
   * element.
   */
  private div: HTMLDivElement;

  /**
   * We count the number of times the async `show` method is called to know whether it got
   * called while a previous call was still in progress. If this is the case, we will not
   * use the text element that was created for the previous call, but instead create a new
   * one.
   */
  private callCount: number = 0;

  /** We query this once to compute the amount of lines which fit into the circle. */
  private maxFontSize: number = -1;

  /**
   * This is used to cache the text elements so that we do not need to create new elements
   * every time the text changes.
   */
  private cache: { [key: string]: HTMLDivElement } = {};

  /**
   * @param container The parent element of the text element.
   * @param diameter The diameter of the circle in which the text is displayed.
   */
  constructor(
    private container: HTMLElement,
    private diameter: number
  ) {}

  /** Removes the current text from the container. */
  public hide() {
    this.div?.remove();
  }

  /**
   * Updates the center text. The method computes the optimum top padding to vertically
   * center the text. The text is updated asynchronously, so it will not be updated
   * immediately.
   *
   * @param text The text to display.
   * @param position The position of the text element relative to the container. Aka the
   *   current position of the pie menu on the screen.
   */
  public async show(text: string, position: Vec2) {
    const currentCallCount = ++this.callCount;

    // If the text is already cached, we can use it directly.
    if (this.cache[text]) {
      this.hide();
      this.div = this.cache[text];
      this.div.style.transform = `translate(${position.x}px, ${position.y}px)`;
      this.div.style.visibility = 'initial';
      this.container.appendChild(this.div);
      return;
    }

    // Computing the layout of the text is a rather expensive and slow operation. To avoid
    // any flickering, we create a staging div that is not visible until the layout is
    // computed. After the layout is computed, we remove the previous text element and
    // make the staging div visible.
    const stagingDiv = this.appendWithClass(this.container, 'center-text');
    stagingDiv.style.visibility = 'hidden';
    stagingDiv.style.width = stagingDiv.style.height = `${this.diameter}px`;
    stagingDiv.style.left = stagingDiv.style.top = `-${this.diameter / 2}px`;

    // Add the divs for wrapping the text inside a circle.
    this.appendWithClass(stagingDiv, 'half-circle-wrap-left');
    this.appendWithClass(stagingDiv, 'half-circle-wrap-right');
    const textDiv = this.appendWithClass(stagingDiv, 'text');

    // We want to allow breaking the text at some special characters like / and \ to
    // avoid long words, especially in the case of URLs. For this, we add invisible
    // spaces after these characters.
    const p = document.createElement('p');
    p.textContent = text.replace(/([/\\.])/g, '$1\u200B');
    textDiv.appendChild(p);

    // We query the initial font size only once for performance reasons.
    if (this.maxFontSize === -1) {
      this.maxFontSize = parseInt(window.getComputedStyle(p).fontSize, 10);
    }

    // First, we reduce the font size until everything fits. We set a minimum font
    // size to avoid the text becoming too small.
    const minFontSize = 0.7 * this.maxFontSize;
    let fontSize = this.maxFontSize;

    // We start with a small top margin to avoid the text being too close to the top of
    // the circle. Else, only one letter would fit into the first line.
    p.style.marginTop = `${fontSize * 0.5}px`;
    let textHeight = await this.getDivHeight(p);

    while (textHeight > this.diameter && fontSize > minFontSize) {
      fontSize = fontSize - 1;
      p.style.fontSize = `${fontSize}px`;
      textHeight = await this.getDivHeight(p);
    }

    // If the text height is still larger than the diameter, reducing the font size did
    // not help. As a last resort, we can try to enable text wrapping inside the words.
    if (textHeight > this.diameter) {
      p.style.wordBreak = 'break-all';
      textHeight = await this.getDivHeight(p);
    }

    // Now adjust the top margin of the text so that it is vertically centered in the
    // circle.
    if (textHeight < this.diameter) {
      // Moving the text down so that the current height is centered in the circle may
      // also provide more space for the text to grow left and right, so the text may fit
      // on fewer lines. Hence check if the text height changed after adjusting the top
      // margin top.
      let oldHeight = textHeight;

      // Ten iterations should be enough to find a good position for the text.
      for (let i = 0; i < 10; i++) {
        p.style.marginTop = `${(this.diameter - textHeight) / 2}px`;
        textHeight = await this.getDivHeight(p);

        // If the text height increased, we got into a tricky situation where the text is
        // hard to center. With the previous padding, fewer lines where used, so the text
        // was not centered, but if we move it down a bit, it requires more lines and is
        // not centered either anymore. This can happen if the last word is very long and
        // does not fit on the last line in the lower half of the circle. The only
        // solution here is to decrease the font size again.
        if (textHeight > oldHeight) {
          while (fontSize > minFontSize && textHeight > oldHeight) {
            fontSize = fontSize - 1;
            p.style.fontSize = `${fontSize}px`;
            textHeight = await this.getDivHeight(p);
          }

          break;
        }

        // If the text height did not change, we are done.
        if (textHeight === oldHeight) {
          break;
        }

        oldHeight = textHeight;
      }
    }

    // Cache the text element for future use.
    this.cache[text] = stagingDiv;

    // If no new layout computation was started while the current one was still in
    // progress, we can use the staging div as the new text element. Otherwise, we
    // remove the staging div from the DOM, as it is no longer needed.
    if (currentCallCount === this.callCount) {
      this.hide();
      this.div = stagingDiv;
      this.div.style.transform = `translate(${position.x}px, ${position.y}px)`;
      this.div.style.visibility = 'initial';
    } else {
      stagingDiv.remove();
    }
  }

  /**
   * This method returns the height of the given element. We use an IntersectionObserver
   * to do this asynchronously.
   *
   * @param element The element to get the height of.
   * @returns A promise that resolves to the height of the element.
   */
  private getDivHeight(element: HTMLElement): Promise<number> {
    return new Promise((resolve) => {
      const observer = new IntersectionObserver((entries) => {
        observer.disconnect();
        resolve(entries[0].boundingClientRect.height);
      });
      observer.observe(element);
    });
  }

  /**
   * Small helper to create div, add a class name and append it to the given container.
   *
   * @param container The element to attach the new element to.
   * @param className The class to apply.
   * @returns The newly created div.
   */
  private appendWithClass(container: HTMLElement, className: string) {
    const element = document.createElement('div');
    element.classList.add(className);
    container.appendChild(element);
    return element;
  }
}
