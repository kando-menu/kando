import type { RequestHandler } from '@sveltejs/kit';
import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';
import JSON5 from 'json5';

async function listMenuThemes(): Promise<Array<{ id: string; name?: string }>> {
  const base = path.resolve('static/kando/menu-themes');
  let entries: any[] = [];
  try { entries = await readdir(base, { withFileTypes: true }); } catch {}
  const themes: Array<{ id: string; name?: string }> = [];
  for (const ent of entries) {
    if (!(ent.isDirectory() || ent.isSymbolicLink())) continue;
    const id = ent.name;
    const file = path.join(base, id, 'theme.json5');
    try {
      const st = await stat(file); if (!st.isFile()) continue;
      const txt = await readFile(file, 'utf8');
      const parsed: any = JSON5.parse(txt);
      themes.push({ id, name: parsed?.name });
    } catch {}
  }
  // inject vendor default at head
  try {
    const vendorPath = path.resolve('src/lib/vendor/default-theme.json5');
    const txt = await readFile(vendorPath, 'utf8');
    const parsed: any = JSON5.parse(txt);
    if (!themes.find((t) => t.id === 'default')) {
      themes.unshift({ id: 'default', name: parsed?.name ?? 'Default' });
    }
  } catch {
    if (!themes.find((t) => t.id === 'default')) themes.unshift({ id: 'default', name: 'Default' });
  }
  return themes;
}

async function listSoundThemes(): Promise<Array<{ id: string; name?: string }>> {
  const base = path.resolve('static/kando/sound-themes');
  let entries: any[] = [];
  try { entries = await readdir(base, { withFileTypes: true }); } catch {}
  const sounds: Array<{ id: string; name?: string }> = [];
  for (const ent of entries) {
    if (!(ent.isDirectory() || ent.isSymbolicLink())) continue;
    const id = ent.name;
    const fileJson5 = path.join(base, id, 'theme.json5');
    const fileJson = path.join(base, id, 'theme.json');
    let name: string | undefined;
    try { const txt = await readFile(fileJson5, 'utf8'); const parsed: any = JSON5.parse(txt); name = parsed?.name; }
    catch {
      try { const txt = await readFile(fileJson, 'utf8'); const parsed: any = JSON.parse(txt); name = parsed?.name; } catch {}
    }
    sounds.push({ id, name });
  }
  // vendor none
  try {
    const txt = await readFile(path.resolve('src/lib/vendor/sounds/none/theme.json'), 'utf8');
    const parsed: any = JSON.parse(txt);
    sounds.unshift({ id: 'none', name: parsed?.name ?? 'None' });
  } catch {
    sounds.unshift({ id: 'none', name: 'None' });
  }
  return sounds;
}

async function listIconThemes(): Promise<Array<{ id: string; name?: string }>> {
  const icons: Array<{ id: string; name?: string }> = [] as any;
  // Known built-ins
  icons.push({ id: 'material-symbols-rounded', name: 'Material Symbols Rounded' });
  icons.push({ id: 'simple-icons', name: 'Simple Icons' });
  // Discover local static icon sets (e.g., kando)
  const base = path.resolve('static/kando/icon-themes');
  let entries: any[] = [];
  try { entries = await readdir(base, { withFileTypes: true }); } catch {}
  for (const ent of entries) {
    if (!(ent.isDirectory() || ent.isSymbolicLink())) continue;
    const id = ent.name;
    if (!icons.find((t) => t.id === id)) icons.push({ id, name: id });
  }
  return icons;
}

export const GET: RequestHandler = async () => {
  try {
    const [menu, sound, icon] = await Promise.all([
      listMenuThemes(),
      listSoundThemes(),
      listIconThemes(),
    ]);
    return new Response(JSON.stringify({ themes: { menu, sound, icon } }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ themes: { menu: [], sound: [], icon: [] }, error: (e as Error).message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};


