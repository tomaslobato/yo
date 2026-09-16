import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const assetFiles = [['/', 'index.html', 'text/html; charset=utf-8'], ['/styles.css', 'styles.css', 'text/css; charset=utf-8'], ['/app.js', 'app.js', 'text/javascript; charset=utf-8']];
const assets = {};
for (const [path, filename, contentType] of assetFiles) {
  assets[path] = { body: await readFile(new URL(`dist/${filename}`, root), 'utf8'), contentType };
}
assets['/index.html'] = assets['/'];
const youtube = await readFile(new URL('lib/latest-video.mjs', root), 'utf8');
const handler = await readFile(new URL('hosting/worker.mjs', root), 'utf8');
const manifest = await readFile(new URL('.openai/hosting.json', root), 'utf8');
await mkdir(new URL('dist/server/', root), { recursive: true });
await mkdir(new URL('dist/.openai/', root), { recursive: true });
await writeFile(new URL('dist/server/index.js', root), `${youtube}\nconst assets = ${JSON.stringify(assets)};\n${handler}`);
await writeFile(new URL('dist/.openai/hosting.json', root), manifest);
console.log('Built website and YouTube endpoint for Cloudflare Workers.');
