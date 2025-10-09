import JSON5 from 'json5';
import type { MenuThemeDescription } from './types';

export async function fetchThemeJson(themeDirUrl: string, themeId: string): Promise<MenuThemeDescription> {
  const base = themeDirUrl.replace(/\/$/, '');
  const url = `${base}/${themeId}/theme.json5`;
  return fetchThemeJsonFromUrl(url, { id: themeId, directory: base });
}

export async function fetchThemeJsonFromUrl(url: string, overrides?: Partial<MenuThemeDescription>): Promise<MenuThemeDescription> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load theme: ${url}`);
  const text = await res.text();
  const parsed = JSON5.parse(text);
  return {
    ...parsed,
    ...overrides,
  } as MenuThemeDescription;
}

export function injectThemeCss(theme: MenuThemeDescription): HTMLLinkElement {
  const href = `${theme.directory.replace(/\/$/, '')}/${theme.id}/theme.css`;
  return injectThemeCssHref(href);
}

export function injectThemeCssHref(href: string): HTMLLinkElement {
  // Remove any previously injected theme link (single active theme)
  const old = document.getElementById('kando-theme-current');
  if (old) old.remove();
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.id = 'kando-theme-current';
  document.head.appendChild(link);
  return link;
}

export function unloadThemeCss() {
  const old = document.getElementById('kando-theme-current');
  if (old) old.remove();
}

export function applyThemeColors(colors: Record<string, string>) {
  Object.entries(colors).forEach(([name, value]) => {
    document.documentElement.style.setProperty(`--${name}`, value);
  });
}
