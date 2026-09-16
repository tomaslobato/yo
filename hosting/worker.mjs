// Bundled with the static page and the shared YouTube lookup by scripts/build.mjs.
export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
    if (path === '/api/latest-video') {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      try {
        const video = await getLatestVideo();
        return new Response(request.method === 'HEAD' ? null : JSON.stringify(video), { headers });
      } catch {
        return new Response(request.method === 'HEAD' ? null : JSON.stringify({ error: 'youtube_unavailable' }), { status: 502, headers });
      }
    }
    const asset = Object.hasOwn(assets, path) ? assets[path] : undefined;
    if (!asset) return new Response('Not found', { status: 404, headers });
    return new Response(request.method === 'HEAD' ? null : asset.body, { headers: { ...headers, 'Content-Type': asset.contentType } });
  }
};
