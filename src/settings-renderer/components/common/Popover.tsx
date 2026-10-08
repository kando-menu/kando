//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { createPortal } from 'react-dom';
import { CSSTransition } from 'react-transition-group';

import { FocusTrapManager } from '../../utils';

import * as classes from './Popover.module.scss';

type Props = {
  /** Whether the modal is visible. */
  readonly isVisible: boolean;

  /**
   * Called when the popover should be closed. This is the case when the user clicks
   * outside the popover area or presses ESC.
   */
  readonly onClose: () => void;

  /** Content to display inside the popover. */
  readonly content: React.ReactNode;

  /** Where the popover should be positioned. Defaults to 'top'. */
  readonly position?: 'top' | 'bottom';

  /** Flip or clamp large popovers to keep them inside the window. */
  readonly useViewportBounds?: boolean;

  /** The popover target. It will be used to position the popover relative to it. */
  readonly children: React.ReactNode;
};

/**
 * A simple popover component. When props.visible becomes true, the popover will be faded
 * in with a CSS transition. When it becomes false, the popover will be faded out and its
 * content will be unmounted. The popover will be mounted to the body element and
 * positioned relative to the children of the Popover component. The content of the
 * popover is given via the content property.
 *
 * @param props - The properties for the modal component.
 * @returns A popover element.
 */
export default function Popover(props: Props) {
  const { isVisible, position, onClose, useViewportBounds } = props;
  const popoverContent = React.useRef(null);
  const popoverTriangle = React.useRef(null);
  const popoverTarget = React.useRef(null);
  const pointerDownOutside = React.useRef(false);

  // Show the popover if props.visible is true.
  React.useEffect(() => {
    if (!isVisible || !popoverContent.current) {
      return;
    }

    const updatePosition = () => {
      // Position the popover above or below the target element.
      const triangleSize = 10;
      const windowPadding = 10;
      const targetRect = popoverTarget.current.getBoundingClientRect();
      const contentRect = popoverContent.current.getBoundingClientRect();
      const xDiff = targetRect.left - contentRect.width / 2 + targetRect.width / 2;

      // Clamp to window bounds left and right.
      const clampedXDiff = Math.max(
        windowPadding,
        Math.min(window.innerWidth - contentRect.width - windowPadding, xDiff)
      );

      let yDiff = 0;

      const fitsBelow =
        targetRect.bottom + triangleSize + contentRect.height <=
        window.innerHeight - windowPadding;
      const fitsAbove =
        targetRect.top - triangleSize - contentRect.height >= windowPadding;
      const placeBelow = useViewportBounds
        ? position === 'bottom'
          ? fitsBelow || !fitsAbove
          : !fitsAbove && fitsBelow
        : position === 'bottom';

      if (placeBelow) {
        yDiff = targetRect.bottom + triangleSize;
        popoverTriangle.current.classList.add(classes.top);
        popoverTriangle.current.classList.remove(classes.bottom);
      } else {
        yDiff = targetRect.top - contentRect.height - triangleSize;
        popoverTriangle.current.classList.add(classes.bottom);
        popoverTriangle.current.classList.remove(classes.top);
      }

      if (useViewportBounds) {
        yDiff = Math.max(
          windowPadding,
          Math.min(window.innerHeight - contentRect.height - windowPadding, yDiff)
        );
        // If neither side fits, a centered overlay is more honest than a misplaced arrow.
        popoverTriangle.current.style.display = fitsAbove || fitsBelow ? '' : 'none';
      }
      popoverContent.current.style.top = `${yDiff}px`;
      popoverContent.current.style.left = `${clampedXDiff}px`;
      popoverTriangle.current.style.left = `${contentRect.width / 2 - triangleSize + xDiff - clampedXDiff}px`;
    };
    updatePosition();
    const observer = useViewportBounds ? new ResizeObserver(updatePosition) : null;
    observer?.observe(popoverContent.current);
    if (useViewportBounds) {
      window.addEventListener('resize', updatePosition);
    }

    // Set the flag if the pointer down occurred outside the popover and target.
    const handlePointerDown = (event: PointerEvent) => {
      pointerDownOutside.current =
        popoverContent.current &&
        !popoverContent.current.contains(event.target as Node) &&
        popoverTarget.current &&
        !popoverTarget.current.contains(event.target as Node);
    };

    // Dismiss the popover when the user clicks outside of it.
    const handleClick = (event: MouseEvent) => {
      // Ensure the click started outside the popover and target.
      if (
        pointerDownOutside.current &&
        popoverContent.current &&
        !popoverContent.current.contains(event.target as Node) &&
        popoverTarget.current &&
        !popoverTarget.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Dismiss the popover when the user presses ESC.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Get the first focusable element inside the popover when it becomes visible.
    const focusableElements = popoverContent.current?.querySelectorAll(
      'a, button:not(:disabled), input:not(:disabled), textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusableElement = focusableElements?.[0] as HTMLElement;

    // Trap focus within the popover.
    const handleFocusIn = (event: FocusEvent) => {
      if (
        popoverContent.current &&
        FocusTrapManager.isTopMost(popoverContent.current) &&
        !popoverContent.current.contains(event.target as Node)
      ) {
        firstFocusableElement?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    FocusTrapManager.add(popoverContent.current);

    const currentPopoverContent = popoverContent.current;

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      FocusTrapManager.remove(currentPopoverContent);
    };
  }, [onClose, isVisible, position, useViewportBounds]);

  return (
    <>
      <div ref={popoverTarget}>{props.children}</div>
      {createPortal(
        <CSSTransition
          unmountOnExit
          // The modal CSS class uses a 200ms transition when fading in and out, so we set the
          // timeout to 200ms to match this.
          classNames={{
            enter: classes.fadeEnter,
            enterDone: classes.fadeEnterDone,
          }}
          in={props.isVisible}
          nodeRef={popoverContent}
          timeout={200}>
          <div ref={popoverContent} className={classes.popover}>
            <div ref={popoverTriangle} className={classes.popoverTriangle} />
            {props.content}
          </div>
        </CSSTransition>,
        document.body
      )}
    </>
  );
}
