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

import * as classes from './ActionPicker.module.scss';
import { Modal, ThemedIcon, Scrollbox } from '../common';
import { WorkflowAction, WorkflowActionType } from '../../../common';
import { ActionTypeRegistry } from '../../../common/action-type-registry';

type Props = {
  /** Whether the action picker modal is visible. */
  readonly isVisible: boolean;

  /** Callback to close the modal. */
  readonly onClose: () => void;

  /** Callback when an action is selected. */
  readonly onSelect: (action: WorkflowAction) => void;
};

/**
 * This component displays a modal dialog for selecting a new action to add to a workflow.
 * It shows all available action types with their icons and descriptions.
 */
export default function ActionPicker(props: Props) {
  const registry = ActionTypeRegistry.getInstance();
  const actionTypes = Array.from(registry.getAllMetadata().entries()).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  const handleSelectActionType = (actionType: WorkflowActionType) => {
    const metadata = registry.getMetadata(actionType);
    props.onSelect(metadata.createAction());
  };

  const tips = [
    i18next.t('menu-items.file.tip-1'),
    i18next.t('menu-items.hotkey.tip-1'),
    i18next.t('menu-items.hotkey.tip-2'),
    i18next.t('menu-items.hotkey.tip-3', {
      link: 'https://kando.menu/valid-keynames/',
    }),
    i18next.t('menu-items.command.tip-1'),
    i18next.t('menu-items.command.tip-2'),
    i18next.t('menu-items.command.tip-3'),
    i18next.t('menu-items.command.tip-4'),
    i18next.t('menu-items.command.tip-5'),
    i18next.t('menu-items.command.tip-6', {
      link: 'https://kando.menu/item-run-command/',
    }),
    i18next.t('menu-items.macro.tip-1'),
    i18next.t('menu-items.macro.tip-2'),
    i18next.t('menu-items.uri.tip-1'),
    i18next.t('menu-items.uri.tip-2'),
    i18next.t('menu-items.uri.tip-3'),
    i18next.t('menu-items.uri.tip-4'),
    i18next.t('menu-items.uri.tip-5'),
    i18next.t('menu-items.uri.tip-6'),
    i18next.t('menu-items.text.tip-1'),
    i18next.t('menu-items.settings.tip-1'),
    i18next.t('menu-items.submenu.tip-1'),
    i18next.t('menu-items.submenu.tip-2'),
    i18next.t('menu-items.submenu.tip-3'),
    i18next.t('menu-items.submenu.tip-4'),
    i18next.t('menu-items.submenu.tip-5'),
    i18next.t('menu-items.submenu.tip-6'),
    i18next.t('menu-items.submenu.tip-7'),
  ];

  return (
    <Modal
      isVisible={props.isVisible}
      maxWidth={500}
      title={i18next.t('settings.workflow-editor.add-action')}
      onClose={props.onClose}>
      <Scrollbox maxHeight="60vh">
        <div className={classes.actionTypeList}>
          {actionTypes.map(([actionType, metadata]) => (
            <button
              key={actionType}
              className={classes.actionTypeItem}
              type="button"
              onClick={() => {
                handleSelectActionType(actionType);
                props.onClose();
              }}>
              <div className={classes.actionTypeIcon}>
                <ThemedIcon name={metadata.icon} theme={metadata.iconTheme} />
              </div>

              <div>
                <div className={classes.actionTypeName}>{metadata.name}</div>
                <div className={classes.actionTypeDetails}>{metadata.description}</div>
              </div>
            </button>
          ))}
        </div>
      </Scrollbox>
    </Modal>
  );
}
