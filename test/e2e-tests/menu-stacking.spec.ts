// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { MenuV2 } from '../../src/common/settings-schemata';
import { expect, test } from './fixtures';

// Regression tests for the stacking order and fading of the menu branches on the current
// selection path (#758). The menu is three levels deep so that after selecting both
// submenus, the root and the first submenu are "parents" and the second submenu is the
// active node. Both levels also have a sibling which is not part of the selection path.
const stackingMenu: MenuV2 = {
  root: {
    type: 'root',
    name: 'Stacking Menu',
    icon: 'home',
    iconTheme: 'material-symbols-rounded',
    children: [
      {
        type: 'submenu',
        name: 'Outer Submenu',
        icon: 'folder',
        iconTheme: 'material-symbols-rounded',
        angle: 0,
        children: [
          {
            type: 'submenu',
            name: 'Inner Submenu',
            icon: 'folder',
            iconTheme: 'material-symbols-rounded',
            angle: 0,
            children: [
              {
                type: 'button',
                name: 'Leaf',
                icon: 'check',
                iconTheme: 'material-symbols-rounded',
                selectWorkflow: { actions: [] },
              },
            ],
          },
          {
            type: 'button',
            name: 'Outer Sibling',
            icon: 'check',
            iconTheme: 'material-symbols-rounded',
            angle: 180,
            selectWorkflow: { actions: [] },
          },
        ],
      },
      {
        type: 'button',
        name: 'Root Sibling',
        icon: 'check',
        iconTheme: 'material-symbols-rounded',
        angle: 180,
        selectWorkflow: { actions: [] },
      },
    ],
  },
};

test.use({
  seed: {
    menus: [stackingMenu],
    config: {
      showIntroductionDialog: false,
      enableMenuAnimations: false,
    },
  },
});

/** Reads one computed style property from all elements matching the locator. */
async function computedStyles(
  locator: import('@playwright/test').Locator,
  property: string
) {
  return locator.evaluateAll(
    (nodes, prop) =>
      nodes.map((node) => window.getComputedStyle(node).getPropertyValue(prop)),
    property
  );
}

test('nodes on the selection path are stacked above their older siblings', async ({
  kando,
}) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('Stacking Menu');
  await kando.selectItem([0]);
  await kando.selectItem([0, 0]);

  // The path is root > outer submenu > inner submenu (active).
  await expect(menu.locator('.menu-node.parent')).toHaveCount(2);
  await expect(menu.locator('.menu-node.active')).toHaveCount(1);

  // Every node of the path below the root needs its own elevated z-index, as each
  // transformed node creates its own stacking context.
  await expect
    .poll(() =>
      computedStyles(menu.locator('.menu-node.parent > .menu-node.parent'), 'z-index')
    )
    .toEqual(['100']);
  await expect
    .poll(() =>
      computedStyles(menu.locator('.menu-node.parent > .menu-node.active'), 'z-index')
    )
    .toEqual(['100']);

  // Siblings which are not part of the path must not be elevated.
  const siblingZIndices = await computedStyles(
    menu.locator('.menu-node.parent > .menu-node.grandchild'),
    'z-index'
  );
  expect(siblingZIndices).toHaveLength(2);
  expect(siblingZIndices).not.toContain('100');
  expect(kando.errors).toEqual([]);
});

test('older branches are faded without fading the active path', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('Stacking Menu');
  await kando.selectItem([0]);
  await kando.selectItem([0, 0]);
  await expect(menu.locator('.menu-node.parent')).toHaveCount(2);

  const visuals = (selector: string) => menu.locator(`${selector} > .icon-layer`);

  // The visuals of the parents and of their off-path siblings are faded.
  await expect
    .poll(() => computedStyles(visuals('.menu-node.parent'), 'opacity'))
    .toEqual(['0.4', '0.4']);
  await expect
    .poll(() =>
      computedStyles(visuals('.menu-node.parent > .menu-node.grandchild'), 'opacity')
    )
    .toEqual(['0.4', '0.4']);

  // The active node and its children stay fully opaque.
  await expect
    .poll(() => computedStyles(visuals('.menu-node.active'), 'opacity'))
    .toEqual(['1']);
  await expect
    .poll(() =>
      computedStyles(visuals('.menu-node.active > .menu-node.child'), 'opacity')
    )
    .toEqual(['1']);

  // Opacity is applied to the visuals only. Fading the nodes themselves would also fade
  // the nested nodes of the active path.
  expect(
    await computedStyles(menu.locator('.menu-node.parent, .menu-node.active'), 'opacity')
  ).toEqual(['1', '1', '1']);
  expect(kando.errors).toEqual([]);
});

test('going back to the root removes the fade and the elevation', async ({ kando }) => {
  const menu = kando.menuWindow.locator('#kando-menu');
  await kando.openMenu('Stacking Menu');
  await kando.selectItem([0]);
  await expect(menu.locator('.menu-node.parent')).toHaveCount(1);
  await expect
    .poll(() =>
      computedStyles(menu.locator('.menu-node.parent > .icon-layer'), 'opacity')
    )
    .toEqual(['0.4']);

  // Selecting the parent again returns to the root, which then has no parents.
  await kando.selectItem([]);
  await expect(menu.locator('.menu-node.parent')).toHaveCount(0);
  await expect
    .poll(() =>
      computedStyles(menu.locator('.menu-node.active > .icon-layer'), 'opacity')
    )
    .toEqual(['1']);
  expect(kando.errors).toEqual([]);
});
