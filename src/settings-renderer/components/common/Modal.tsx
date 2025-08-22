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
import { RiCloseLargeFill } from 'react-icons/ri';

import Headerbar from './Headerbar';
import Button from './Button';
import { FocusTrapManager } from '../../utils';

import * as classes from './Modal.module.scss';

type Props = {
  /** Whether the modal is visible. */
  visible: boolean;

  /** Function to call when the modal is requested to be closed. */
  onClose: () => void;

  /** Content to display inside the modal. */
  children: React.ReactNode;

  /**
   * Optional title to display in the header bar. The position of the title depends on the
   * platform:
   *
   * - On macOS, the title is displayed in the center of the header bar.
   * - On other platforms, the title is displayed on the left side of the header bar.
   */
  title?: string;

  /** Optional icon to display next to the title. */
  icon?: React.ReactNode;

  /** Maximum width of the modal. */
  maxWidth?: number;

  /** Padding to apply to the top of the modal content. */
  paddingTop?: number;

  /** Padding to apply to the bottom of the modal content. */
  paddingBottom?: number;

  /** Padding to apply to the left side of the modal content. */
  paddingLeft?: number;

  /** Padding to apply to the right side of the modal content. */
  paddingRight?: number;
};

/**
 * A customizable modal component. When props.visible becomes true, the modal will be
 * faded in with a CSS transition. When it becomes false, the modal will be faded out and
 * its content will be unmounted.
 *
 * If neither an icon nor a title is provided, the header bar will not be displayed.
 *
 * @param props - The properties for the modal component.
 * @returns A modal element.
 */
export default function Modal(props: Props) {
  const modalContent = React.useRef(null);
  const pointerDownOnBackground = React.useRef(false);

  React.useEffect(() => {
    // If the modal is not visible, we don't need to do anything.
    if (!props.visible || !modalContent.current) {
      return;
    }

    // Hide on escape.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (props.visible) {
          props.onClose();
        }
      }
    };

    // Get the first focusable element inside the modal when it becomes visible.
    const focusableElements = modalContent.current?.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusableElement = focusableElements?.[0] as HTMLElement;

    // Trap focus within the modal.
    const handleFocusIn = (event: FocusEvent) => {
      if (
        modalContent.current &&
        FocusTrapManager.isTopMost(modalContent.current) &&
        !modalContent.current.contains(event.target as Node)
      ) {
        firstFocusableElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    FocusTrapManager.add(modalContent.current);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      FocusTrapManager.remove(modalContent.current);
    };
  }, [props.visible]);

  // Define the close button with an icon. On macOS, the close button is displayed on the
  // left side of the header bar. On other platforms, it is displayed on the right side.
  const closeButton = (
    <Button icon={<RiCloseLargeFill />} onClick={props.onClose} variant="tool" />
  );

  // Both the title and the icon are optional. If no title is provided, only the icon will
  // be displayed. If no icon is provided, only the title will be displayed.
  const title = (
    <div className={classes.title}>
      {props.icon}
      {props.title}
    </div>
  );

  return createPortal(
    <CSSTransition
      in={props.visible}
      nodeRef={modalContent}
      // The modal CSS class uses a 200ms transition when fading in and out, so we set the
      // timeout to 200ms to match this.
      timeout={200}
      classNames={{
        enter: classes.fadeEnter,
        enterDone: classes.fadeEnterDone,
      }}
      unmountOnExit>
      <div
        ref={modalContent}
        onPointerDown={(event) => {
          // Set the flag if the pointer down occurred on the background.
          pointerDownOnBackground.current = event.target === modalContent.current;
        }}
        onClick={(event) => {
          // Ensure that the click was on the background and the pointer down also started on the background.
          if (pointerDownOnBackground.current && event.target === modalContent.current) {
            props.onClose();
          }
        }}
        className={classes.modalBackground}>
        <div className={classes.modal} style={{ maxWidth: props.maxWidth }}>
          {(props.title || props.icon) && (
            <Headerbar
              left={cIsMac ? closeButton : title}
              center={cIsMac ? title : null}
              right={!cIsMac ? closeButton : null}
              // The macOS header bar has no padding on the left side as there is the close
              // button. On other platforms, there is some padding on the left side as there
              // is the title.
              paddingLeft={cIsMac ? 5 : 15}
              paddingRight={cIsMac ? 15 : 5}
            />
          )}
          <div
            className={classes.content}
            style={{
              paddingTop: props.paddingTop,
              paddingBottom: props.paddingBottom,
              paddingLeft: props.paddingLeft,
              paddingRight: props.paddingRight,
            }}>
            {props.children}
          </div>
        </div>
      </div>
    </CSSTransition>,
    document.body
  );
}
