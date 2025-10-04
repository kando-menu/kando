import * as z from 'zod';
/**
 * Starting with Kando 2.1.0, we use zod to define the schema of the general settings.
 * This allows us to better validate the settings file.
 */
export declare const GENERAL_SETTINGS_SCHEMA_V1: any;
export type GeneralSettingsV1 = z.infer<typeof GENERAL_SETTINGS_SCHEMA_V1>;
