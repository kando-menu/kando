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

type Props = {
  /** Content to display inside the note. */
  readonly children: React.ReactNode | string;

  /** How the note should be styled. Default is 'small'. */
  readonly noteStyle?: 'hero' | 'big' | 'normal' | 'small';

  /** Whether the text should be centered. Defaults to false. */
  readonly isCentered?: boolean;

  /** Margin to apply to the top of the note. Defaults to 0. */
  readonly marginTop?: number | string;

  /** Margin to apply to the bottom of the note. Defaults to 0. */
  readonly marginBottom?: number | string;

  /** Margin to apply to the left of the note. Defaults to 0. */
  readonly marginLeft?: number | string;

  /** Margin to apply to the right of the note. Defaults to 0. */
  readonly marginRight?: number | string;

  /** Whether to use markdown formatting. Defaults to false. */
  readonly useMarkdown?: boolean;

  /**
   * Callback function to execute when a link is clicked. IF not given, the link will be
   * opened in the browser.
   */
  readonly onLinkClick?: (href: string) => void;
};

/**
 * Shows some text in a smaller font size and with a muted color.
 *
 * @param props - The properties for the note component.
 * @returns A note element.
 */
export default function Note(props: Props) {
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
        hero: props.noteStyle === 'hero',
        big: props.noteStyle === 'big',
        normal: props.noteStyle === 'normal',
        small: !props.noteStyle || props.noteStyle === 'small',
        center: props.isCentered,
      })}
      style={{
        marginTop: props.marginTop || 0,
        marginBottom: props.marginBottom || 0,
        marginLeft: props.marginLeft || 0,
        marginRight: props.marginRight || 0,
      }}>
      {props.useMarkdown ? (
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
        props.children
      )}
    </div>
  );
}
