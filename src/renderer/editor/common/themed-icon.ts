//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * This method creates a div which contains an icon. The icon is created using the
 * 'material-symbols-rounded' or 'simple-icons' font.
 *
 * @param icon The name of the icon to create.
 * @param theme The name of the icon theme to use.
 * @returns A HTML element which contains the icon.
 */
export function createDiv(icon: string, theme: string) {
  const containerDiv = document.createElement('div');
  containerDiv.classList.add('icon-container');

  const iconDiv = document.createElement('i');
  containerDiv.appendChild(iconDiv);

  if (theme === 'material-symbols-rounded') {
    iconDiv.classList.add('material-symbols-rounded');
    iconDiv.innerHTML = icon;
  } else if (theme === 'emoji') {
    iconDiv.classList.add('emoji-icon');
    iconDiv.innerHTML = icon;
  } else if (theme === 'simple-icons') {
    iconDiv.classList.add('si');
    iconDiv.classList.add('si-' + icon);
  } else if (theme === 'simple-icons-colored') {
    iconDiv.classList.add('si');
    iconDiv.classList.add('si--color');
    iconDiv.classList.add('si-' + icon);
  }

  return containerDiv;
}
