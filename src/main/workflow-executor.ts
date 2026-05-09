//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import {
  HoverWorkflow,
  SelectWorkflow,
  WorkflowAction,
  WorkflowActionType,
} from '../common';
import { KandoApp } from './app';
import { Notification } from './utils/notification';
import { DeepReadonly } from './settings';

import { execute as executeCommand } from './actions/execute-command';
import { execute as executeMacro } from './actions/execute-macro';
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
) => Promise<void>;

const ACTION_EXECUTORS = new Map<
  WorkflowActionType,
  WorkflowActionExecutor<WorkflowActionType>
>([
  ['delay', delay],
  ['execute-command', executeCommand],
  ['execute-macro', executeMacro],
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
  public async executeSelectWorkflow(
    workflow: DeepReadonly<SelectWorkflow>,
    app: KandoApp
  ) {
    let inhibitionID = 0;
    if (workflow.inhibitShortcuts) {
      inhibitionID = await app.getBackend().inhibitAllShortcuts();
    }

    try {
      for (const action of workflow.actions) {
        await this.executeAction(action, app);
      }
    } catch (error) {
      Notification.show({
        title: 'Failed to execute workflow',
        message: error instanceof Error ? error.message : error,
        type: 'error',
      });
    } finally {
      if (workflow.inhibitShortcuts) {
        await app.getBackend().releaseInhibition(inhibitionID);
      }
    }
  }

  /**
   * Executes the hover-workflow of a menu item.
   *
   * @param workflow The hover-workflow to execute.
   * @param app The app which executed the action.
   */
  public async executeHoverWorkflow(
    workflow: DeepReadonly<HoverWorkflow>,
    app: KandoApp
  ) {
    try {
      for (const action of workflow.actions) {
        await this.executeAction(action, app);
      }
    } catch (error) {
      Notification.show({
        title: 'Failed to execute workflow',
        message: error instanceof Error ? error.message : error,
        type: 'error',
      });
    }
  }

  /**
   * Executes the given action.
   *
   * @param action The action to execute.
   * @param app The app which executed the action.
   * @returns A promise which resolves when the action has been executed.
   */
  private executeAction(
    action: DeepReadonly<WorkflowAction>,
    app: KandoApp
  ): Promise<void> {
    const executor = ACTION_EXECUTORS.get(action.type) as WorkflowActionExecutor<
      typeof action.type
    >;
    return executor(action, app);
  }
}
