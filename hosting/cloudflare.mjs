// Cloudflare Workers entry. Static files in dist/ are served through the ASSETS binding.
import { getLatestVideo } from '../lib/latest-video.mjs';

// Workers fetch rejects the cache mode that the Node server sends.
async function workerFetch(url, options = {}) {
  const { cache: _cache, ...rest } = options;
  return fetch(url, rest);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (path !== '/api/latest-video') return env.ASSETS.fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
    }
    headers['Content-Type'] = 'application/json; charset=utf-8';
    try {
      const video = await getLatestVideo(workerFetch);
      return new Response(request.method === 'HEAD' ? null : JSON.stringify(video), { headers });
    } catch (error) {
      console.error('YouTube lookup failed:', error.message);
      return new Response(request.method === 'HEAD' ? null : JSON.stringify({ error: 'youtube_unavailable' }), { status: 502, headers });
    }
  }
};
