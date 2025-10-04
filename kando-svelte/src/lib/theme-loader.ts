import JSON5 from 'json5';
import type { MenuThemeDescription } from './types';

export async function fetchThemeJson(themeDirUrl: string, themeId: string): Promise<MenuThemeDescription> {
  const url = `${themeDirUrl.replace(/\/$/, '')}/${themeId}/theme.json5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load theme: ${url}`);
  const text = await res.text();
  const parsed = JSON5.parse(text);
  return {
    ...parsed,
    id: themeId,
    directory: themeDirUrl.replace(/\/$/, '')
  } as MenuThemeDescription;
}

export function injectThemeCss(theme: MenuThemeDescription): HTMLLinkElement {
  const href = `file://${theme.directory}/${theme.id}/theme.css`.replace('file:///', '/');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.id = `kando-theme-${theme.id}`;
  document.head.appendChild(link);
  return link;
}

export function applyThemeColors(colors: Record<string, string>) {
  Object.entries(colors).forEach(([name, value]) => {
    document.documentElement.style.setProperty(`--${name}`, value);
  });
}
