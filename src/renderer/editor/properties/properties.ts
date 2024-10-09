//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import i18next from 'i18next';

import { IEditorMenuItem } from '../common/editor-menu-item';
import { IMenu, IBackendInfo, IShowEditorOptions } from '../../../common';
import { IconPicker } from './icon-picker';
import { ConditionPicker } from './condition-picker';
import { IconThemeRegistry } from '../../icon-themes/icon-theme-registry';
import { TextPicker } from './text-picker';
import { ShortcutPicker } from './shortcut-picker';
import { ShortcutIDPicker } from './shortcut-id-picker';
import { ItemConfigRegistry } from '../../../common/item-config-registry';
import { AdvancedOptionsPicker } from './advanced-options-picker';

/**
 * This class is responsible for displaying the properties of the currently edited menu
 * item. It emits events when the user changes one of the properties of the currently
 * edited menu item. The new values are stored in the menu item object before the
 * corresponding event is emitted, so you can access the new values by accessing the
 * properties of the menu item object. It is an event emitter which emits the following
 * events:
 *
 * @fires changed-name - When the user changed the name of the current menu item.
 * @fires changed-icon - When the user changed the icon of the current menu item.
 * @fires changed-shortcut - When the user changed the shortcut of the current menu.
 */
export class Properties extends EventEmitter {
  /**
   * The container is the HTML element which contains the currently edited menu's
   * properties. It is created in the constructor and returned by the getContainer()
   * method.
   */
  private container: HTMLElement = null;

  /**
   * The backend info is used to determine whether the menu properties view should show a
   * 'Shortcut' label or a 'Shortcut Name' label.
   */
  private backend: IBackendInfo = null;

  /**
   * The icon picker is a component that allows the user to select an icon from a
   * filterable grid of icons.
   */
  private iconPicker: IconPicker = null;

  /**
   * The condition picker is a component that allows the user to select conditions under
   * which the current menu should be shown.
   */
  private conditionPicker: ConditionPicker = null;

  /**
   * The base settings div contains the name input, the icon button, and the
   * type-dependent settings as well as a hint element.
   */
  private baseSettings: HTMLElement = null;

  /**
   * The settings wrapper contains the item-type specific settings. It is required for
   * smooth animations when the item settings change.
   */
  private settingsWrapper: HTMLElement = null;

  /**
   * The name input is an input element that allows the user to change the name of the
   * currently edited menu item.
   */
  private nameInput: HTMLInputElement = null;

  /** The icon button is a button that allows the user to open the icon picker. */
  private iconButton: HTMLButtonElement = null;

  /**
   * The menu settings div contains the elements shown when the user is editing the root
   * item of a menu.
   */
  private menuSettings: HTMLElement = null;

  /**
   * The item settings div contains the item-type specific settings for the currently
   * edited menu item. It is cleared and filled every time the active item changes.
   */
  private itemSettings: HTMLElement = null;

  /**
   * The shortcut picker is a component that allows the user to select a shortcut for the
   * currently edited menu item.
   */
  private shortcutPicker: TextPicker = null;

  /**
   * The advanced options picker is a component that allows the user to select advanced
   * options for the currently edited menu.
   */
  private advancedOptionsPicker: AdvancedOptionsPicker = null;

  /**
   * This shows a tip-of-the-day below the properties view. It is used to give the user
   * some hints on how to configure the item.
   */
  private hintElement: HTMLElement = null;

  /**
   * The currently edited menu item. This is the item whose properties are displayed in
   * this view.
   */
  private activeItem: IEditorMenuItem = null;

  /** If the root item of a menu is edited, this is the menu that is edited. */
  private activeMenu: IMenu = null;

