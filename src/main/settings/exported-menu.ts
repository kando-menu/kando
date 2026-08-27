//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import semver from 'semver';

import { EXPORTED_MENU_SCHEMA_V1 } from '../../common/settings-schemata/exported-menu-v1';
import { EXPORTED_MENU_SCHEMA_V2 } from '../../common/settings-schemata/exported-menu-v2';
import { MENU_SCHEMA_V2, MenuV2 } from '../../common/settings-schemata/menu-settings-v2';
import { migrateMenuRootV1ToV2 } from './menu-settings';

/**
 * Loads the contents of an exported-menu file (as produced by the "export menu" feature
 * of the settings dialog) and returns a `MenuV2` object ready to be added to the menu
 * settings. If the content conforms to the pre-3.0 (v1) exported-menu format, it is
 * migrated to the current workflow-based format first.
 *
 * @param content The content of the exported-menu file as an object.
 * @returns The validated (and, if necessary, migrated) menu.
 */
export function loadExportedMenu(content: object): MenuV2 {
  // Only exported-menu files from Kando 3.0.0-alpha.0 onwards use the current
  // workflow-based menu-item format. Any other (or missing/unparsable) version is assumed
  // to use the old, pre-workflow format.
  const contentVersion =
    'version' in content && typeof content.version === 'string' ? content.version : '';
  const parsedVersion = semver.coerce(contentVersion);

  if (!parsedVersion || semver.lt(parsedVersion, '3.0.0-alpha.0')) {
    const exported = EXPORTED_MENU_SCHEMA_V1.parse(content, { reportInput: true });
    const root = migrateMenuRootV1ToV2(exported.menu);
    return MENU_SCHEMA_V2.parse({ root }, { reportInput: true });
  }

  const exported = EXPORTED_MENU_SCHEMA_V2.parse(content, { reportInput: true });
  return MENU_SCHEMA_V2.parse({ root: exported.menu }, { reportInput: true });
}
