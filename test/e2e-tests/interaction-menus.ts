// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { MenuV2 } from '../../src/common/settings-schemata';
import {
  KandoApp,
  TEST_COMMAND,
  TEST_FILE_ICON_THEME,
  TEST_TCP_PORT,
  TEST_WEBSOCKET_URL,
} from './fixtures';

export const menus: MenuV2[] = [
  {
    root: {
      type: 'root',
      name: 'E2E Menu',
      icon: 'home',
      iconTheme: 'material-symbols-rounded',
      activateWorkflow: { actions: [{ type: 'close-menu' }] },
      scrollUpWorkflow: {
        actions: [
          {
            type: 'send-tcp-message',
            host: '127.0.0.1',
            port: TEST_TCP_PORT,
            message: 'root scroll up',
          },
        ],
      },
      children: [
        {
          type: 'submenu',
          name: 'Submenu',
          icon: 'folder',
          iconTheme: 'material-symbols-rounded',
          angle: 0,
          openWorkflow: { quickSelectKey: 'S', actions: [] },
          activateWorkflow: {
            quickSelectKey: 'Backspace',
            actions: [{ type: 'close-submenu' }],
          },
          children: [
            {
              type: 'button',
              name: 'Nested action',
              icon: 'check',
              iconTheme: 'material-symbols-rounded',
              selectWorkflow: {
                quickSelectKey: 'N',
                actions: [{ type: 'close-menu' }],
              },
            },
          ],
        },
        {
          type: 'button',
          name: 'TCP action',
          icon: 'send',
          iconTheme: 'material-symbols-rounded',
          angle: 90,
          selectWorkflow: {
            quickSelectKey: 'T',
            actions: [
              {
                type: 'send-tcp-message',
                host: '127.0.0.1',
                port: TEST_TCP_PORT,
                message: 'tcp hit',
              },
            ],
          },
        },
        {
          type: 'button',
          name: 'WebSocket action',
          icon: 'send',
          iconTheme: 'material-symbols-rounded',
          angle: 180,
          selectWorkflow: {
            quickSelectKey: 'W',
            actions: [
              {
                type: 'send-websocket-message',
                url: TEST_WEBSOCKET_URL,
                message: 'websocket hit',
              },
              { type: 'close-menu' },
            ],
          },
        },
        {
          type: 'button',
          name: 'Command action',
          icon: 'terminal',
          iconTheme: 'material-symbols-rounded',
          angle: 270,
          selectWorkflow: {
            quickSelectKey: 'C',
            actions: [
              { type: 'execute-command', command: TEST_COMMAND },
              { type: 'close-menu' },
            ],
          },
        },
        {
          type: 'button',
          name: 'Number action',
          icon: 'home',
          iconTheme: 'material-symbols-rounded',
          angle: 315,
          selectWorkflow: {
            actions: [
              {
                type: 'send-tcp-message',
                host: '127.0.0.1',
                port: TEST_TCP_PORT,
                message: 'number hit',
              },
              { type: 'close-menu' },
            ],
          },
        },
      ],
    },
  },
  {
    root: {
      type: 'root',
      name: 'Icon Menu',
      icon: 'home',
      iconTheme: 'material-symbols-rounded',
      children: [
        {
          type: 'button',
          name: 'Emoji icon',
          icon: '🌈',
          iconTheme: 'emoji',
          angle: 0,
        },
        {
          type: 'button',
          name: 'Material icon',
          icon: 'settings',
          iconTheme: 'material-symbols-rounded',
          angle: 72,
        },
        {
          type: 'button',
          name: 'Simple icon',
          icon: 'github',
          iconTheme: 'simple-icons',
          angle: 144,
        },
        {
          type: 'button',
          name: 'File icon',
          icon: 'test-icon.svg',
          iconTheme: TEST_FILE_ICON_THEME,
          angle: 216,
        },
        {
          type: 'button',
          name: 'Base64 icon',
          icon: '',
          iconTheme: 'base64',
          angle: 288,
        },
      ],
    },
  },
];

export const BASE64_ICON = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>'
).toString('base64')}`;

menus[1].root.children[4].icon = BASE64_ICON;

menus.push(
  {
    ...menus[0],
    root: { ...menus[0].root, name: 'Edge Menu' },
    useFixedPosition: true,
    fixedMenuPosition: { x: 0, y: 0 },
  },
  {
    ...menus[0],
    root: { ...menus[0].root, name: 'Centered Menu' },
    useFixedPosition: true,
    fixedMenuPosition: { x: 0.5, y: 0.5 },
  },
  {
    ...menus[0],
    root: { ...menus[0].root, name: 'Anchored Menu' },
    anchored: true,
  },
  {
    root: {
      ...menus[0].root,
      name: 'Many Items',
      children: Array.from({ length: 20 }, (_, index) => ({
        type: 'button' as const,
        name: `Item ${index + 1}`,
        icon: 'star',
        iconTheme: 'material-symbols-rounded',
      })),
    },
  }
);

export const interactionSeed = {
  menus,
  config: {
    showIntroductionDialog: false,
    enableMenuAnimations: false,
    fadeInDuration: 0,
    fadeOutDuration: 0,
    maxSelectionRadius: 400,
    hideOnFocusOut: false,
  },
};

menus.push({
  ...menus[0],
  root: { ...menus[0].root, name: 'Hover Menu' },
  hoverMode: true,
});

// Fixed-position menus defer turbo mode until a key has been released.
export const releaseDeferredTurboMode = (kando: KandoApp) =>
  kando.menuWindow.keyboard.press('Shift');
