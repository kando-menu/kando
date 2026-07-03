//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import classNames from 'classnames/bind';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import i18next from 'i18next';

import * as classes from './ActionList.module.scss';
const cx = classNames.bind(classes);

import { ShortcutPicker, Button, Note, ThemedIcon } from '../common';
import { TbPlus, TbTrash } from 'react-icons/tb';
import { Workflow, WorkflowAction, ActionTypeRegistry } from '../../../common';
import ActionPicker from './ActionPicker';
import { ensureUniqueKeys } from '../../utils';
import { getConfigComponent } from './actions';

type Props = {
  /** The description of the workflow type. */
  readonly description: string;

  /**
   * Whether this is the first workflow type for this item. Used to style the border radii
   * below the tabs.
   */
  readonly isFirstWorkflowType: boolean;

  /**
   * Whether this is the last workflow type for this item. Used to style the border radii
   * below the tabs.
   */
  readonly isLastWorkflowType: boolean;

  /** The workflow to display and edit. */
  readonly workflow?: Workflow;

  /** The empty hint text to display when the workflow has no actions. */
  readonly emptyHint: string;

  /**
   * The placeholder text to display in the ShortcutPicker when no quick select key is
   * bound.
   */
  readonly quickSelectKeyPlaceholder: string;

  /** The info text shown for the quick select key in the ActionPicker. */
  readonly quickSelectKeyInfo: string;

  /** Callback to update the workflow. */
  readonly onUpdateWorkflow: (workflow: Workflow) => void;

  /** Function to call when the container menu item should be modified. */
  readonly onUpdateItem: (info: {
    name?: string;
    icon?: string;
    iconTheme?: string;
  }) => void;
};

/**
 * This component displays a list of actions in a workflow. It supports drag-and-drop
 * reordering and allows adding or removing actions.
 */
export default function ActionList(props: Props) {
  const [animatedList] = useAutoAnimate({ duration: 200 });
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [actionPickerVisible, setActionPickerVisible] = React.useState(false);

  const actions = props.workflow?.actions || [];

  // Apply drag reordering to the display.
  const displayedActions = actions.map((action, index) => ({
    action,
    index,
    key: `action-${action.type}`,
  }));

  // Ensure that all keys are unique.
  ensureUniqueKeys(displayedActions);

  if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
    const [draggedAction] = displayedActions.splice(dragIndex, 1);
    displayedActions.splice(dropIndex, 0, draggedAction);
  }

  // Called when the delete button of an action is clicked. Removes the action from the
  // list and calls onUpdateWorkflow to save the change.
  const handleDeleteAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    props.onUpdateWorkflow({
      ...props.workflow,
      actions: newActions,
    });
  };

  // Called when a new action is selected in the ActionPicker. Adds the new action to
  // the end of the list and calls onUpdateWorkflow to save the change.
  const handleAddAction = (action: WorkflowAction) => {
    const newActions = [...actions, action];
    props.onUpdateWorkflow({
      ...props.workflow,
      actions: newActions,
    });
  };

  // Called when an action starts being dragged. Sets the dragIndex to the index of the
  // dragged action, which will cause the display to update and show the dragged action
  // in a "dragging" style.
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    const item = event.currentTarget;
    const headers = item.querySelector<HTMLElement>(`.${classes.actionItemHeader}`);
    const pointerTarget = document.elementFromPoint(event.clientX, event.clientY);

    if (headers === null || pointerTarget === null || !headers.contains(pointerTarget)) {
      event.preventDefault();
      return;
    }

    setDragIndex(index);
    setDropIndex(index);
  };

  // Called when an action is dragged over another action. Updates the dropIndex to the
  // index of the action being dragged over, which will cause the display to update and
  // show the dragged action in the new position.
  const handleDragEnter = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      if (dragIndex < index) {
        setDropIndex(dropIndex >= index ? index - 1 : index);
      } else {
        setDropIndex(dropIndex <= index ? index + 1 : index);
      }
    }
  };

  // Called when a drag operation ends (either by dropping or cancelling). If dropped, it
  // updates the action order based on dragIndex and dropIndex, then resets both indices.
  const handleDragEnd = () => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      const newActions = [...actions];
      const [draggedAction] = newActions.splice(dragIndex, 1);
      newActions.splice(dropIndex, 0, draggedAction);

      props.onUpdateWorkflow({
        ...props.workflow,
        actions: newActions,
      });
    }

    setDragIndex(null);
    setDropIndex(null);
  };

  const renderAction = (actionWrapper: {
    action: WorkflowAction;
    key: string;
    index: number;
  }) => {
    const { action, index, key } = actionWrapper;
    const typeMeta = ActionTypeRegistry.getInstance().getMetadata(action.type);

    const configWidget = getConfigComponent(
      action,
      (updatedAction) => {
        const newActions = [...actions];
        newActions[index] = updatedAction;
        props.onUpdateWorkflow({
          ...props.workflow,
          actions: newActions,
        });
      },
      props.onUpdateItem
    );

    return (
      <div
        key={key}
        draggable
        className={cx({
          actionItem: true,
          dragging: dragIndex === index,
        })}
        onDragEnd={handleDragEnd}
        onDragEnter={() => handleDragEnter(index)}
        onDragOver={(event) => event.preventDefault()}
        onDragStart={(event) => handleDragStart(event, index)}>
        <div className={classes.actionItemHeader}>
          <ThemedIcon name={typeMeta.icon} size={16} theme={typeMeta.iconTheme} />
          <div style={{ flexGrow: 1 }}>{typeMeta.name}</div>
          <Button
            icon={<TbTrash />}
            size="small"
            variant="invisible"
            onClick={() => handleDeleteAction(index)}
          />
        </div>
        {configWidget ? (
          <div className={classes.actionItemContent}>{configWidget}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={classes.actionListContainer}>
      <div ref={animatedList} className={classes.actionList}>
        <div
          key="workflow-options"
          className={cx({
            actionItem: true,
            firstWorkflowType: props.isFirstWorkflowType,
            lastWorkflowType: props.isLastWorkflowType,
          })}>
          <div className={classes.actionItemContent} style={{ paddingTop: 10 }}>
            <ShortcutPicker
              initialValue={props.workflow?.quickSelectKey || ''}
              label={i18next.t('settings.quick-select-key-label')}
              info={props.quickSelectKeyInfo}
              mode="key-names"
              placeholder={props.quickSelectKeyPlaceholder}
              recordingPlaceholder={i18next.t('settings.quick-select-key-recording')}
              useModifiers={false}
              onChange={(shortcut) => {
                props.onUpdateWorkflow({
                  ...props.workflow,
                  quickSelectKey: shortcut || undefined,
                });
              }}
            />
            <Note marginTop={4}>{props.description}</Note>
          </div>
        </div>

        {displayedActions.map((action) => renderAction(action))}

        <div className={classes.addActionContainer}>
          <Button
            isBlock
            icon={<TbPlus />}
            label={i18next.t('settings.workflow-editor.add-action')}
            variant="pill"
            onClick={() => setActionPickerVisible(true)}
          />
        </div>

        {displayedActions.length === 0 && (
          <Note isCentered marginTop={16}>
            {props.emptyHint}
          </Note>
        )}
      </div>

      <ActionPicker
        isVisible={actionPickerVisible}
        onClose={() => setActionPickerVisible(false)}
        onSelect={(action) => {
          handleAddAction(action);
          setActionPickerVisible(false);
        }}
      />
    </div>
  );
}
