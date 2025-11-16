import { z } from 'zod';
import { GENERAL_SETTINGS_SCHEMA_V1 } from '@kando/schemata/general-settings-v1';
import { MENU_SETTINGS_SCHEMA_V1 } from '@kando/schemata/menu-settings-v1';
import type { GeneralSettingsV1 } from '@kando/schemata/general-settings-v1';
import type { MenuSettingsV1 } from '@kando/schemata/menu-settings-v1';

export { GENERAL_SETTINGS_SCHEMA_V1, MENU_SETTINGS_SCHEMA_V1 };

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: z.ZodIssue[] };

export function parseConfig(input: unknown): ValidationResult<GeneralSettingsV1> {
  const res = GENERAL_SETTINGS_SCHEMA_V1.safeParse(input);
  return res.success ? { ok: true, data: res.data } : { ok: false, errors: res.error.issues };
}

export function parseMenus(input: unknown): ValidationResult<MenuSettingsV1> {
  const res = MENU_SETTINGS_SCHEMA_V1.safeParse(input);
  return res.success ? { ok: true, data: res.data } : { ok: false, errors: res.error.issues };
}
