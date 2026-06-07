//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import type { WindowWithAPIs } from './common-window-api';

import {
  ChildMenuItem,
  WorkflowActionType,
  SubmenuMenuItem,
  ButtonMenuItem,
  WorkflowAction,
  Workflow,
} from '.';

// This file is imported by both the menu renderer and the settings renderer. This
// function is used to check if the common API to call main process methods from the
// renderer is available in the current window.
function hasCommonAPI(currentWindow: unknown): currentWindow is WindowWithAPIs {
  return (
    typeof currentWindow === 'object' &&
    currentWindow !== null &&
    'commonAPI' in currentWindow
  );
}

/**
 * Meta information about a workflow action type. This includes the translated name, a
 * description and an icon.
 */
export type WorkflowActionTypeMeta = {
  /** The translated name of the workflow action type. */
  name: string;

  /** The icon representing the workflow action type. */
  icon: string;

  /** The theme of the icon. */
  iconTheme: string;

  /** The translated description of the workflow action type. */
  description: string;

  /**
   * Whether a workflow using this action should usually wait for Kando to fade out before
   * executing.
   */
  prefersDelayedExecution: boolean;

  /**
   * Whether a workflow using this action should usually inhibit Kando's shortcuts while
   * executing.
   */
  prefersInhibitedShortcuts: boolean;

  /** A function that creates a workflow action of this type with default parameters. */
  createAction: () => WorkflowAction;
};

/**
 * This singleton class is responsible for managing the action types of menu items. It
 * provides metadata for each action type, such as the name, description and icon.
 *
 * It can also be used to create new menu items with some predefined workflows for some
 * dropped data types. For example, if a file is dropped on the menu, we can create a new
 * menu item with the "open file" action and the corresponding file path as parameter.
 */
export class ActionTypeRegistry {
  /** The singleton instance of this class. */
  private static instance: ActionTypeRegistry = null;

  /** The metadata for each workflow action type. */
  private metadata: Record<WorkflowActionType, WorkflowActionTypeMeta>;

