//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Arslan-TR <https://github.com/Arslan-TR>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import {
  BUTTON_MENU_ITEM_SCHEMA_V2,
  SUBMENU_MENU_ITEM_SCHEMA_V2,
} from '../src/common/settings-schemata/menu-settings-v2';

describe('Scroll workflows', () => {
  const workflow = { actions: [{ type: 'simulate-hotkey', hotkey: 'VolumeUp' }] };

  it('should be kept for button items', () => {
    const item = BUTTON_MENU_ITEM_SCHEMA_V2.parse({
      type: 'button',
      name: 'Volume',
      icon: 'volume_up',
      iconTheme: 'material-symbols-rounded',
      scrollUpWorkflow: workflow,
      scrollDownWorkflow: { actions: [] },
    });

    expect(item.scrollUpWorkflow).to.deep.equal(workflow);
    expect(item.scrollDownWorkflow).to.deep.equal({ actions: [] });
  });

  it('should be kept for submenu items', () => {
    const item = SUBMENU_MENU_ITEM_SCHEMA_V2.parse({
      type: 'submenu',
      name: 'Volume',
      icon: 'volume_up',
      iconTheme: 'material-symbols-rounded',
      scrollUpWorkflow: workflow,
      children: [],
    });

    expect(item.scrollUpWorkflow).to.deep.equal(workflow);
    expect(item.scrollDownWorkflow).to.equal(undefined);
  });

  it('should be optional', () => {
    const item = BUTTON_MENU_ITEM_SCHEMA_V2.parse({
      type: 'button',
      name: 'Volume',
      icon: 'volume_up',
      iconTheme: 'material-symbols-rounded',
    });

    expect(item.scrollUpWorkflow).to.equal(undefined);
    expect(item.scrollDownWorkflow).to.equal(undefined);
  });
});
