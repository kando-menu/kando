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

import * as classes from './WorkflowEditor.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings, getSelectedChild } from '../../state';

import { Workflow, MenuItem } from '../../../common';
import { ThemedIcon } from '../common';
import ActionList from './ActionList';

type WorkflowType =
  | 'buttonSelect'
  | 'buttonHover'
  | 'rootActivate'
  | 'submenuOpen'
  | 'submenuHover'
  | 'submenuActivate';

type WorkflowMeta = {
  [key in WorkflowType]: {
    name: string;
    description: string;
    emptyHint: string;
    icon: React.ReactNode;
  };
};

/**
 * This component allows editing the workflows of a menu item. It shows tabs for selecting
 * between different workflow types (e.g., select and hover for buttons, or center and
 * hover for submenus) and renders an ActionList for the currently selected workflow.
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
  if (!selectedItem) {
    return null;
  }

  // Each workflow type has a description and an icon for the selector buttons.
  const workflowMeta: WorkflowMeta = {
    buttonSelect: {
      name: i18next.t('settings.workflow-editor.button-select-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.button-select-workflow.description'
      ),
      emptyHint: i18next.t('settings.workflow-editor.button-select-workflow.empty-hint'),
      icon: <ThemedIcon name="workflow-select.svg" size="1em" theme="kando" />,
    },
    buttonHover: {
      name: i18next.t('settings.workflow-editor.button-hover-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.button-hover-workflow.description'
      ),
      emptyHint: i18next.t('settings.workflow-editor.button-hover-workflow.empty-hint'),
      icon: <ThemedIcon name="workflow-hover.svg" size="1em" theme="kando" />,
    },
    rootActivate: {
      name: i18next.t('settings.workflow-editor.root-activate-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.root-activate-workflow.description'
      ),
      emptyHint: i18next.t('settings.workflow-editor.root-activate-workflow.empty-hint'),
      icon: <ThemedIcon name="workflow-activate.svg" size="1em" theme="kando" />,
    },
    submenuOpen: {
      name: i18next.t('settings.workflow-editor.submenu-open-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.submenu-open-workflow.description'
      ),
      emptyHint: i18next.t('settings.workflow-editor.submenu-open-workflow.empty-hint'),
      icon: <ThemedIcon name="workflow-select.svg" size="1em" theme="kando" />,
    },
    submenuHover: {
      name: i18next.t('settings.workflow-editor.submenu-hover-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.submenu-hover-workflow.description'
      ),
      emptyHint: i18next.t('settings.workflow-editor.submenu-hover-workflow.empty-hint'),
      icon: <ThemedIcon name="workflow-hover.svg" size="1em" theme="kando" />,
    },
    submenuActivate: {
      name: i18next.t('settings.workflow-editor.submenu-activate-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.submenu-activate-workflow.description'
      ),
      emptyHint: i18next.t(
        'settings.workflow-editor.submenu-activate-workflow.empty-hint'
      ),
      icon: <ThemedIcon name="workflow-activate.svg" size="1em" theme="kando" />,
    },
  };

  // Determine which workflows are available based on item type.
  const workflowTypes: Array<WorkflowType> = [];

  if (selectedItem.type === 'button') {
    workflowTypes.push('buttonSelect', 'buttonHover');
  } else if (selectedItem.type === 'submenu') {
    workflowTypes.push('submenuOpen', 'submenuHover', 'submenuActivate');
  } else if (selectedItem.type === 'root') {
    workflowTypes.push('rootActivate');
  }

  // Make sure the selected workflow is valid for the current item type. If not, reset to the first workflow.
  if (selectedWorkflow >= workflowTypes.length) {
    setSelectedWorkflow(0);
  }

  // Helper function to get workflow from item by type.
  const getCurrentWorkflowForItem = (
    item: MenuItem,
    workflowType: WorkflowType
  ): Workflow | undefined => {
    if (workflowType === 'buttonSelect' && 'selectWorkflow' in item) {
      return item.selectWorkflow;
    }
    if (workflowType === 'submenuOpen' && 'openWorkflow' in item) {
      return item.openWorkflow;
    }
    if (
      (workflowType === 'buttonHover' || workflowType === 'submenuHover') &&
      'hoverWorkflow' in item
    ) {
      return item.hoverWorkflow;
    }
    if (
      (workflowType === 'submenuActivate' || workflowType === 'rootActivate') &&
      'activateWorkflow' in item
    ) {
      return item.activateWorkflow;
    }
    return undefined;
  };

  // Helper function to update a specific workflow.
  const updateWorkflow = (workflowType: WorkflowType, workflow: Workflow | undefined) => {
    editMenuItem(selectedMenu, selectedChildPath, (item) => {
      if (workflowType === 'buttonSelect' && item.type === 'button') {
        item.selectWorkflow = workflow;
      } else if (workflowType === 'submenuOpen' && item.type === 'submenu') {
        item.openWorkflow = workflow;
      } else if (
        (workflowType === 'buttonHover' || workflowType === 'submenuHover') &&
        (item.type === 'button' || item.type === 'submenu')
      ) {
        item.hoverWorkflow = workflow;
      } else if (
        (workflowType === 'submenuActivate' || workflowType === 'rootActivate') &&
        (item.type === 'submenu' || item.type === 'root')
      ) {
        item.activateWorkflow = workflow;
      }

      return item;
    });
  };

  const renderWorkflowContent = (workflowType: WorkflowType) => {
    const workflow = getCurrentWorkflowForItem(selectedItem, workflowType);

    const itemIndex =
      selectedChildPath.length > 0 ? selectedChildPath[selectedChildPath.length - 1] : -1;

    let quickSelectKeyPlaceholder = '';
    if (
      itemIndex < 9 &&
      (workflowType === 'buttonSelect' || workflowType === 'submenuOpen')
    ) {
      quickSelectKeyPlaceholder = `${itemIndex + 1}`;
    } else {
      quickSelectKeyPlaceholder = i18next.t('settings.not-bound');
    }

    return (
      <div
        key={`workflow-${workflowType}`}
        className={cx({
          workflow: true,
          active: workflowTypes[selectedWorkflow] === workflowType,
        })}>
        <div className={classes.workflowTabs}>
          {workflowTypes.map((type, index) => (
            <div
              key={type}
              className={cx({
                workflowTab: true,
                active: workflowTypes[selectedWorkflow] === type,
              })}
              onClick={() => setSelectedWorkflow(index)}>
              <span className={classes.workflowIcon}>{workflowMeta[type].icon}</span>
              <span className={classes.workflowName}>{workflowMeta[type].name}</span>
            </div>
          ))}
        </div>

        <ActionList
          description={workflowMeta[workflowType].description}
          emptyHint={workflowMeta[workflowType].emptyHint}
          isFirstWorkflowType={workflowType === workflowTypes[0]}
          isLastWorkflowType={workflowType === workflowTypes[workflowTypes.length - 1]}
          quickSelectKeyPlaceholder={quickSelectKeyPlaceholder}
          workflow={workflow}
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
      {workflowTypes.map((workflowType) => renderWorkflowContent(workflowType))}
    </div>
  );
}
