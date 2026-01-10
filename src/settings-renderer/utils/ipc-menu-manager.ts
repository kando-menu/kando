//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IPCClient } from '../../common/ipc/ipc-client';
import { MenuItem } from '../../common';

export type IPCButtonAction = {
  name: string;
  icon: string;
  iconTheme: string;
  callback: () => void;
};

/**
 * IPCMenuManager provides a high-level API for opening simple one-level Kando menus with
 * actions. Each action has a label and a callback. When the user selects an action, the
 * corresponding callback is called.
 */
export class IPCMenuManager {
  private ipcClient: IPCClient;
  private lastActions: IPCButtonAction[] = [];

  constructor(clientName: string, port: number, token: string) {
    this.ipcClient = new IPCClient(clientName, port, token);
    this.ipcClient.on('select', (path: number[]) => this.handleSelect(path));
    this.ipcClient.on('cancel', () => this.handleCancel());
  }

  /** Initializes the IPC client. Must be called before showing menus. */
  public async init() {
    return this.ipcClient.init();
  }

  /**
   * Shows a simple one-level menu with actions. Each action has a label and a callback.
   * When the user selects an action, the callback is called.
   *
   * @param actions Array of actions with label and callback.
   */
  public showMenu(
    name: string,
    icon: string,
    iconTheme: string,
    actions: IPCButtonAction[]
  ): void {
    this.lastActions = actions;
    const menu: MenuItem = {
      type: 'submenu',
      name,
      icon,
      iconTheme,
      children: actions.map((action) => ({
        type: 'simple-button',
        name: action.name,
        icon: action.icon,
        iconTheme: action.iconTheme,
      })),
    };
    this.ipcClient.showMenu(menu);
  }

  private handleSelect(path: number[]): void {
    // Only handle one-level menus: path[0] is the index of the selected action.
    if (path.length === 1 && this.lastActions[path[0]]) {
      this.lastActions[path[0]].callback();
    }
    this.lastActions = [];
  }

  private handleCancel(): void {
    this.lastActions = [];
  }

  /** Closes the IPC connection. */
  public close(): void {
    this.ipcClient.close();
  }
}
