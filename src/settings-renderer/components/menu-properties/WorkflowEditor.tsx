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

import { TbClick, TbPointer } from 'react-icons/tb';

import * as classes from './WorkflowEditor.module.scss';
import { useAppState, useMenuSettings, getSelectedChild } from '../../state';

import { Button, Checkbox } from '../common';
import { SelectWorkflow, HoverWorkflow, ChildMenuItem } from '../../../common';
import ActionList from './ActionList';

/**
 * This component allows editing the workflows of a menu item. It shows tabs for selecting
 * between different workflow types (e.g., select and hover for buttons, or open and hover
 * for submenus) and renders an ActionList for the currently selected workflow.
 */
export default function WorkflowEditor() {
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);

  // Get the selected item.
  const selectedItem = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // State to track which workflow is currently selected.
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<number>(0);

  // Sanity check - should not render if no item is selected.
  if (!selectedItem || selectedItem.type === 'root') {
    return null;
  }

  // Each workflow type has a tooltip and an icon for the selector buttons. Also, some
  // workflow types have some additional widgets.
  const workflowMeta = {
    select: {
      tooltip: i18next.t('settings.workflow-editor.select-workflow.tooltip'),
      emptyHint: i18next.t('settings.workflow-editor.select-workflow.empty-hint'),
      icon: <TbClick />,
    },
    hover: {
      tooltip: i18next.t('settings.workflow-editor.hover-workflow.tooltip'),
      emptyHint: i18next.t('settings.workflow-editor.hover-workflow.empty-hint'),
      icon: <TbPointer />,
    },
    open: {
      tooltip: i18next.t('settings.workflow-editor.open-workflow.tooltip'),
      emptyHint: i18next.t('settings.workflow-editor.open-workflow.empty-hint'),
      icon: <TbClick />,
    },
  };

  const isButton = selectedItem.type === 'button';
  const isSubmenu = selectedItem.type === 'submenu';

  // Determine which workflows are available based on item type.
  const workflowTypes: Array<'select' | 'hover' | 'open'> = isButton
    ? ['select', 'hover']
    : isSubmenu
      ? ['open', 'hover']
      : [];

  // Helper function to get workflow from item by type.
  const getCurrentWorkflowForItem = (
    item: ChildMenuItem,
    workflowType: 'select' | 'hover' | 'open'
  ): SelectWorkflow | HoverWorkflow | undefined => {
    if (workflowType === 'select' && 'selectWorkflow' in item) {
      return item.selectWorkflow;
    }
    if (workflowType === 'hover' && 'hoverWorkflow' in item) {
      return item.hoverWorkflow;
    }
    if (workflowType === 'open' && 'openWorkflow' in item) {
      return item.openWorkflow;
    }
    return undefined;
  };

  // Helper function to update a specific workflow.
  const updateWorkflow = (
    workflowType: 'select' | 'hover' | 'open',
    workflow: SelectWorkflow | HoverWorkflow | undefined
  ) => {
    editMenuItem(selectedMenu, selectedChildPath, (item) => {
      if (workflowType === 'select' && item.type === 'button') {
        item.selectWorkflow = workflow as SelectWorkflow;
      } else if (
        workflowType === 'hover' &&
        (item.type === 'button' || item.type === 'submenu')
      ) {
        item.hoverWorkflow = workflow as HoverWorkflow;
      } else if (workflowType === 'open' && item.type === 'submenu') {
        item.openWorkflow = workflow as HoverWorkflow;
      }

      return item;
    });
  };

  const renderWorkflowContent = (workflowType: 'select' | 'hover' | 'open') => {
    const currentWorkflow = getCurrentWorkflowForItem(selectedItem, workflowType);

    return (
      <div key={`workflow-${workflowType}`} className={classes.workflow}>
        {currentWorkflow && 'waitForFadeout' in currentWorkflow ? (
          <Checkbox
            info={i18next.t('menu-items.common.delayed-option-info')}
            initialValue={currentWorkflow.waitForFadeout}
            label={i18next.t('menu-items.common.delayed-option')}
            onChange={(value) => {
              updateWorkflow(workflowType, {
                ...currentWorkflow,
                waitForFadeout: value,
              });
            }}
          />
        ) : null}
        {currentWorkflow && 'inhibitShortcuts' in currentWorkflow ? (
          <Checkbox
            info={i18next.t('menu-items.common.inhibit-shortcuts-info')}
            initialValue={currentWorkflow.inhibitShortcuts}
            label={i18next.t('menu-items.common.inhibit-shortcuts')}
            onChange={(value) => {
              updateWorkflow(workflowType, {
                ...currentWorkflow,
                inhibitShortcuts: value,
              });
            }}
          />
        ) : null}
        <ActionList
          emptyHint={workflowMeta[workflowType].emptyHint}
          workflow={currentWorkflow}
          onUpdateItem={(info) => {
            editMenuItem(selectedMenu, selectedChildPath, (item) => {
              if (info.name) {
                item.name = info.name;
              }
              if (info.icon) {
                item.icon = info.icon;
              }
              if (info.iconTheme) {
                item.iconTheme = info.iconTheme;
              }
              return item;
            });
          }}
          onUpdateWorkflow={(updatedWorkflow) => {
            updateWorkflow(workflowType, updatedWorkflow);
          }}
        />
      </div>
    );
  };

  return (
    <div className={classes.workflowEditor}>
      {/* Workflow type selector buttons */}
      <div className={classes.workflowSelector}>
        {workflowTypes.map((workflowType, index) => (
          <Button
            key={workflowType}
            isGrouped
            icon={workflowMeta[workflowType].icon}
            isPressed={selectedWorkflow === index}
            size="large"
            tooltip={workflowMeta[workflowType].tooltip}
            variant="floating"
            onClick={() => setSelectedWorkflow(index)}
          />
        ))}
      </div>

      {/* Workflow content - sliding panel style */}
      <div
        className={classes.workflowSlider}
        style={{
          gap: '50px',
          transform: `translateX(calc(-${selectedWorkflow * 100}% - ${selectedWorkflow * 50}px))`, // Account for gap between items
        }}>
        {workflowTypes.map((workflowType) => renderWorkflowContent(workflowType))}
      </div>
    </div>
  );
}
