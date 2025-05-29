//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * A utility class to manage focus trapping for modals and popovers. Ensures that only the
 * top-most component traps focus.
 */
class FocusTrapManager {
  /** A stack to keep track of active elements trapping focus. */
  private static stack: HTMLElement[] = [];

  /**
   * Adds an element to the focus trap stack.
   *
   * @param element - The element to add to the stack.
   */
  static add(element: HTMLElement) {
    this.stack.push(element);
  }

  /**
   * Removes an element from the focus trap stack.
   *
   * @param element - The element to remove from the stack.
   */
  static remove(element: HTMLElement) {
    this.stack = this.stack.filter((el) => el !== element);
  }

  /**
   * Checks if the given element is the top-most element in the stack.
   *
   * @param element - The element to check.
   * @returns True if the element is the top-most, false otherwise.
   */
  static isTopMost(element: HTMLElement): boolean {
    return this.stack[this.stack.length - 1] === element;
  }
}

export default FocusTrapManager;
