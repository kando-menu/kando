//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TbX, TbPlus } from 'react-icons/tb';

import Tag from './Tag';
import SettingsRow from './SettingsRow';

import * as classes from './TagInput.module.scss';

interface IProps {
  /** The initial tags to display. */
  tags: string[];

  /**
   * A list of possible tags. They will be shown below the input field and can e clicked
   * to add them to the list of tags.
   */
  suggestions: string[];

  /** Optional label text to display next to the component. */
  label?: string;

  /** Optional information to display next to the label. */
  info?: string;

  /** Called when the tags change. */
  onChange: (tags: string[]) => void;
}

/**
 * This component is a multiline text input field that allows the user to enter multiple
 * tags. Tags can be removed by clicking on them, new tags can be added by pressing Enter
 * after typing some text.
 *
 * @param props - The properties for the tag input component.
 * @returns A tag edit field.
 */
export default (props: IProps) => {
  const [suggestionsVisible, setSuggestionsVisible] = React.useState(false);
  const inputRef = React.useRef(null);

  const [containerRef] = useAutoAnimate({ duration: 250 });

  const suggestions = props.suggestions
    .filter((suggestion) => !props.tags.includes(suggestion))
    .sort();

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <SettingsRow label={props.label} info={props.info} grow>
      <div
        ref={containerRef}
        onFocus={() => {
          setSuggestionsVisible(true);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setSuggestionsVisible(false);
          }
        }}>
        <div
          className={classes.input}
          // Focus the input field when the user clicks on the container.
          onClick={focusInput}>
          {props.tags.map((tag, index) => (
            <Tag
              key={index}
              name={tag}
              icon={<TbX />}
              onClick={() => {
                const newTags = [...props.tags];
                newTags.splice(index, 1);
                props.onChange(newTags);
              }}
            />
          ))}
          <input
            ref={inputRef}
            placeholder={
              props.tags.length === 0 ? i18next.t('settings.add-tags-placeholder') : ''
            }
            onKeyDown={(event) => {
              // Add tag on return if the input field is not empty.
              if (event.key === 'Enter' && event.currentTarget.value !== '') {
                const newTags = [...props.tags];
                newTags.push(event.currentTarget.value);

                // Remove duplicates.
                props.onChange(Array.from(new Set(newTags)));
                event.currentTarget.value = '';
              }

              // Delete previous tag on backspace if the input field is empty.
              if (event.key === 'Backspace' && event.currentTarget.value === '') {
                const newTags = [...props.tags];
                newTags.pop();
                props.onChange(newTags);
              }
            }}
          />
        </div>
        {suggestions.length > 0 && suggestionsVisible && (
          <div className={classes.suggestions}>
            {suggestions.map((suggestion, index) => (
              <Tag
                key={index}
                name={suggestion}
                icon={<TbPlus />}
                onClick={() => {
                  if (props.tags.includes(suggestion)) {
                    return;
                  }

                  const newTags = [...props.tags];
                  newTags.push(suggestion);
                  props.onChange(newTags);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </SettingsRow>
  );
};
