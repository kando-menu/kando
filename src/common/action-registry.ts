//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INode } from './index';
import { Backend } from '../main/backends/backend';

import { CommandAction } from './item-types/command-action';
import { HotkeyAction } from './item-types/hotkey-action';
import { URIAction } from './item-types/uri-action';
import { DeepReadonly } from '../main/settings';

/** In Kando, actions are used to define what happens when a menu item is clicked. */

/** This interface describes the action of a menu item. */
export interface IAction {
  delayedExecution(node: DeepReadonly<INode>): boolean;

  /** This will be called when the menu item is executed. */
  execute(node: DeepReadonly<INode>, backend: Backend): void;
}

export class ActionRegistry {
  private static instance: ActionRegistry = null;

  private types: Map<string, IAction> = new Map();

  private constructor() {
    this.registerType('command', new CommandAction());
    this.registerType('hotkey', new HotkeyAction());
    this.registerType('uri', new URIAction());
  }

  public static getInstance(): ActionRegistry {
    if (ActionRegistry.instance === null) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }

  public delayedExecution(node: DeepReadonly<INode>): boolean {
    return this.types.get(node.type).delayedExecution(node);
  }

  public execute(node: DeepReadonly<INode>, backend: Backend) {
    const type = this.types.get(node.type);
    type.execute(node, backend);
  }

  private registerType(name: string, type: IAction): void {
    this.types.set(name, type);
  }
}
