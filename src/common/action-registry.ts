//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from './index';
import { Backend } from '../main/backends/backend';

import { CommandItemAction } from './item-types/command-item-action';
import { HotkeyItemAction } from './item-types/hotkey-item-action';
import { URIItemAction } from './item-types/uri-item-action';
import { DeepReadonly } from '../main/settings';

/**
 * This interface describes the action of a menu item. The action is what happens when the
 * menu item is executed. Every item type which can be executed should implement this
 * interface. You can find the implementations in the `item-types` directory.
 */
export interface IItemAction {
  /**
   * This will be called when the action is about to be executed. If this method returns
   * `false`, the action will be executed right away. If it returns `true`, the action
   * will be executed after Kando's window has been closed. This is useful for actions
   * which act on another application which has to regain input focus before the action
   * can be executed.
   *
   * @param item The menu item for which an action is about to be executed.
   */
  delayedExecution: (item: DeepReadonly<IMenuItem>) => boolean;

  /**
   * This will be called when the menu item is executed.
   *
   * @param item The menu item which is executed.
   * @param backend The backend which is currently used. Use this to call system-dependent
   *   functions.
   * @returns A promise which resolves when the action has been successfully executed.
   */
  execute: (item: DeepReadonly<IMenuItem>, backend: Backend) => Promise<void>;
}

/**
 * This singleton class is a registry for all available actions. It is used to execute the
 * action of a menu item.
 */
export class ActionRegistry {
  /** The singleton instance of this class. */
  private static instance: ActionRegistry = null;

  /** This map contains all available actions. The keys are the type names. */
  private actions: Map<string, IItemAction> = new Map();

  /**
   * This is a singleton class. The constructor is private. Use `getInstance` to get the
   * instance of this class.
   */
  private constructor() {
    this.actions.set('command', new CommandItemAction());
    this.actions.set('hotkey', new HotkeyItemAction());
    this.actions.set('uri', new URIItemAction());
  }

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
   * This method returns `true` if the action of the given menu item should be executed
   * after Kando's window has been closed.
   *
   * @param item The menu item for which an action is about to be executed.
   * @returns `true` if the action should be executed after Kando's window has been
   *   closed.
   * @throws An error if the type of the menu item is unknown.
   */
  public delayedExecution(item: DeepReadonly<IMenuItem>): boolean {
    return this.getAction(item.type).delayedExecution(item);
  }

  /**
   * This method executes the action of the given menu item.
   *
   * @param item The menu item which is executed.
   * @param backend The backend which is currently used.
   * @returns A promise which resolves when the action has been successfully executed.
   */
  async execute(item: DeepReadonly<IMenuItem>, backend: Backend) {
    return this.getAction(item.type).execute(item, backend);
  }

  /**
   * This method returns the action of the given type.
   *
   * @param type The type of the action.
   * @returns The action of the given type.
   * @throws An error if the type is unknown.
   */
  private getAction(type: string): IItemAction {
    const action = this.actions.get(type);

    if (action === undefined) {
      throw new Error(`Unknown action type: ${type}`);
    }

    return action;
  }
}
