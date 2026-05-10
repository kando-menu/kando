//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import i18next from 'i18next';

import * as classes from './ActionList.module.scss';

import { Button, Note } from '../common';
import { TbPlus } from 'react-icons/tb';
import { SelectWorkflow, HoverWorkflow, WorkflowAction } from '../../../common';
import ActionPicker from './ActionPicker';

type Props = {
  /** The empty hint text to display when the workflow has no actions. */
  readonly emptyHint?: string;

  /** The workflow to display and edit. */
  readonly workflow?: SelectWorkflow | HoverWorkflow;

  /** Callback to update the workflow. */
  readonly onUpdateWorkflow: (workflow: SelectWorkflow | HoverWorkflow) => void;
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
  const displayActions = [...actions];
  if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
    const [draggedAction] = displayActions.splice(dragIndex, 1);
    displayActions.splice(dropIndex, 0, draggedAction);
  }

  // Called when the delete button of an action is clicked. Removes the action from the
  // list and calls onUpdateWorkflow to save the change.
  const handleDeleteAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    props.onUpdateWorkflow({
      ...props.workflow,
      actions: newActions,
    } as SelectWorkflow | HoverWorkflow);
  };

  // Called when a new action is selected in the ActionPicker. Adds the new action to
  // the end of the list and calls onUpdateWorkflow to save the change.
  const handleAddAction = (action: WorkflowAction) => {
    const newActions = [...actions, action];
    props.onUpdateWorkflow({
      ...props.workflow,
      actions: newActions,
    } as SelectWorkflow | HoverWorkflow);
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
      } as SelectWorkflow | HoverWorkflow);
    }

    setDragIndex(null);
    setDropIndex(null);
  };

  return (
    <div className={classes.actionListContainer}>
      <div ref={animatedList} className={classes.actionList}>
        {displayActions.length === 0 && <Note isCentered>{props.emptyHint}</Note>}

        {/* {displayActions.map((action, index) => {
          const actionKey = `action-${action.type}-${index}`;
          return (
            <ActionItem
              key={`${index}-${action.type}`}
              action={action}
              index={index}
              isDragging={dragIndex === index}
              onDelete={() => handleDeleteAction(index)}
              onDragEnd={handleDragEnd}
              onDragEnter={() => {
                if (dragIndex !== null && dragIndex !== index) {
                  setDropIndex(index);
                }
              }}
              onDragStart={() => setDragIndex(index)}
            />
          );
        })} */}

        {displayActions.map((action, index) => {
          const actionKey = `action-${action.type}-${index}`;
          return (
            <div key={actionKey} className={classes.actionItem}>
              <div>{action.type}</div>
            </div>
          );
        })}
      </div>

      {/* Add action button */}
      <Button
        icon={<TbPlus />}
        label={i18next.t('settings.workflow-editor.add-action')}
        variant="secondary"
        onClick={() => setActionPickerVisible(true)}
      />

      {/* Action type picker modal */}
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
