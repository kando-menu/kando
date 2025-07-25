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
   * Since updating the text element is a rather expensive operation, we use an invisible
   * staging div to compute the layout of the text element. Once the layout is computed,
   * we replace the previous text element with the staging div.
   */
  private stagingDiv: HTMLDivElement;

  /** We query this once to compute the amount of lines which fit into the circle. */
  private maxFontSize: number = -1;

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
  public async show(text: string, position: IVec2) {
    // If there is a staging div, a layout is already in progress. We remove it from the
    // DOM so that it will not be used anymore.
    if (this.stagingDiv) {
      this.stagingDiv.remove();
      this.stagingDiv = null;
    }

    // Computing the layout of the text is a rather expensive and slow operation. To avoid
    // any flickering, we create a staging div that is not visible until the layout is
    // computed. After the layout is computed, we remove the previous text element and
    // make the staging div visible.
    const stagingDiv = this.appendWithClass(this.container, 'center-text');
    stagingDiv.style.transform = `translate(${position.x}px, ${position.y}px)`;
    stagingDiv.style.visibility = 'hidden';
    stagingDiv.style.width = stagingDiv.style.height = `${this.diameter}px`;
    stagingDiv.style.left = stagingDiv.style.top = `-${this.diameter / 2}px`;

    // We keep a reference to the staging div so that we know that a layout is currently
    // in progress if this method is called again before we are done.
    this.stagingDiv = stagingDiv;

    // Add the divs for wrapping the text inside a circle.
    this.appendWithClass(stagingDiv, 'half-circle-wrap-left');
    this.appendWithClass(stagingDiv, 'half-circle-wrap-right');
    const textDiv = this.appendWithClass(stagingDiv, 'text');

    const p = document.createElement('p');
    p.textContent = text;
    textDiv.appendChild(p);

    // We query the initial font size only once for performance reasons.
    if (this.maxFontSize === -1) {
      this.maxFontSize = parseInt(window.getComputedStyle(p).fontSize, 10);
    }

    // First, reduce the font size until everything fits.
    const minFontSize = 8;
    let fontSize = this.maxFontSize;

    let textHeight = await this.getDivHeight(p);

    while (textHeight > this.diameter && fontSize > minFontSize) {
      fontSize = fontSize - 1;
      p.style.fontSize = `${fontSize}px`;
      textHeight = await this.getDivHeight(p);
    }

    // Now adjust the top margin of the text so that it is vertically centered in the circle.
    if (textHeight < this.diameter) {
      // Moving the text down so that the current height is centered in the circle
      // may also provide more space for the text to grow left and right, so the
      // text may fit on fewer lines. Hence check if the text height changed after
      // adjusting the margin top.
      let oldHeight = textHeight;
      let oldMarginTop = 0;

      for (let i = 0; i < 10; i++) {
        const marginTop = (this.diameter - textHeight) / 2;
        p.style.marginTop = `${(this.diameter - textHeight) / 2}px`;
        textHeight = await this.getDivHeight(p);

        // If the text height increased, we most likely moved the text too far. Let's
        // take the previous margin value.
        if (textHeight > oldHeight) {
          p.style.marginTop = `${oldMarginTop}px`;
          break;
        }

        // If the text height did not change, we are done.
        if (textHeight === oldHeight) {
          break;
        }

        oldHeight = textHeight;
        oldMarginTop = marginTop;
      }
    }

    // If a new layout computation was started while the current one was still in
    // progress, the staging was removed from the DOM. In this case, we do not need to
    // continue.
    if (stagingDiv.parentElement) {
      this.hide();
      this.div = stagingDiv;
      this.div.style.visibility = 'initial';
      this.stagingDiv = null;
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
