// Publish only site routes and their runtime dependencies, never the workspace.
import { readFileSync, existsSync, statSync, mkdirSync, mkdtempSync, copyFileSync, writeFileSync } from 'node:fs';
import { resolve, relative, dirname, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';

const root = process.cwd();
const entries = [
  'index.html', 'kodawari.html', 'works.html', 'v1top/index.html',
  'index-770-preview.html', 'index-material-preview.html', 'works-yellow-preview.html',
  'kodawari-editorial-preview.html', 'kodawari-redesign-preview.html',
  'index-art-preview.html', 'index-brand-preview.html', 'index-renewal-preview.html',
  'fv-preview-20260904.html', 'how-we-build-proof.html',
  'lots-preview.html', 'move-to-nara-preview.html',
];
const server = new Set(['api/instagram.js', 'lib/instagram.cjs']);
const files = new Set(), queue = [], missing = new Set();
const contentExtensions = /\.(?:html|css|js|mjs|cjs|json|svg)$/i;
function add(value, base = root) {
  if (!value || /^(?:[a-z]+:|\/\/|#|%23)/i.test(value)) return;
  // Optional QR placeholder is deliberately unused until LINE integration is configured.
  if (value === 'assets/contact/line_qr.png') return;
  const clean = decodeURI(value.replace(/&amp;/g, '&').split(/[?#]/)[0]);
  let full = resolve(clean.startsWith('/') ? root : base, clean.replace(/^\//, ''));
  if (base === resolve(root, 'v1top') && clean.startsWith('assets/')) full = resolve(root, clean);
  if (existsSync(full) && statSync(full).isDirectory()) full = resolve(full, 'index.html');
  const path = relative(root, full);
  if (/^assets\/(?:stock_src|[^/]*_backup|fv_candidates)\//.test(path) || /(?:-source|-check)\.(?:png|jpe?g)$/.test(path)) throw Error(`Source artwork must not be published: ${path}`);
  if (path.startsWith('..') || path.split('/').some(p => p.startsWith('.'))) throw Error('Unsafe runtime path');
  if (!existsSync(full)) { missing.add(path); return; }
  if (!/^(?:assets\/|data\/|api\/|lib\/|v1top\/index\.html$|[^/]+\.html$)/.test(path)) throw Error(`Unexpected runtime path: ${path}`);
  if (!files.has(path)) { files.add(path); queue.push(path); }
}
entries.forEach(p => add(p));
server.forEach(p => add(p));
while (queue.length) {
  const path = queue.shift();
  if (!contentExtensions.test(path)) continue;
  const source = readFileSync(resolve(root, path), 'utf8');
  const base = /<base\s+href=["']\/?\.\.\//i.test(source) ? root : dirname(resolve(root, path));
  if (extname(path) === '.html') {
    for (const match of source.matchAll(/(?:\bsrc|\bhref|\bposter|\bdata-src)=["']([^"']+)["']/gi)) add(match[1], base);
    for (const match of source.matchAll(/(?:srcset|data-srcset)=["']([^"']+)["']/gi))
      for (const item of match[1].split(',')) add(item.trim().split(/\s+/)[0], base);
  }
  // Includes JSON image records and inline scripts/styles as well as ordinary imports.
  for (const match of source.matchAll(/["'(\s]((?:assets|data)\/[A-Za-z0-9_./%,-]+\.(?:webp|avif|jpe?g|png|svg|gif|mp4|webm|mp3|css|json|mjs|js|woff2?))/g)) add(match[1]);
  for (const match of source.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/g)) add(match[1], base);
  if (/\.(?:js|mjs|cjs)$/.test(path)) {
    for (const match of source.matchAll(/(?:from\s*|import\s*|require\(\s*)["'](\.{1,2}\/[^"']+)["']/g)) add(match[1], base);
  }
}
// Some historic markup contains non-file fragment placeholders. Report rather than guess.
if (missing.size) throw Error(`Missing runtime dependencies: ${[...missing].sort().join(', ')}`);
const stage = mkdtempSync(resolve(tmpdir(), 'yamato-checkpoint-'));
const manifest = [];
for (const path of [...files].sort()) {
  const full = resolve(root, path), data = readFileSync(full);
  if (contentExtensions.test(path) && /(?:IGAA[A-Za-z0-9]{45,}|EA[A-Za-z0-9]{100,}|(?:sk|ghp|github_pat|vercel)_[-A-Za-z0-9]{25,}|Bearer\s+[A-Za-z0-9_-]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(data.toString()))
    throw Error(`Secret-pattern gate failed: ${path}`);
  const destination = server.has(path) ? path : `public/${path}`;
  mkdirSync(dirname(resolve(stage, destination)), { recursive: true });
  copyFileSync(full, resolve(stage, destination));
  manifest.push({ path, destination, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
}
const configuration = {
  version: 2, framework: null, buildCommand: null, outputDirectory: 'public',
  functions: { 'api/instagram.js': { maxDuration: 30 } },
  rewrites: [{ source: '/v1top/assets/:path*', destination: '/assets/:path*' }],
  headers: [{ source: '/(.*)', headers: [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
  ] }],
};
writeFileSync(resolve(stage, 'vercel.json'), JSON.stringify(configuration, null, 2));
writeFileSync(resolve(stage, 'package.json'), JSON.stringify({ name: 'yamato-checkpoint', private: true, engines: { node: '24.x' } }, null, 2));
writeFileSync(resolve(stage, 'public/robots.txt'), 'User-agent: *\nDisallow: /\n');
const record = { stage, entries, files: manifest, bytes: manifest.reduce((n, f) => n + f.bytes, 0), secretsIncluded: false, sourceDocumentsIncluded: false };
mkdirSync(resolve(root, 'qa/checkpoint-20260906'), { recursive: true });
writeFileSync(resolve(root, 'qa/checkpoint-20260906/package.json'), JSON.stringify(record, null, 2));
console.log(JSON.stringify({ stage, files: files.size, megabytes: +(record.bytes / 1048576).toFixed(2), pages: [...files].filter(p => p.endsWith('.html')).sort() }, null, 2));