  /**
   * This is a singleton class. The constructor is private. Use `getInstance` to get the
   * instance of this class.
   */
  private constructor() {
    this.metadata = {
      ['close-menu']: {
        name: i18next.t('menu-actions.close-menu.name'),
        icon: 'close-menu-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.close-menu.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'close-menu' }),
      },
      ['close-submenu']: {
        name: i18next.t('menu-actions.close-submenu.name'),
        icon: 'close-submenu-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.close-submenu.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'close-submenu' }),
      },
      ['delay']: {
        name: i18next.t('menu-actions.delay.name'),
        icon: 'delay-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.delay.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'delay', duration: 1 }),
      },
      ['execute-command']: {
        name: i18next.t('menu-actions.execute-command.name'),
        icon: 'command-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.execute-command.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({
          type: 'execute-command',
          command: '',
          detached: true,
          isolated: false,
        }),
      },
      ['execute-macro']: {
        name: i18next.t('menu-actions.execute-macro.name'),
        icon: 'macro-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.execute-macro.description'),
        prefersDelayedExecution: true,
        prefersInhibitedShortcuts: true,
        createAction: () => ({ type: 'execute-macro', macro: [] }),
      },
      ['focus-window']: {
        name: i18next.t('menu-actions.focus-window.name'),
        icon: 'focus-window-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.focus-window.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'focus-window', windowName: '', appName: '' }),
      },
      ['inhibit-shortcuts']: {
        name: i18next.t('menu-actions.inhibit-shortcuts.name'),
        icon: 'inhibit-shortcuts-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.inhibit-shortcuts.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'inhibit-shortcuts' }),
      },
      ['open-file']: {
        name: i18next.t('menu-actions.open-file.name'),
        icon: 'file-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.open-file.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'open-file', path: '' }),
      },
      ['open-menu']: {
        name: i18next.t('menu-actions.open-menu.name'),
        icon: 'redirect-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.open-menu.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'open-menu', menu: '' }),
      },
      ['open-settings']: {
        name: i18next.t('menu-actions.open-settings.name'),
        icon: 'settings-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.open-settings.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'open-settings' }),
      },
      ['open-uri']: {
        name: i18next.t('menu-actions.open-uri.name'),
        icon: 'uri-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.open-uri.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'open-uri', uri: '' }),
      },
      ['set-clipboard']: {
        name: i18next.t('menu-actions.set-clipboard.name'),
        icon: 'clipboard-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.set-clipboard.description'),
        prefersDelayedExecution: false,
        prefersInhibitedShortcuts: false,
        createAction: () => ({ type: 'set-clipboard', text: '' }),
      },
      ['simulate-hotkey']: {
        name: i18next.t('menu-actions.simulate-hotkey.name'),
        icon: 'hotkey-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-actions.simulate-hotkey.description'),
        prefersDelayedExecution: true,
        prefersInhibitedShortcuts: true,
        createAction: () => ({ type: 'simulate-hotkey', hotkey: '' }),
      },
    };
  }

  /**
   * Use this method to get the singleton instance of this class.
   *
   * @returns The singleton instance of this class.
   */
  public static getInstance(): ActionTypeRegistry {
    if (ActionTypeRegistry.instance === null) {
      ActionTypeRegistry.instance = new ActionTypeRegistry();
    }
    return ActionTypeRegistry.instance;
  }

  /**
   * This method returns the meta information for all workflow action types. This includes
   * the translated name, a description and an icon.
   *
   * @returns A map of all workflow action types to their meta information.
   */
  public getAllMetadata(): Record<WorkflowActionType, WorkflowActionTypeMeta> {
    return this.metadata;
  }

  /**
   * This method returns the meta information for a given workflow action type. This
   * includes the translated name, a description and an icon.
   *
   * @param type The workflow action type for which the meta information should be
   *   returned.
   * @returns The meta information for the given workflow action type.
   */
  public getMetadata(type: WorkflowActionType): WorkflowActionTypeMeta {
    return this.metadata[type];
  }

  /**
   * This is used during drag-and-drop operations: When some data is dragged into the
   * settings menu, we try to create a corresponding action. Usually, the drag source
   * offers the data in a variety of formats. Given a list of formats, this method returns
   * true if one of the formats is supported.
   *
   * @param transfer The transferred data.
   * @returns True if the drag source offers a supported data type.
   */
  public hasSupportedDataType(transfer: DataTransfer): boolean {
    const supportedTypes = [
      'kando/new-item-type', // This is used for new items dragged from the item type list.
      'kando/menu', // This is used for menus dragged from the menu list.
      'Files',
      'text/uri-list',
      'text/plain',
    ];

    for (const type of supportedTypes) {
      if (transfer.types.includes(type)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Given some dropped data, this method returns a new menu item fitting to the data
   * type. The data type is a mime type such as 'text/plain' or a Kando-specific type such
   * as 'kando/new-item-type'. The data itself is a string that contains the data in the
   * corresponding format.
   *
   * @param transfer The transferred data.
   * @returns A new menu item with a single-action workflow fitting to the data type. If
   *   no item could be created, null is returned.
   */
  public async createItem(transfer: DataTransfer): Promise<ChildMenuItem | null> {
    // We collect all potential data formats first. We have to do this, because some of
    // the following code is asynchronous and the DataTransfer object becomes invalid
    // after an await.
    const data = new Map<string, string | File>();

    for (const type of transfer.types) {
      if (type === 'Files') {
        data.set(type, transfer.files[0]);
      } else if (
        type === 'text/plain' ||
        type === 'text/uri-list' ||
        type === 'kando/new-item-type' ||
        type === 'kando/menu'
      ) {
        data.set(type, transfer.getData(type));
      }
    }

    // This is used when a new item is dragged from the item type list in the footer. The
    // data will contain the type of the item to be created. See the FooterButton
    // component for more details.
    if (data.has('kando/new-item-type')) {
      const typeName = data.get('kando/new-item-type') as string;
      if (typeName === 'submenu') {
        const newItem: SubmenuMenuItem = {
          type: 'submenu',
          name: i18next.t('menu-items.submenu.name'),
          icon: 'submenu-item.svg',
          iconTheme: 'kando',
          children: [],
          activateWorkflow: {
            quickSelectKey: 'Backspace',
            actions: [
              {
                type: 'close-submenu',
              },
            ],
          },
        };
        return newItem;
      } else {
        const actionType = this.getMetadata(typeName as WorkflowActionType);

        if (!actionType) {
          console.warn(`No action type found for type name ${typeName}`);
          return null;
        }

        const selectWorkflow: Workflow = {
          actions: [],
        };

        if (actionType.prefersInhibitedShortcuts) {
          selectWorkflow.actions.push({
            type: 'inhibit-shortcuts',
          });
        }

        if (actionType.prefersDelayedExecution) {
          selectWorkflow.actions.push({
            type: 'close-menu',
          });
        }

        selectWorkflow.actions.push(actionType.createAction());

        // Open-menu actions are a special case: They should not be followed by a
        // close-menu action, because the menu can stay open.
        if (!actionType.prefersDelayedExecution && typeName !== 'open-menu') {
          selectWorkflow.actions.push({
            type: 'close-menu',
          });
        }

        const newItem: ButtonMenuItem = {
          type: 'button',
          name: actionType.name,
          icon: actionType.icon,
          iconTheme: actionType.iconTheme,
          selectWorkflow,
        };

        return newItem;
      }
    }

    // This is used during drag-and-drop operations of menus in the editor. See the
    // MenuList component for more details, especially regarding the RenderedMenu type
    // which is transferred as JSON in the 'kando/menu' data type.
    if (data.has('kando/menu')) {
      const menu = JSON.parse(data.get('kando/menu') as string);

      const newItem: ButtonMenuItem = {
        type: 'button',
        name: menu.name,
        icon: menu.icon,
        iconTheme: menu.iconTheme,
        selectWorkflow: {
          actions: [
            {
              type: 'open-menu',
              menu: menu.name,
            },
          ],
        },
      };

      return newItem;
    }

    // Creating a action for a file may fail. If it does, we try another data type
    // below. This is actually only called from the renderer process, so we use the
    // common API to create the item. Yet this is not available in the main process, so
    // we check for the preload API before calling it.
    if (data.has('Files') && typeof window !== 'undefined' && hasCommonAPI(window)) {
      const item = await window.commonAPI.createItemForDroppedFile(
        data.get('Files') as File
      );

      if (item && item.type !== 'root') {
        return item;
      }
    }

    // If the dropped data is a URI list, we create an "open URI" action.
    if (data.has('text/uri-list')) {
      const uriType = this.getMetadata('open-uri');

      const newItem: ButtonMenuItem = {
        type: 'button',
        name: uriType.name,
        icon: uriType.icon,
        iconTheme: uriType.iconTheme,
        selectWorkflow: {
          actions: [
            {
              type: 'open-uri',
              uri: data.get('text/uri-list') as string,
            },
            {
              type: 'close-menu',
            },
          ],
        },
      };

      return newItem;
    }

    // If the dropped data is plain text, we create a "set clipboard" action.
    if (data.has('text/plain')) {
      const clipboardType = this.getMetadata('set-clipboard');

      const newItem: ButtonMenuItem = {
        type: 'button',
        name: clipboardType.name,
        icon: clipboardType.icon,
        iconTheme: clipboardType.iconTheme,
        selectWorkflow: {
          actions: [
            {
              type: 'set-clipboard',
              text: data.get('text/plain') as string,
            },
            {
              type: 'close-menu',
            },
          ],
        },
      };

      return newItem;
    }

    return null;
  }
}
