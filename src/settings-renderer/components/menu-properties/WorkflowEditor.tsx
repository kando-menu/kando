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
import classNames from 'classnames/bind';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings, getSelectedChild } from '../../state';

import { Workflow, MenuItem } from '../../../common';
import ActionList from './ActionList';

type WorkflowType =
  | 'buttonSelect'
  | 'buttonHover'
  | 'rootCenter'
  | 'submenuSelect'
  | 'submenuHover'
  | 'submenuCenter';

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
      icon: <TbClick />,
    },
    buttonHover: {
      name: i18next.t('settings.workflow-editor.button-hover-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.button-hover-workflow.description'
      ),
      emptyHint: i18next.t('settings.workflow-editor.button-hover-workflow.empty-hint'),
      icon: <TbPointer />,
    },
    rootCenter: {
      name: i18next.t('settings.workflow-editor.root-center-workflow.name'),
      description: i18next.t('settings.workflow-editor.root-center-workflow.description'),
      emptyHint: i18next.t('settings.workflow-editor.root-center-workflow.empty-hint'),
      icon: <TbClick />,
    },
    submenuSelect: {
      name: i18next.t('settings.workflow-editor.submenu-select-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.submenu-select-workflow.description'
      ),
      emptyHint: i18next.t('settings.workflow-editor.submenu-select-workflow.empty-hint'),
      icon: <TbClick />,
    },
    submenuHover: {
      name: i18next.t('settings.workflow-editor.submenu-hover-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.submenu-hover-workflow.description'
      ),
      emptyHint: i18next.t('settings.workflow-editor.submenu-hover-workflow.empty-hint'),
      icon: <TbPointer />,
    },
    submenuCenter: {
      name: i18next.t('settings.workflow-editor.submenu-center-workflow.name'),
      description: i18next.t(
        'settings.workflow-editor.submenu-center-workflow.description'
      ),
      emptyHint: i18next.t('settings.workflow-editor.submenu-center-workflow.empty-hint'),
      icon: <TbClick />,
    },
  };

  // Determine which workflows are available based on item type.
  const workflowTypes: Array<WorkflowType> = [];

  if (selectedItem.type === 'button') {
    workflowTypes.push('buttonSelect', 'buttonHover');
  } else if (selectedItem.type === 'submenu') {
    workflowTypes.push('submenuSelect', 'submenuHover', 'submenuCenter');
  } else if (selectedItem.type === 'root') {
    workflowTypes.push('rootCenter');
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
    if (
      (workflowType === 'buttonSelect' || workflowType === 'submenuSelect') &&
      'selectWorkflow' in item
    ) {
      return item.selectWorkflow;
    }
    if (
      (workflowType === 'buttonHover' || workflowType === 'submenuHover') &&
      'hoverWorkflow' in item
    ) {
      return item.hoverWorkflow;
    }
    if (
      (workflowType === 'submenuCenter' || workflowType === 'rootCenter') &&
      'centerClickWorkflow' in item
    ) {
      return item.centerClickWorkflow;
    }
    return undefined;
  };

  // Helper function to update a specific workflow.
  const updateWorkflow = (workflowType: WorkflowType, workflow: Workflow | undefined) => {
    editMenuItem(selectedMenu, selectedChildPath, (item) => {
      if (
        (workflowType === 'buttonSelect' || workflowType === 'submenuSelect') &&
        (item.type === 'button' || item.type === 'submenu')
      ) {
        item.selectWorkflow = workflow;
      } else if (
        (workflowType === 'buttonHover' || workflowType === 'submenuHover') &&
        (item.type === 'button' || item.type === 'submenu')
      ) {
        item.hoverWorkflow = workflow;
      } else if (
        (workflowType === 'submenuCenter' || workflowType === 'rootCenter') &&
        (item.type === 'submenu' || item.type === 'root')
      ) {
        item.centerClickWorkflow = workflow;
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
      (workflowType === 'buttonSelect' || workflowType === 'submenuSelect')
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
