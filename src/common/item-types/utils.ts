//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * This function renders a template with a given context and returns the result as a
 * DocumentFragment.
 *
 * @param template - The template to render.
 * @param context - The context to render the template with.
 * @returns The rendered template as a DocumentFragment.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderTemplate(template: any, context: any): DocumentFragment {
  return document.createRange().createContextualFragment(template(context));
}
