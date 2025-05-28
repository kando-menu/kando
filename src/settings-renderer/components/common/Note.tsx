//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import Markdown from 'react-markdown';
import classNames from 'classnames/bind';

import * as classes from './Note.module.scss';
const cx = classNames.bind(classes);

interface IProps {
  /** Content to display inside the note. */
  children: React.ReactNode | string;

  /** How the note should be styled. Default is 'small'. */
  style?: 'hero' | 'big' | 'normal' | 'small';

  /** Whether the text should be centered. Defaults to false. */
  center?: boolean;

  /** Margin to apply to the top of the note. Defaults to 0. */
  marginTop?: number | string;

  /** Margin to apply to the bottom of the note. Defaults to 0. */
  marginBottom?: number | string;

  /** Margin to apply to the left of the note. Defaults to 0. */
  marginLeft?: number | string;

  /** Margin to apply to the right of the note. Defaults to 0. */
  marginRight?: number | string;

  /** Whether to use markdown formatting. Defaults to false. */
  markdown?: boolean;

  /**
   * Callback function to execute when a link is clicked. IF not given, the link will be
   * opened in the browser.
   */
  onLinkClick?: (href: string) => void;
}

/**
 * Shows some text in a smaller font size and with a muted color.
 *
 * @param props - The properties for the note component.
 * @returns A note element.
 */
export default function Note(props: IProps) {
  const handleLinkClick = (href: string) => {
    if (props.onLinkClick) {
      props.onLinkClick(href); // Execute the callback with the link's href
    } else {
      window.open(href, '_blank'); // Default behavior: open in a new tab
    }
  };

  return (
    <div
      className={cx({
        note: true,
        hero: props.style === 'hero',
        big: props.style === 'big',
        normal: props.style === 'normal',
        small: !props.style || props.style === 'small',
        center: props.center,
      })}
      style={{
        marginTop: props.marginTop || 0,
        marginBottom: props.marginBottom || 0,
        marginLeft: props.marginLeft || 0,
        marginRight: props.marginRight || 0,
      }}>
      {props.markdown ? (
        <Markdown
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default link behavior
                  handleLinkClick(href);
                }}>
                {children}
              </a>
            ),
          }}>
          {props.children as string}
        </Markdown>
      ) : (
        <>{props.children}</>
      )}
    </div>
  );
}
