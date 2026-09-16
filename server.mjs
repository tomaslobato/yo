import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { getLatestVideo } from './lib/latest-video.mjs';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']]
]);
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  if (path === '/api/latest-video') {
    try {
      const video = await getLatestVideo();
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : JSON.stringify(video));
    } catch (error) {
      console.error('YouTube lookup failed:', error.message);
      response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : JSON.stringify({ error: 'youtube_unavailable' }));
    }
    return;
  }
  const asset = assets.get(path);
  if (!asset) { response.writeHead(404).end('Not found'); return; }
  try {
    const body = await readFile(new URL(`./dist/${asset[0]}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': asset[1] });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(500).end('Unable to load page'); }
});
const port = Number(process.env.PORT || 4173);
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`http://${process.env.HOST || '127.0.0.1'}:${port}`));
