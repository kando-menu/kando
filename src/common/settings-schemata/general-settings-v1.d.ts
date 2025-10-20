import * as z from 'zod';
/**
 * Starting with Kando 2.1.0, we use zod to define the schema of the general settings.
 * This allows us to better validate the settings file.
 */
export declare const GENERAL_SETTINGS_SCHEMA_V1: z.ZodObject<{
    /**
     * The last version of Kando. This is used to determine whether the settings file needs
     * to be backed up and potentially migrated to a newer version.
     */
    version: z.ZodDefault<z.ZodString>;
    /**
     * The locale to use. If set to 'auto', the system's locale will be used. If the locale
     * is not available, english will be used.
     */
    locale: z.ZodDefault<z.ZodString>;
    /** If true, the introduction dialog will be shown when the settings window is opened. */
    showIntroductionDialog: z.ZodDefault<z.ZodBoolean>;
    /** The name of the theme to use for the menu. */
    menuTheme: z.ZodDefault<z.ZodString>;
    /** The name of the theme which should be used for the dark mode. */
    darkMenuTheme: z.ZodDefault<z.ZodString>;
    /**
     * The accent color overrides to use for menu themes. The outer key is the theme's ID,
     * the inner key is the color's name. The final value is the CSS color.
     */
    menuThemeColors: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>>;
    /**
     * The accent color overrides to use for the dark mode. The outer key is the theme's ID,
     * the inner key is the color's name. The final value is the CSS color.
     */
    darkMenuThemeColors: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>>;
    /**
     * If enabled, the dark menu theme and dark color variants will be used if the system is
     * in dark mode.
     */
    enableDarkModeForMenuThemes: z.ZodDefault<z.ZodBoolean>;
    /** The name of the current sound theme. */
    soundTheme: z.ZodDefault<z.ZodString>;
    /** The overall volume of the sound effects. */
    soundVolume: z.ZodDefault<z.ZodNumber>;
    /** Set this to false to disable the check for new versions. */
    enableVersionCheck: z.ZodDefault<z.ZodBoolean>;
    /** Whether to silently handle read-only config files. */
    ignoreWriteProtectedConfigFiles: z.ZodDefault<z.ZodBoolean>;
    /** The color scheme of the settings window. */
    settingsWindowColorScheme: z.ZodDefault<z.ZodEnum<["light", "dark", "system"]>>;
    /**
     * If set to a transparent style, the settings window will attempt to use some sort of
     * transparency. What that means exactly depends on the OS.
     */
    settingsWindowFlavor: z.ZodDefault<z.ZodEnum<["auto", "sakura-light", "sakura-dark", "sakura-system", "transparent-light", "transparent-dark", "transparent-system"]>>;
    /** The tray icon flavor. */
    trayIconFlavor: z.ZodDefault<z.ZodEnum<["light", "dark", "color", "black", "white", "none"]>>;
    /** Enable GPU acceleration. */
    hardwareAcceleration: z.ZodDefault<z.ZodBoolean>;
    /** Whether to initialize the menu window when it is opened for the first time. */
    lazyInitialization: z.ZodDefault<z.ZodBoolean>;
    /** A scale factor for the menu. */
    zoomFactor: z.ZodDefault<z.ZodNumber>;
    /** If true, the settings button will be hidden if not hovered. */
    hideSettingsButton: z.ZodDefault<z.ZodBoolean>;
    /** The position of the settings button. */
    settingsButtonPosition: z.ZodDefault<z.ZodEnum<["top-left", "top-right", "bottom-left", "bottom-right"]>>;
    /** Clicking inside this radius will select the parent element. */
    centerDeadZone: z.ZodDefault<z.ZodNumber>;
    /**
     * The distance in pixels at which the parent menu item is placed if a submenu is
     * selected close to the parent.
     */
    minParentDistance: z.ZodDefault<z.ZodNumber>;
    /**
     * This is the threshold in pixels which is used to differentiate between a click and a
     * drag. If the mouse is moved more than this threshold before the mouse button is
     * released, an item is dragged.
     */
    dragThreshold: z.ZodDefault<z.ZodNumber>;
    /** The time in milliseconds it takes to fade in the menu. */
    fadeInDuration: z.ZodDefault<z.ZodNumber>;
    /** The time in milliseconds it takes to fade out the menu. */
    fadeOutDuration: z.ZodDefault<z.ZodNumber>;
    /**
     * If enabled, the menu will not take the input focus when opened. This will disable
     * turbo mode.
     */
    keepInputFocus: z.ZodDefault<z.ZodBoolean>;
    /** If enabled, items can be selected by dragging the mouse over them. */
    enableMarkingMode: z.ZodDefault<z.ZodBoolean>;
    /**
     * If enabled, items can be selected by hovering over them while holding down a keyboard
     * key.
     */
    enableTurboMode: z.ZodDefault<z.ZodBoolean>;
    /** If true, the mouse pointer will be warped to the center of the menu when necessary. */
    warpMouse: z.ZodDefault<z.ZodBoolean>;
    /** If enabled, menus using the hover mode require a final click for selecting items. */
    hoverModeNeedsConfirmation: z.ZodDefault<z.ZodBoolean>;
    /** Shorter gestures will not lead to selections. */
    gestureMinStrokeLength: z.ZodDefault<z.ZodNumber>;
    /** Smaller turns will not lead to selections. */
    gestureMinStrokeAngle: z.ZodDefault<z.ZodNumber>;
    /** Smaller movements will not be considered. */
    gestureJitterThreshold: z.ZodDefault<z.ZodNumber>;
    /**
     * If the pointer is stationary for this many milliseconds, the current item will be
     * selected.
     */
    gesturePauseTimeout: z.ZodDefault<z.ZodNumber>;
    /**
     * If set to a value greater than 0, items will be instantly selected if the mouse
     * travelled more than centerDeadZone + fixedStrokeLength pixels in marking or turbo
     * mode. Any other gesture detection based on angles or motion speed will be disabled in
     * this case.
     */
    fixedStrokeLength: z.ZodDefault<z.ZodNumber>;
    /**
     * If enabled, the parent of a selected item will be selected on a right mouse button
     * click. Else the menu will be closed directly.
     */
    rmbSelectsParent: z.ZodDefault<z.ZodBoolean>;
    /**
     * If disabled, gamepad input will be ignored. This can be useful if the gamepad is not
     * connected or if the user prefers to use the mouse.
     */
    enableGamepad: z.ZodDefault<z.ZodBoolean>;
    /**
     * This button will select the parent item when using a gamepad. Set to -1 to disable.
     * See https://w3c.github.io/gamepad/#remapping for the mapping of numbers to buttons.
     */
    gamepadBackButton: z.ZodDefault<z.ZodNumber>;
    /**
     * This button will close the menu when using a gamepad. Set to -1 to disable. See
     * https://w3c.github.io/gamepad/#remapping for the mapping of numbers to buttons.
     */
    gamepadCloseButton: z.ZodDefault<z.ZodNumber>;
    /** Determines the behavior of pressing the trigger shortcut once the menu is open. */
    sameShortcutBehavior: z.ZodDefault<z.ZodEnum<["cycle-from-first", "cycle-from-recent", "close", "nothing"]>>;
    /**
     * If enabled, pressing 'cmd + ,' on macOS or 'ctrl + ,' on Linux or Windows will open
     * the settings window. If disabled, the default hotkey will be ignored.
     */
    useDefaultOsShowSettingsHotkey: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    version: string;
    locale: string;
    showIntroductionDialog: boolean;
    menuTheme: string;
    darkMenuTheme: string;
    menuThemeColors: Record<string, Record<string, string>>;
    darkMenuThemeColors: Record<string, Record<string, string>>;
    enableDarkModeForMenuThemes: boolean;
    soundTheme: string;
    soundVolume: number;
    enableVersionCheck: boolean;
    ignoreWriteProtectedConfigFiles: boolean;
    settingsWindowColorScheme: "light" | "dark" | "system";
    settingsWindowFlavor: "auto" | "sakura-light" | "sakura-dark" | "sakura-system" | "transparent-light" | "transparent-dark" | "transparent-system";
    trayIconFlavor: "none" | "light" | "dark" | "color" | "black" | "white";
    hardwareAcceleration: boolean;
    lazyInitialization: boolean;
    zoomFactor: number;
    hideSettingsButton: boolean;
    settingsButtonPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    centerDeadZone: number;
    minParentDistance: number;
    dragThreshold: number;
    fadeInDuration: number;
    fadeOutDuration: number;
    keepInputFocus: boolean;
    enableMarkingMode: boolean;
    enableTurboMode: boolean;
    warpMouse: boolean;
    hoverModeNeedsConfirmation: boolean;
    gestureMinStrokeLength: number;
    gestureMinStrokeAngle: number;
    gestureJitterThreshold: number;
    gesturePauseTimeout: number;
    fixedStrokeLength: number;
    rmbSelectsParent: boolean;
    enableGamepad: boolean;
    gamepadBackButton: number;
    gamepadCloseButton: number;
    sameShortcutBehavior: "cycle-from-first" | "cycle-from-recent" | "close" | "nothing";
    useDefaultOsShowSettingsHotkey: boolean;
}, {
    version?: string | undefined;
    locale?: string | undefined;
    showIntroductionDialog?: boolean | undefined;
    menuTheme?: string | undefined;
    darkMenuTheme?: string | undefined;
    menuThemeColors?: Record<string, Record<string, string>> | undefined;
    darkMenuThemeColors?: Record<string, Record<string, string>> | undefined;
    enableDarkModeForMenuThemes?: boolean | undefined;
    soundTheme?: string | undefined;
    soundVolume?: number | undefined;
    enableVersionCheck?: boolean | undefined;
    ignoreWriteProtectedConfigFiles?: boolean | undefined;
    settingsWindowColorScheme?: "light" | "dark" | "system" | undefined;
    settingsWindowFlavor?: "auto" | "sakura-light" | "sakura-dark" | "sakura-system" | "transparent-light" | "transparent-dark" | "transparent-system" | undefined;
    trayIconFlavor?: "none" | "light" | "dark" | "color" | "black" | "white" | undefined;
    hardwareAcceleration?: boolean | undefined;
    lazyInitialization?: boolean | undefined;
    zoomFactor?: number | undefined;
    hideSettingsButton?: boolean | undefined;
    settingsButtonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | undefined;
    centerDeadZone?: number | undefined;
    minParentDistance?: number | undefined;
    dragThreshold?: number | undefined;
    fadeInDuration?: number | undefined;
    fadeOutDuration?: number | undefined;
    keepInputFocus?: boolean | undefined;
    enableMarkingMode?: boolean | undefined;
    enableTurboMode?: boolean | undefined;
    warpMouse?: boolean | undefined;
    hoverModeNeedsConfirmation?: boolean | undefined;
    gestureMinStrokeLength?: number | undefined;
    gestureMinStrokeAngle?: number | undefined;
    gestureJitterThreshold?: number | undefined;
    gesturePauseTimeout?: number | undefined;
    fixedStrokeLength?: number | undefined;
    rmbSelectsParent?: boolean | undefined;
    enableGamepad?: boolean | undefined;
    gamepadBackButton?: number | undefined;
    gamepadCloseButton?: number | undefined;
    sameShortcutBehavior?: "cycle-from-first" | "cycle-from-recent" | "close" | "nothing" | undefined;
    useDefaultOsShowSettingsHotkey?: boolean | undefined;
}>;
export type GeneralSettingsV1 = z.infer<typeof GENERAL_SETTINGS_SCHEMA_V1>;
