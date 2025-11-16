import type { RequestHandler } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const bases = [
  path.resolve(process.cwd(), 'node_modules', 'simple-icons-font', 'font'),
  path.resolve(process.cwd(), '..', 'node_modules', 'simple-icons-font', 'font')
].filter((p) => existsSync(p));

function contentType(p: string): string {
  if (p.endsWith('.woff2')) return 'font/woff2';
  if (p.endsWith('.woff')) return 'font/woff';
  if (p.endsWith('.ttf')) return 'font/ttf';
  if (p.endsWith('.otf')) return 'font/otf';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  return 'application/octet-stream';
}

export const GET: RequestHandler = async ({ params }) => {
  try {
    const reqPath = params.path ?? '';
    const safePath = path.normalize(reqPath).replace(/^\/+/, '');
    let abs: string | null = null;
    for (const b of bases) {
      const candidate = path.join(b, safePath);
      if (candidate.startsWith(b) && existsSync(candidate)) { abs = candidate; break; }
    }
    if (!abs) return new Response('Forbidden', { status: 403 });
    const data = await readFile(abs);
    const body = new Uint8Array(data);
    return new Response(body, { headers: { 'content-type': contentType(abs), 'cache-control': 'public, max-age=31536000, immutable' } });
  } catch (e) {
    return new Response('Not found', { status: 404 });
  }
};