  /**
   * This constructor creates the HTML elements for the menu properties view and wires up
   * all the functionality.
   *
   * @param backend The backend info is used to determine whether the menu properties view
   *   should show a 'Shortcut' label or a 'Shortcut Name' label.
   */
  constructor(backend: IBackendInfo) {
    super();

    this.backend = backend;

    const template = require('./templates/properties.hbs');

    const div = document.createElement('div');
    div.innerHTML = template({
      strings: {
        menuConditions: i18next.t('properties.common.menu-conditions'),
        menuConditionsHint: i18next.t('properties.common.menu-conditions-hint'),
        menuBehavior: i18next.t('properties.common.menu-behavior'),
        menuBehaviorHint: i18next.t('properties.common.menu-behavior-hint'),
      },
    });

    // The first child of the div is the container.
    this.container = div.firstElementChild as HTMLElement;

    // Store references to various elements.
    this.settingsWrapper = div.querySelector('#kando-menu-properties-settings-wrapper');
    this.baseSettings = div.querySelector('#kando-menu-properties-base-settings');
    this.menuSettings = div.querySelector('#kando-menu-properties-menu-settings');
    this.itemSettings = div.querySelector('#kando-menu-properties-item-settings');
    this.hintElement = div.querySelector('#kando-menu-properties-hint');

    // Emit the 'changed-name' event when the name input changes.
    this.nameInput = div.querySelector('#kando-menu-properties-name') as HTMLInputElement;
    this.nameInput.addEventListener('input', () => {
      if (this.activeItem) {
        this.activeItem.name = this.nameInput.value;
        this.emit('changed-name');
      }
    });

    // Show the icon picker when the icon button is clicked.
    this.iconButton = div.querySelector(
      '#kando-menu-properties-icon-button'
    ) as HTMLButtonElement;
    this.iconButton.addEventListener('click', () => {
      this.iconPicker.show(this.activeItem.icon, this.activeItem.iconTheme);
      this.baseSettings.classList.add('hidden');
    });

    // Create the icon picker and wire up its events.
    this.iconPicker = new IconPicker(
      div.querySelector('#kando-menu-properties-icon-picker')
    );
    this.iconPicker.on('select', (icon, theme) => {
      if (this.activeItem) {
        this.activeItem.icon = icon;
        this.activeItem.iconTheme = theme;

        this.iconButton.innerHTML = IconThemeRegistry.getInstance().createIcon(
          theme,
          icon
        ).outerHTML;

        this.emit('changed-icon');
      }
    });
    this.iconPicker.on('hide', () => {
      this.baseSettings.classList.remove('hidden');
    });

    // Create the condition picker and wire up its events.
    this.conditionPicker = new ConditionPicker(
      div.querySelector('#kando-menu-properties-condition-picker')
    );
    this.conditionPicker.on('close', () => {
      this.baseSettings.classList.remove('hidden');
    });

    // Show the condition picker when the condition button is clicked.
    const conditionButton = div.querySelector(
      '#kando-menu-properties-condition-button'
    ) as HTMLButtonElement;
    conditionButton.addEventListener('click', () => {
      this.conditionPicker.show(this.activeMenu);
      this.baseSettings.classList.add('hidden');
    });

    // Create the advanced options picker and wire up its events.
    this.advancedOptionsPicker = new AdvancedOptionsPicker(
      div.querySelector('#kando-menu-properties-advanced-options-picker')
    );
    this.advancedOptionsPicker.on('close', () => {
      this.baseSettings.classList.remove('hidden');
    });

    // Show the options picker when the options button is clicked.
    const advancedOptionsButton = div.querySelector(
      '#kando-menu-properties-advanced-options-button'
    ) as HTMLButtonElement;
    advancedOptionsButton.addEventListener('click', () => {
      this.advancedOptionsPicker.show();
      this.baseSettings.classList.add('hidden');
    });

    // Create the shortcut picker or the shorcut ID picker and wire up its events.
    if (this.backend.supportsShortcuts) {
      this.shortcutPicker = new ShortcutPicker();
      this.shortcutPicker.on('change', (shortcut) => {
        if (this.activeMenu) {
          this.activeMenu.shortcut = shortcut;
          this.emit('changed-shortcut');
        }
      });
    } else {
      this.shortcutPicker = new ShortcutIDPicker(this.backend.shortcutHint);
      this.shortcutPicker.on('change', (id) => {
        if (this.activeMenu) {
          this.activeMenu.shortcutID = id;
          this.emit('changed-shortcut');
        }
      });
    }

    const shortcutContainer = div.querySelector(
      '#kando-menu-properties-shortcut-picker'
    ) as HTMLElement;
    shortcutContainer.appendChild(this.shortcutPicker.getContainer());
  }

  /** This method returns the container of the menu preview. */
  public getContainer(): HTMLElement {
    return this.container;
  }

  /** This method shows the properties view. It adds the 'visible' class to the container. */
  public show() {
    this.container.classList.add('visible');
  }

  /**
   * This method hides the properties view. It removes the 'visible' class from the
   * container.
   */
  public hide() {
    this.container.classList.remove('visible');
  }

