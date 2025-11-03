// Ambient module declarations to satisfy TS in editor/lint when using kit.alias
declare module '@kando/common' {
  export {
    Vec2,
    ShowMenuOptions,
    MenuThemeDescription,
    SoundType,
    SoundThemeDescription,
  } from '../../src/common';
  // These are used as value-level types in wrapper props
  export type GeneralSettings = import('../../src/common/settings-schemata/menu-settings-v1').GeneralSettings;
  export type MenuItem = import('../../src/common').MenuItem;
}

declare module '@kando/schemata' {
  export * from '../../src/common/settings-schemata';
}

declare module '@kando/menu' {
  const Menu: any; export { Menu };
}

declare module '@kando/menu-theme' {
  const MenuTheme: any; export { MenuTheme };
}

declare module '@kando/gesture' { const v: any; export default v; }

declare module '@kando/gamepad' { const v: any; export default v; }

declare module '@kando/sound-theme' { const v: any; export default v; }

declare module '@kando/base-css';

