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
import { version } from '../../package.json';

describe('general settings migration of rmbSelectsParent', () => {
  // The different shapes a settings file can have. Each one places the old
  // rmbSelectsParent value (or nothing, if no value is given) at a different location.
  const paths: {
    name: string;
    build: (old?: boolean, extra?: object) => Record<string, unknown>;
  }[] = [
    {
      name: 'current version',
      build: (old, extra) => ({
        version,
        ...(old === undefined ? {} : { rmbSelectsParent: old }),
        ...extra,
      }),
    },
    {
      name: 'different version',
      build: (old, extra) => ({
        version: '0.0.1',
        ...(old === undefined ? {} : { rmbSelectsParent: old }),
        ...extra,
      }),
    },
    {
      name: 'no version, top-level key',
      build: (old, extra) => ({
        ...(old === undefined ? {} : { rmbSelectsParent: old }),
        ...extra,
      }),
    },
    {
      name: 'no version, menuOptions key',
      build: (old, extra) => ({
        menuOptions: old === undefined ? {} : { rmbSelectsParent: old },
        ...extra,
      }),
    },
  ];

  for (const { name, build } of paths) {
    describe(name, () => {
      it('migrates true to select-parent', () => {
        const result = loadGeneralSettings(build(true));
        expect(result.settings.rightMouseButtonBehavior).to.equal('select-parent');
        expect(result.didMigration).to.equal(true);
      });

      it('migrates false to close', () => {
        const result = loadGeneralSettings(build(false));
        expect(result.settings.rightMouseButtonBehavior).to.equal('close');
        expect(result.didMigration).to.equal(true);
      });

      it('lets an explicit new key win', () => {
        const content = build(true, { rightMouseButtonBehavior: 'nothing' });
        // The explicit key is only meaningful at the top level.
        const result = loadGeneralSettings(content);
        expect(result.settings.rightMouseButtonBehavior).to.equal('nothing');
      });

      it('uses the defaults if nothing is set', () => {
        const result = loadGeneralSettings(build());
        expect(result.settings.rightMouseButtonBehavior).to.equal('close');
        expect(result.settings.middleMouseButtonBehavior).to.equal('nothing');
      });

      it('does not keep the old key', () => {
        const result = loadGeneralSettings(build(true));
        expect(result.settings).to.not.have.property('rmbSelectsParent');
      });

      it('does not mutate the given content', () => {
        const content = build(true);
        const copy = JSON.parse(JSON.stringify(content));
        loadGeneralSettings(content);
        expect(content).to.deep.equal(copy);
      });
    });
  }

  it('does not report a migration for an up-to-date file', () => {
    const result = loadGeneralSettings({ version, rightMouseButtonBehavior: 'nothing' });
    expect(result.didMigration).to.equal(false);
  });
});
