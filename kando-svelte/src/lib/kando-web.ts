import type { MenuThemeDescription } from '@kando/common';

/**
 * Inject a link element for a Kando theme.css using a web-safe URL base.
 * Expects description.directory to be an http(s) or relative path base.
 */
export function injectThemeCssLink(description: MenuThemeDescription) {
  const id = 'kando-menu-theme';
  const old = document.getElementById(id);
  if (old) old.remove();

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.id = id;
  link.href = `${description.directory}/${description.id}/theme.css`;
  document.head.appendChild(link);
}

/**
 * Build default ShowMenuOptions fields for web usage.
 */
export function defaultMenuOptions() {
  return {
    zoomFactor: 1,
    centeredMode: false,
    anchoredMode: false,
    hoverMode: false,
    systemIconsChanged: false
  } as const;
}


