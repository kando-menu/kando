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

import { CommandAction } from './item-types/command-action';
import { HotkeyAction } from './item-types/hotkey-action';
import { URIAction } from './item-types/uri-action';
import { DeepReadonly } from '../main/settings';

/**
 * This interface describes the action of a menu item. The action is what happens when the
 * menu item is executed. Every item type which can be executed should implement this
 * interface. You can find the implementations in the `item-types` directory.
 */
export interface IAction {
  /**
   * This will be called when the action is about to be executed. If this method returns
   * `false`, the action will be executed right away. If it returns `true`, the action
   * will be executed after Kando's window has been closed. This is useful for actions
   * which act on another application which has to regain input focus before the action
   * can be executed.
   *
   * @param item The menu item for which an action is about to be executed.
   */
  delayedExecution(item: DeepReadonly<IMenuItem>): boolean;

  /**
   * This will be called when the menu item is executed.
   *
   * @param item The menu item which is executed.
   * @param backend The backend which is currently used. Use this to call system-dependent
   *   functions.
   */
  execute(item: DeepReadonly<IMenuItem>, backend: Backend): void;
}

/**
 * This singleton class is a registry for all available actions. It is used to execute the
 * action of a menu item.
 */
export class ActionRegistry {
  /** The singleton instance of this class. */
  private static instance: ActionRegistry = null;

  /** This map contains all available actions. The keys are the type names. */
  private actions: Map<string, IAction> = new Map();

  /**
   * This is a singleton class. The constructor is private. Use `getInstance` to get the
   * instance of this class.
   */
  private constructor() {
    this.actions.set('command', new CommandAction());
    this.actions.set('hotkey', new HotkeyAction());
    this.actions.set('uri', new URIAction());
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
   */
  public delayedExecution(item: DeepReadonly<IMenuItem>): boolean {
    return this.actions.get(item.type).delayedExecution(item);
  }

  /**
   * This method executes the action of the given menu item.
   *
   * @param item The menu item which is executed.
   * @param backend The backend which is currently used.
   */
  public execute(item: DeepReadonly<IMenuItem>, backend: Backend) {
    const action = this.actions.get(item.type);
    action.execute(item, backend);
  }
}
