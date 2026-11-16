//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import { Backend } from '../../src/main/backends/backend';

/**
 * A minimal backend which does not bind anything. Instead, it records the effectively
 * bound shortcuts which the base class passes to onShortcutsChanged(). This allows
 * testing the shortcut inhibition logic of the base class without Electron.
 */
class TestBackend extends Backend {
  public effectiveShortcuts: string[] = [];

  public getBackendInfo() {
    return {
      name: 'Test',
      menuWindowType: 'normal',
      supportsShortcuts: true,
      shortcutHint: '',
      shouldUseTransparentSettingsWindow: false,
      supportsGlobalPointerTracking: false,
    } as ReturnType<Backend['getBackendInfo']>;
  }

  public async init() {}
  public async deinit() {}
  public async getWMInfo() {
    return { appName: '', windowName: '', pointerX: 0, pointerY: 0 };
  }
  public async getOpenWindows() {
    return [];
  }
  public async focusWindow() {}
  public async getInstalledApps() {
    return [];
  }
  public async movePointer() {}
  protected async simulateKeysImpl() {}

  protected async onShortcutsChanged(
    currentShortcuts: string[],
    previousShortcuts: string[],
    currentEffectiveShortcuts: string[]
  ) {
    this.effectiveShortcuts = currentEffectiveShortcuts;
  }

  /** Exposes the protected isShortcutInhibited() method for testing. */
  public isInhibited(shortcut: string) {
    return this.isShortcutInhibited(shortcut);
  }
}

describe('Shortcut inhibition', () => {
  let backend: TestBackend;

  beforeEach(async () => {
    backend = new TestBackend();
  });

  it('should unbind all shortcuts when all shortcuts are inhibited', async () => {
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+B']);
    await backend.inhibitAllShortcuts();

    expect(backend.effectiveShortcuts).to.deep.equal([]);
    expect(backend.isInhibited('Ctrl+A')).to.be.true;
  });

  it('should keep uninhibitable shortcuts bound when all shortcuts are inhibited', async () => {
    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+B', 'Ctrl+T']);
    await backend.inhibitAllShortcuts();

    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+T']);
    expect(backend.isInhibited('Ctrl+A')).to.be.true;
    expect(backend.isInhibited('Ctrl+T')).to.be.false;
  });

  it('should rebind all shortcuts when the inhibition is released', async () => {
    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T']);
    const id = await backend.inhibitAllShortcuts();
    await backend.releaseInhibition(id);

    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A', 'Ctrl+T']);
    expect(backend.isInhibited('Ctrl+A')).to.be.false;
  });

  it('should still allow inhibiting uninhibitable shortcuts individually', async () => {
    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T']);
    await backend.inhibitShortcut('Ctrl+T');

    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A']);
    expect(backend.isInhibited('Ctrl+T')).to.be.true;
  });

  it('should update the bound shortcuts if the uninhibitable shortcuts change while all are inhibited', async () => {
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T']);
    await backend.inhibitAllShortcuts();
    expect(backend.effectiveShortcuts).to.deep.equal([]);

    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+T']);

    await backend.setUninhibitableShortcuts([]);
    expect(backend.effectiveShortcuts).to.deep.equal([]);
  });
});