  /**
   * Make this Properties view display the properties of the given menu.
   *
   * @param menu The menu whose properties should be displayed.
   */
  public async setMenu(menu: IMenu) {
    this.iconPicker.hide();
    this.conditionPicker.hide();
    this.advancedOptionsPicker.hide();

    // If a menu is already active, we don't need a transition. We can just update the
    // settings.
    if (this.activeMenu) {
      this.updateMenuSettingsWidgets(menu);
      this.updateItemSettingsWidgets(menu.root);
      this.menuSettings.classList.remove('hidden');
      return;
    }

    // If the menu was not active, we need to animate the settings wrapper. First we hide
    // the settings wrapper, then we update the settings, and finally we show the settings
    // wrapper again.
    await this.hideSettingsWrapper();

    this.updateMenuSettingsWidgets(menu);
    this.updateItemSettingsWidgets(menu.root);
    this.menuSettings.classList.remove('hidden');

    await this.updateSettingsWrapperSize();
    await this.showSettingsWrapper();
  }

  /**
   * Make this Properties view display the properties of the given menu item.
   *
   * @param item The menu item whose properties should be displayed.
   */
  public async setItem(item: IEditorMenuItem) {
    this.iconPicker.hide();
    this.conditionPicker.hide();
    this.advancedOptionsPicker.hide();

    // If an item of the same type is already active, we can just update the settings. No
    // need for animations.
    if (!this.activeMenu && this.activeItem && this.activeItem.type === item.type) {
      this.updateItemSettingsWidgets(item);
      this.menuSettings.classList.add('hidden');
      this.activeMenu = null;
      return;
    }

    // If the item type changed, we need to animate the settings wrapper. First we hide
    // the settings wrapper, then we update the settings, and finally we show the settings
    // wrapper again.
    await this.hideSettingsWrapper();

    this.updateItemSettingsWidgets(item);
    this.menuSettings.classList.add('hidden');
    this.activeMenu = null;

    await this.updateSettingsWrapperSize();
    await this.showSettingsWrapper();
  }

  /**
   * This method sets the default values for the condition picker. It is called when the
   * editor is shown.
   *
   * @param options The options to set.
   */
  public setOptions(options: IShowEditorOptions) {
    this.conditionPicker.setConditionHints(
      options.appName,
      options.windowName,
      options.windowPosition
    );
  }

  /**
   * This method updates the settings widgets to display the properties of the given menu
   * item.
   *
   * @param item The menu item whose properties should be displayed.
   */
  private updateItemSettingsWidgets(item: IEditorMenuItem) {
    this.activeItem = item;
    this.nameInput.value = item.name;

    this.iconButton.innerHTML = IconThemeRegistry.getInstance().createIcon(
      item.iconTheme,
      item.icon
    ).outerHTML;

    const settings = ItemConfigRegistry.getInstance().getConfigWidget(item);

    this.itemSettings.innerHTML = '';

    if (settings) {
      this.itemSettings.appendChild(settings);
    }

    this.hintElement.innerHTML = ItemConfigRegistry.getInstance().getTipOfTheDay(
      item.type
    );
  }

  /**
   * This method updates the settings widgets to display the properties of the given menu.
   *
   * @param menu The menu whose properties should be displayed.
   */
  private updateMenuSettingsWidgets(menu: IMenu) {
    this.activeMenu = menu;

    this.advancedOptionsPicker.setMenu(menu);

    this.shortcutPicker.setValue(
      (this.backend.supportsShortcuts ? menu.shortcut : menu.shortcutID) || ''
    );
  }

  /**
   * This method hides the menu and menu item settings.
   *
   * @returns A promise that resolves when the settings wrapper is hidden.
   */
  private async hideSettingsWrapper() {
    this.settingsWrapper.classList.add('hidden');
    await new Promise((resolve) => setTimeout(resolve, 75));
  }

  /**
   * This method shows the menu and menu item settings.
   *
   * @returns A promise that resolves when the settings wrapper is shown.
   */
  private async showSettingsWrapper() {
    this.settingsWrapper.classList.remove('hidden');
    await new Promise((resolve) => setTimeout(resolve, 75));
  }

  /**
   * This method updates the size of the settings wrapper to match the size of the
   * contained menu and menu item settings. This is required for smooth animations.
   *
   * @returns A promise that resolves when the settings wrapper has been resized.
   */
  public async updateSettingsWrapperSize() {
    this.settingsWrapper.style.height =
      this.itemSettings.clientHeight + this.menuSettings.clientHeight + 'px';
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}
