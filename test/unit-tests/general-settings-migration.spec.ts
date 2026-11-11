//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import { loadGeneralSettings } from '../../src/main/settings/general-settings';

describe('general settings migration to V2', () => {
  describe('settings files without a version', () => {
    it('converts a top-level rmbSelectsParent of true to select-parent', () => {
      const result = loadGeneralSettings({ rmbSelectsParent: true });
      expect(result.settings.rightMouseButtonBehavior).to.equal('select-parent');
      expect(result.didMigration).to.equal(true);
      expect(result.settings).to.not.have.property('rmbSelectsParent');
    });

    it('converts a top-level rmbSelectsParent of false to close', () => {
      const result = loadGeneralSettings({ rmbSelectsParent: false });
      expect(result.settings.rightMouseButtonBehavior).to.equal('close');
      expect(result.didMigration).to.equal(true);
      expect(result.settings).to.not.have.property('rmbSelectsParent');
    });

    it('converts a menuOptions.rmbSelectsParent of true to select-parent', () => {
      const result = loadGeneralSettings({ menuOptions: { rmbSelectsParent: true } });
      expect(result.settings.rightMouseButtonBehavior).to.equal('select-parent');
      expect(result.didMigration).to.equal(true);
      expect(result.settings).to.not.have.property('rmbSelectsParent');
    });
  });

  describe('settings files written by Kando 3.0.x', () => {
    it('converts rmbSelectsParent of true to select-parent', () => {
      const result = loadGeneralSettings({ version: '3.0.1', rmbSelectsParent: true });
      expect(result.settings.rightMouseButtonBehavior).to.equal('select-parent');
      expect(result.didMigration).to.equal(true);
      expect(result.settings).to.not.have.property('rmbSelectsParent');
    });

    it('converts rmbSelectsParent of false to close', () => {
      const result = loadGeneralSettings({ version: '3.0.1', rmbSelectsParent: false });
      expect(result.settings.rightMouseButtonBehavior).to.equal('close');
      expect(result.didMigration).to.equal(true);
      expect(result.settings).to.not.have.property('rmbSelectsParent');
    });

    // Development builds of Kando 3.1.0 still report version 3.0.1. Settings which they
    // saved must not lose the new properties when they are loaded again.
    it('keeps the new properties if they are already present', () => {
      const result = loadGeneralSettings({
        version: '3.0.1',
        rightMouseButtonBehavior: 'nothing',
        middleMouseButtonBehavior: 'close',
      });
      expect(result.settings.rightMouseButtonBehavior).to.equal('nothing');
      expect(result.settings.middleMouseButtonBehavior).to.equal('close');
    });

    it('lets the new property win over the old one', () => {
      const result = loadGeneralSettings({
        version: '3.0.1',
        rmbSelectsParent: true,
        rightMouseButtonBehavior: 'nothing',
      });
      expect(result.settings.rightMouseButtonBehavior).to.equal('nothing');
      expect(result.settings).to.not.have.property('rmbSelectsParent');
    });

    it('falls back to the default if a new property is invalid', () => {
      const result = loadGeneralSettings({
        version: '3.0.1',
        rightMouseButtonBehavior: 'invalid',
        middleMouseButtonBehavior: 42,
      });
      expect(result.settings.rightMouseButtonBehavior).to.equal('close');
      expect(result.settings.middleMouseButtonBehavior).to.equal('select');
    });
  });

  describe('version handling', () => {
    it('converts rmbSelectsParent for files written by Kando 3.0.0', () => {
      const result = loadGeneralSettings({ version: '3.0.0', rmbSelectsParent: true });
      expect(result.settings.rightMouseButtonBehavior).to.equal('select-parent');
      expect(result.settings).to.not.have.property('rmbSelectsParent');
    });

    // Files from 3.1.0 use the V2 schema, so a stale rmbSelectsParent must be ignored and
    // not be converted.
    it('does not convert a stale rmbSelectsParent in a 3.1.0 file', () => {
      const result = loadGeneralSettings({ version: '3.1.0', rmbSelectsParent: true });
      expect(result.settings.rightMouseButtonBehavior).to.equal('close');
      expect(result.settings).to.not.have.property('rmbSelectsParent');
    });

    it('does not throw for a malformed version string', () => {
      const result = loadGeneralSettings({ version: 'garbage' });
      expect(result.settings.rightMouseButtonBehavior).to.equal('close');
      expect(result.settings.middleMouseButtonBehavior).to.equal('select');
      expect(result.didMigration).to.equal(true);
    });

    it('does not mutate the given content', () => {
      const content = {
        version: '3.0.1',
        rmbSelectsParent: true,
        middleMouseButtonBehavior: 'close',
      };
      const copy = JSON.parse(JSON.stringify(content));
      loadGeneralSettings(content);
      expect(content).to.deep.equal(copy);
    });
  });

  describe('settings files written by Kando 3.1.0', () => {
    it('parses the new properties directly', () => {
      const result = loadGeneralSettings({
        version: '3.1.0',
        rightMouseButtonBehavior: 'select',
        middleMouseButtonBehavior: 'select-parent',
      });
      expect(result.settings.rightMouseButtonBehavior).to.equal('select');
      expect(result.settings.middleMouseButtonBehavior).to.equal('select-parent');
    });
  });

  describe('defaults', () => {
    it('closes the menu on right click and selects on middle click', () => {
      const result = loadGeneralSettings({ version: '3.1.0' });
      expect(result.settings.rightMouseButtonBehavior).to.equal('close');
      expect(result.settings.middleMouseButtonBehavior).to.equal('select');
    });
  });
});
