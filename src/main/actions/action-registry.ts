//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { MenuItem, WorkflowAction, WorkflowActionType } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

import { execute as executeCommand } from './execute-command';
import { execute as executeMacro } from './execute-macro';
import { execute as openFile } from './open-file';
import { execute as openMenu } from './open-menu';
import { execute as openSettings } from './open-settings';
import { execute as openURI } from './open-uri';
import { execute as setClipboard } from './set-clipboard';
import { execute as simulateHotkey } from './simulate-hotkey';

type WorkflowActionExecutor<T extends WorkflowActionType> = (
  action: DeepReadonly<Extract<WorkflowAction, { type: T }>>,
  app: KandoApp
) => Promise<void>;

type WorkflowActionExecutorMap = {
  [T in WorkflowActionType]: WorkflowActionExecutor<T>;
};

const ACTION_EXECUTOR_ENTRIES: Array<
  [WorkflowActionType, WorkflowActionExecutor<WorkflowActionType>]
> = [
  ['execute-command', executeCommand],
  ['execute-macro', executeMacro],
  ['open-file', openFile],
  ['open-menu', openMenu],
  ['open-settings', openSettings],
  ['open-uri', openURI],
  ['set-clipboard', setClipboard],
  ['simulate-hotkey', simulateHotkey],
];

const ACTION_EXECUTORS = Object.fromEntries(
  ACTION_EXECUTOR_ENTRIES
) as WorkflowActionExecutorMap;

/**
 * This singleton class is a registry for all available actions. It is used to execute the
 * action of a menu item. This class can be used only in the backend process.
 */
export class ActionRegistry {
  /** The singleton instance of this class. */
  private static instance: ActionRegistry = null;

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
  public static getInstance(): ActionRegistry {
    if (ActionRegistry.instance === null) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }

  /**
   * This method executes the action of the given menu item.
   *
   * @param item The menu item which is executed.
   * @param app The app which executed the action.
   * @returns A promise which resolves when the action has been successfully executed.
   */
  async execute(item: DeepReadonly<MenuItem>, app: KandoApp) {
    if (item.type !== 'button' || !item.selectWorkflow) {
      return;
    }

    let inhibitionID = 0;
    if (item.selectWorkflow.inhibitShortcuts) {
      inhibitionID = await app.getBackend().inhibitAllShortcuts();
    }

    try {
      for (const action of item.selectWorkflow.actions) {
        await this.executeAction(action, app);
      }
    } finally {
      if (item.selectWorkflow.inhibitShortcuts) {
        await app.getBackend().releaseInhibition(inhibitionID);
      }
    }
  }

  private executeAction(
    action: DeepReadonly<WorkflowAction>,
    app: KandoApp
  ): Promise<void> {
    const executor = ACTION_EXECUTORS[
      action.type
    ] as WorkflowActionExecutor<WorkflowActionType>;
    return executor(action, app);
  }
}
