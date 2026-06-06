//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Workflow, WorkflowAction, WorkflowActionType } from '../common';
import { KandoApp } from './app';
import { Notification } from './utils/notification';
import { DeepReadonly } from './settings';

import { execute as closeMenu } from './actions/close-menu';
import { execute as closeSubmenu } from './actions/close-submenu';
import { execute as executeCommand } from './actions/execute-command';
import { execute as executeMacro } from './actions/execute-macro';
import { execute as inhibitShortcuts } from './actions/inhibit-shortcuts';
import { execute as openFile } from './actions/open-file';
import { execute as openMenu } from './actions/open-menu';
import { execute as openSettings } from './actions/open-settings';
import { execute as openURI } from './actions/open-uri';
import { execute as setClipboard } from './actions/set-clipboard';
import { execute as simulateHotkey } from './actions/simulate-hotkey';
import { execute as delay } from './actions/delay';

type WorkflowActionExecutor<T extends WorkflowActionType> = (
  action: DeepReadonly<Extract<WorkflowAction, { type: T }>>,
  app: KandoApp
) => Promise<() => Promise<void>> | Promise<void>;

const ACTION_EXECUTORS = new Map<
  WorkflowActionType,
  WorkflowActionExecutor<WorkflowActionType>
>([
  ['close-menu', closeMenu],
  ['close-submenu', closeSubmenu],
  ['delay', delay],
  ['execute-command', executeCommand],
  ['execute-macro', executeMacro],
  ['inhibit-shortcuts', inhibitShortcuts],
  ['open-file', openFile],
  ['open-menu', openMenu],
  ['open-settings', openSettings],
  ['open-uri', openURI],
  ['set-clipboard', setClipboard],
  ['simulate-hotkey', simulateHotkey],
]);

/**
 * This singleton class is responsible for executing the workflows of menu items. It
 * provides a method to execute the select- and hover-workflows of a menu item.
 */
export class WorkflowExecutor {
  /** The singleton instance of this class. */
  private static instance: WorkflowExecutor = null;

  /**
   * This is a singleton class. The constructor is private. Use `getInstance` to get the
   * instance of this class.
   */
  private constructor() {}

  /**
   * Use this method to get the singleton instance of this class.
   *
   * @returns The singleton instance of this class.
   */
  public static getInstance(): WorkflowExecutor {
    if (WorkflowExecutor.instance === null) {
      WorkflowExecutor.instance = new WorkflowExecutor();
    }
    return WorkflowExecutor.instance;
  }

  /**
   * Executes the select-workflow of a menu item.
   *
   * @param workflow The select-workflow to execute.
   * @param app The app which executed the action.
   */
  public async executeWorkflow(workflow: DeepReadonly<Workflow>, app: KandoApp) {
    if (!workflow.actions || workflow.actions.length === 0) {
      return;
    }

    const finalizeCalls: (() => Promise<void>)[] = [];

    try {
      for (const action of workflow.actions) {
        const finalizeCall = await this.executeAction(action, app);
        if (finalizeCall) {
          finalizeCalls.push(finalizeCall);
        }
      }
    } catch (error) {
      Notification.show({
        title: 'Failed to execute workflow',
        message: error instanceof Error ? error.message : error,
        type: 'error',
      });
    } finally {
      for (const finalizeCall of finalizeCalls) {
        await finalizeCall();
      }
    }
  }

  /**
   * This returns true if the given workflow performs no meaningful actions, e.g. if it
   * only contains delay actions, inhibit-shortcuts actions, close-menu, or close-submenu
   * actions.
   *
   * This is used to determine whether a workflow only "cancels" the current interaction
   * by closing the menu. This information is relevant for achievement tracking.
   *
   * @param workflow The workflow to check.
   * @returns True if the workflow performs no meaningful actions, false otherwise.
   */
  public isNoopWorkflow(workflow: DeepReadonly<Workflow>): boolean {
    if (!workflow.actions || workflow.actions.length === 0) {
      return true;
    }

    return workflow.actions.every((action) => {
      return (
        action.type === 'delay' ||
        action.type === 'inhibit-shortcuts' ||
        action.type === 'close-menu' ||
        action.type === 'close-submenu'
      );
    });
  }

  /**
   * Executes the given action.
   *
   * @param action The action to execute.
   * @param app The app which executed the action.
   * @returns A promise which resolves when the action has been executed or a promise
   *   which resolves to a function that will be called when the workflow is finalized.
   *   The finalize function can be used to undo the action, e.g. to re-enable shortcuts
   *   after an inhibit-shortcuts action.
   */
  private executeAction(
    action: DeepReadonly<WorkflowAction>,
    app: KandoApp
  ): Promise<() => Promise<void>> | Promise<void> {
    const executor = ACTION_EXECUTORS.get(action.type);
    return executor(action, app);
  }
}
