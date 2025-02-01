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

import * as classes from './Popover.module.scss';

interface IProps {
  /** Whether the modal is visible. */
  visible: boolean;

  /** Called when the user clicks outside the popover area. */
  onClickOutside: () => void;

  /** Content to display inside the popover. */
  content: React.ReactNode;

  /** The popover target. It will be used to position the popover relative to it. */
  children: React.ReactNode;
}

/**
 * A simple popover component. When props.visible becomes true, the popover will be faded
 * in with a CSS transition. When it becomes false, the popover will be faded out and its
 * content will be unmounted. The popover will be mounted to the body element and
 * positioned relative to the children of the Popover component.
 *
 * @param props - The properties for the modal component.
 * @returns A popover element.
 */
export default (props: IProps) => {
  const popoverContent = React.useRef(null);
  const popoverTriangle = React.useRef(null);
  const popoverTarget = React.useRef(null);

  React.useEffect(() => {
    if (!props.visible) {
      return;
    }

    // Position the popover above the target element.
    const triangleSize = 10;
    const targetRect = popoverTarget.current.getBoundingClientRect();
    const contentRect = popoverContent.current.getBoundingClientRect();
    const yDiff = targetRect.top - contentRect.height - triangleSize;
    const xDiff = targetRect.left - contentRect.width / 2 + targetRect.width / 2;

    // Clamp to window bounds left and right. Vertical position is not clamped yet,
    // ideally we would position the popover below the target element if there is not
    // // enough space above it.
    const windowPadding = 10;
    const clampedXDiff = Math.max(
      windowPadding,
      Math.min(window.innerWidth - contentRect.width - windowPadding, xDiff)
    );

    popoverContent.current.style.top = `${yDiff}px`;
    popoverContent.current.style.left = `${clampedXDiff}px`;
    popoverTriangle.current.style.top = `${contentRect.height - 1}px`;
    popoverTriangle.current.style.left = `${contentRect.width / 2 - triangleSize + xDiff - clampedXDiff}px`;

    // Dismiss the popover when the user clicks outside of it.
    const handleClick = (event: MouseEvent) => {
      if (
        popoverContent.current &&
        !popoverContent.current.contains(event.target as Node)
      ) {
        props.onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [props.onClickOutside, props.visible]);

  return (
    <>
      <div ref={popoverTarget}>{props.children}</div>
      {createPortal(
        <CSSTransition
          in={props.visible}
          nodeRef={popoverContent}
          // The modal CSS class uses a 200ms transition when fading in and out, so we set the
          // timeout to 200ms to match this.
          timeout={200}
          classNames="popover"
          unmountOnExit>
          <div ref={popoverContent} className={classes.popover}>
            <div ref={popoverTriangle} className={classes.popoverTriangle} />
            {props.content}
          </div>
        </CSSTransition>,
        document.body
      )}
    </>
  );
};
