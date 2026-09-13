// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';

import { mapKeys } from '../../../common/key-codes';
import {
  cycleModifierSide,
  getModifierShortcutTapCount,
  splitModifierSide,
} from '../../../common/shortcut';
import {
  COMMON_KEY_ROWS,
  FUNCTION_KEYS,
  NAVIGATION_KEYS,
  NUMPAD_KEYS,
  toggleVirtualKey,
  VirtualKey,
} from '../../../common/virtual-keyboard';
import Button from './Button';
import * as classes from './VirtualKeyboard.module.scss';

type Props = {
  readonly shortcut: string;
  readonly mode: 'key-names' | 'key-codes';
  readonly useModifiers: boolean;
  readonly isStandaloneAllowed: boolean;
  readonly isSideSelectionAllowed: boolean;
  readonly normalize: (value: string) => string;
  readonly isValid: (value: string) => boolean;
  readonly isModifier: (value: string) => boolean;
  readonly renderShortcut: (value: string) => React.ReactNode;
  readonly onChange: (value: string) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/** Mouse-only shortcut composition. It edits a draft and never dispatches keyboard events. */
export default function VirtualKeyboard(props: Props) {
  const [showMore, setShowMore] = React.useState(false);
  const parts = props.shortcut.split('+').filter(Boolean);
  const tapCount = getModifierShortcutTapCount(props.shortcut);
  const occurrences = new Map<string, number>();
  const previewParts = parts.map((part) => {
    const occurrence = occurrences.get(part) || 0;
    occurrences.set(part, occurrence + 1);
    return { part, key: `${part}-${occurrence}` };
  });
  const modifiers: VirtualKey[] = [
    { name: 'Shift', code: 'Shift' },
    { name: 'Control', code: 'Control' },
    { name: cIsMac ? 'Option' : 'Alt', code: 'Alt' },
    { name: cIsMac ? 'Command' : 'Meta', code: 'Meta' },
    ...(cIsMac ? [{ name: 'Fn', code: 'Fn' }] : []),
  ];

  const renderKey = (key: VirtualKey) => {
    const value = props.normalize(props.mode === 'key-codes' ? key.code : key.name);
    const modifier = props.isModifier(value);
    const selected = parts.some((part) =>
      modifier ? splitModifierSide(part).base === value : part === value
    );
    let supported = true;
    if (!modifier) {
      try {
        mapKeys(
          [{ name: key.code, down: true, delay: 0 }],
          cIsMac ? 'macos' : cIsWindows ? 'windows' : 'linux'
        );
      } catch {
        supported = false;
      }
    }
    // Electron key names cannot distinguish the two Enter keys.
    if (props.mode === 'key-names' && key.code === 'NumpadEnter') {
      supported = false;
    }
    return (
      <button
        key={key.code}
        aria-label={value}
        aria-pressed={selected}
        className={classes.key}
        data-code={key.code}
        disabled={
          !supported || (modifier && !props.useModifiers && !props.isStandaloneAllowed)
        }
        title={value}
        type="button"
        onClick={() =>
          props.onChange(toggleVirtualKey(props.shortcut, value, props.useModifiers))
        }>
        {modifier ? props.renderShortcut(value) : key.label || key.name}
      </button>
    );
  };

  const cycleSide = (index: number) => {
    const next = [...parts];
    const modifier = cycleModifierSide(next[index]);
    if (tapCount === 2) {
      next.fill(modifier);
    } else {
      next[index] = modifier;
    }
    props.onChange(props.normalize(next.join('+')));
  };

  return (
    <div
      aria-label={i18next.t('settings.virtual-keyboard.title')}
      className={classes.keyboard}
      role="dialog">
      <div aria-live="polite" className={classes.preview}>
        {parts.length ? (
          previewParts.map(({ part, key }, index) => (
            <button
              key={key}
              aria-label={part}
              className={classes.key}
              disabled={
                !props.isSideSelectionAllowed || part === 'Fn' || !props.isModifier(part)
              }
              type="button"
              onClick={() => cycleSide(index)}>
              <kbd>{props.renderShortcut(part)}</kbd>
            </button>
          ))
        ) : (
          <span>{i18next.t('settings.not-bound')}</span>
        )}
      </div>
      <p className={classes.hint}>{i18next.t('settings.virtual-keyboard.hint')}</p>
      <div className={classes.toolbar}>
        <Button
          isPressed={!showMore}
          label={i18next.t('settings.virtual-keyboard.common')}
          size="small"
          onClick={() => setShowMore(false)}
        />
        <Button
          isPressed={showMore}
          label={i18next.t('settings.virtual-keyboard.more')}
          size="small"
          onClick={() => setShowMore(true)}
        />
        {props.isStandaloneAllowed ? (
          <label className={classes.doublePress}>
            <input
              checked={tapCount === 2}
              disabled={tapCount === 0}
              type="checkbox"
              onChange={(event) =>
                props.onChange(
                  event.target.checked ? `${parts[0]}+${parts[0]}` : parts[0]
                )
              }
            />
            {i18next.t('settings.virtual-keyboard.double-press')}
          </label>
        ) : null}
      </div>
      <div className={classes.layout}>
        <div className={classes.modifiers}>{modifiers.map(renderKey)}</div>
        {showMore ? (
          <div className={classes.moreKeys}>
            <div className={classes.functions}>
              {FUNCTION_KEYS.map(renderKey)}
              <div className={classes.navigation}>{NAVIGATION_KEYS.map(renderKey)}</div>
            </div>
            <div className={classes.numpad}>{NUMPAD_KEYS.map(renderKey)}</div>
          </div>
        ) : (
          <div className={classes.commonKeys}>
            {COMMON_KEY_ROWS.map((row) => (
              <div key={row[0].code} className={classes.row}>
                {row.map(renderKey)}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className={classes.hint}>
        {props.mode === 'key-codes'
          ? i18next.t('settings.virtual-keyboard.code-hint')
          : i18next.t('settings.virtual-keyboard.name-hint')}
      </p>
      <div className={classes.footer}>
        <Button
          label={i18next.t('settings.virtual-keyboard.clear')}
          onClick={() => props.onChange('')}
        />
        <div className={classes.actions}>
          <Button
            label={i18next.t('settings.virtual-keyboard.cancel')}
            onClick={props.onCancel}
          />
          <Button
            isDisabled={!props.isValid(props.shortcut)}
            label={i18next.t('settings.virtual-keyboard.confirm')}
            variant="primary"
            onClick={props.onConfirm}
          />
        </div>
      </div>
    </div>
  );
}
