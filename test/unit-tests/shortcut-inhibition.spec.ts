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

  /** Records every call of onShortcutsChanged(). */
  public calls: Array<{ effective: string[]; previousEffective: string[] }> = [];

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
    currentEffectiveShortcuts: string[],
    previousEffectiveShortcuts: string[]
  ) {
    this.effectiveShortcuts = currentEffectiveShortcuts;
    this.calls.push({
      effective: currentEffectiveShortcuts,
      previousEffective: previousEffectiveShortcuts,
    });
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

describe('Shortcut inhibition: toggle shortcut scenarios', () => {
  let backend: TestBackend;

  beforeEach(() => {
    backend = new TestBackend();
  });

  it('should keep several uninhibitable shortcuts bound', async () => {
    await backend.setUninhibitableShortcuts(['Ctrl+T', 'Ctrl+U']);
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T', 'Ctrl+U']);
    await backend.inhibitAllShortcuts();

    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+T', 'Ctrl+U']);
  });

  it('should behave as before if the uninhibitable list is empty', async () => {
    await backend.setUninhibitableShortcuts([]);
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+B']);
    const id = await backend.inhibitAllShortcuts();
    expect(backend.effectiveShortcuts).to.deep.equal([]);

    await backend.releaseInhibition(id);
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A', 'Ctrl+B']);
  });

  it('should not bind an uninhibitable shortcut which was never bound', async () => {
    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    await backend.bindShortcuts(['Ctrl+A']);
    const id = await backend.inhibitAllShortcuts();
    expect(backend.effectiveShortcuts).to.deep.equal([]);

    await backend.releaseInhibition(id);
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A']);
  });

  it('should apply newly bound shortcuts correctly while all are inhibited', async () => {
    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    await backend.bindShortcuts(['Ctrl+A']);
    await backend.inhibitAllShortcuts();

    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T', 'Ctrl+B']);
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+T']);
  });

  it('should not unbind the uninhibitable shortcut when inhibiting all', async () => {
    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T']);
    await backend.inhibitAllShortcuts();

    // The base implementation unbinds "previous minus current" shortcuts. The toggle
    // shortcut must not be part of that set, else it could not re-enable the others.
    const last = backend.calls[backend.calls.length - 1];
    const toUnbind = last.previousEffective.filter((s) => !last.effective.includes(s));
    const toBind = last.effective.filter((s) => !last.previousEffective.includes(s));

    expect(toUnbind).to.deep.equal(['Ctrl+A']);
    expect(toBind).to.deep.equal([]);
  });

  it('should stay inhibited until all inhibitions are released', async () => {
    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T']);
    const id1 = await backend.inhibitAllShortcuts();
    const id2 = await backend.inhibitAllShortcuts();
    expect(id2).to.not.equal(id1);

    await backend.releaseInhibition(id1);
    expect(backend.isInhibited('Ctrl+A')).to.be.true;

    await backend.releaseInhibition(id2);
    expect(backend.isInhibited('Ctrl+A')).to.be.false;
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A', 'Ctrl+T']);
  });

  it('should combine individual inhibitions with inhibiting all shortcuts', async () => {
    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T', 'Ctrl+B']);

    await backend.inhibitShortcut('Ctrl+B');
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A', 'Ctrl+T']);

    const allID = await backend.inhibitAllShortcuts();
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+T']);

    // Ctrl+B is still inhibited individually after releasing the "all" inhibition.
    await backend.releaseInhibition(allID);
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A', 'Ctrl+T']);
    expect(backend.isInhibited('Ctrl+B')).to.be.true;
  });

  it('should not report unrelated shortcuts as inhibited', async () => {
    await backend.bindShortcuts(['Ctrl+A']);
    await backend.inhibitShortcut('Ctrl+A');

    expect(backend.isInhibited('Ctrl+A')).to.be.true;
    expect(backend.isInhibited('Ctrl+B')).to.be.false;
  });

  it('should not rebind anything if the uninhibitable list changes while not inhibited', async () => {
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T']);
    const callsBefore = backend.calls.length;

    await backend.setUninhibitableShortcuts(['Ctrl+T']);

    expect(backend.calls.length).to.equal(callsBefore);
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A', 'Ctrl+T']);
  });

  it('should ignore setting an identical uninhibitable list again', async () => {
    await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T']);
    await backend.inhibitAllShortcuts();

    await backend.setUninhibitableShortcuts(['Ctrl+T']);
    const callsAfterFirst = backend.calls.length;
    await backend.setUninhibitableShortcuts(['Ctrl+T']);

    expect(backend.calls.length).to.equal(callsAfterFirst);
    expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+T']);
  });

  it('should ignore releasing an unknown inhibition ID', async () => {
    await backend.bindShortcuts(['Ctrl+A']);
    await backend.inhibitAllShortcuts();
    const callsBefore = backend.calls.length;

    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      await backend.releaseInhibition(999);
    } finally {
      console.warn = originalWarn;
    }

    expect(backend.calls.length).to.equal(callsBefore);
    expect(backend.effectiveShortcuts).to.deep.equal([]);
  });

  describe('toggling like App.toggleShortcutInhibition()', () => {
    // This mirrors the logic of App.toggleShortcutInhibition() in src/main/app.ts
    // (without the tray update), because app.ts cannot be imported without Electron.
    // If that method changes, this helper must be updated as well.
    class ToggleHelper {
      public inhibitAllShortcutsID = 0;

      constructor(private backend: TestBackend) {}

      public async toggle() {
        if (this.inhibitAllShortcutsID > 0) {
          await this.backend.releaseInhibition(this.inhibitAllShortcutsID);
          this.inhibitAllShortcutsID = 0;
        } else {
          this.inhibitAllShortcutsID = await this.backend.inhibitAllShortcuts();
        }
      }
    }

    it('should alternate between all and only the toggle shortcut', async () => {
      await backend.setUninhibitableShortcuts(['Ctrl+T']);
      await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T']);
      const helper = new ToggleHelper(backend);

      for (let i = 1; i <= 5; i++) {
        await helper.toggle();
        if (i % 2 === 1) {
          expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+T']);
          expect(helper.inhibitAllShortcutsID).to.be.greaterThan(0);
        } else {
          expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A', 'Ctrl+T']);
          expect(helper.inhibitAllShortcutsID).to.equal(0);
        }
      }
    });

    it('should work with a toggle shortcut which is changed while disabled', async () => {
      await backend.setUninhibitableShortcuts(['Ctrl+T']);
      await backend.bindShortcuts(['Ctrl+A', 'Ctrl+T']);
      const helper = new ToggleHelper(backend);

      await helper.toggle();
      expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+T']);

      // The user chooses a new toggle shortcut while everything is disabled.
      await backend.bindShortcuts(['Ctrl+A', 'Ctrl+K']);
      await backend.setUninhibitableShortcuts(['Ctrl+K']);
      expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+K']);

      await helper.toggle();
      expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+A', 'Ctrl+K']);
    });

    it('should work if the toggle shortcut is the same as the menu shortcut', async () => {
      await backend.setUninhibitableShortcuts(['Ctrl+Space']);
      await backend.bindShortcuts(['Ctrl+Space']);
      const helper = new ToggleHelper(backend);

      await helper.toggle();
      expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+Space']);

      await helper.toggle();
      expect(backend.effectiveShortcuts).to.deep.equal(['Ctrl+Space']);
    });
  });
});
