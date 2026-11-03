// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect, test } from './fixtures';
import { simpleSeed } from './simple-menus';

test.use({ seed: simpleSeed });

test('the update-check endpoint is stubbed for offline tests', async ({ kando }) => {
  await kando.stubUpdateCheckRequest();

  expect(await kando.requestUpdateCheckEndpoint()).toBe(200);
  expect(await kando.readUpdateCheckRequests()).toEqual([
    'https://api.github.com/repos/kando-menu/kando/releases',
  ]);
  expect(kando.errors).toEqual([]);
});
