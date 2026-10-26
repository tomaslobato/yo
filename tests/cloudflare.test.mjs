import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../hosting/cloudflare.mjs';
import { CHANNEL_ID, FEED_URL } from '../lib/latest-video.mjs';

const entry = id => `<entry><yt:channelId>${CHANNEL_ID}</yt:channelId><yt:videoId>${id}</yt:videoId><title>Video &amp; ingeniería</title><published>2026-09-13T00:00:00Z</published></entry>`;

async function withFeed(handler) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(entry('bbbbbbbbbbb'));
  };
  try {
    return await handler(calls);
  } finally {
    globalThis.fetch = original;
  }
}

test('Serves the latest video and keeps the API error contract', async () => {
  const posted = await worker.fetch(new Request('https://yo.example/api/latest-video', { method: 'POST' }));
  assert.equal(posted.status, 405);
  assert.equal(posted.headers.get('Allow'), 'GET, HEAD');

  await withFeed(async calls => {
    const response = await worker.fetch(new Request('https://yo.example/api/latest-video'));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), {
      id: 'bbbbbbbbbbb',
      title: 'Video & ingeniería',
      publishedAt: '2026-09-13T00:00:00Z',
      url: 'https://www.youtube.com/watch?v=bbbbbbbbbbb',
      thumbnail: 'https://i.ytimg.com/vi/bbbbbbbbbbb/hqdefault.jpg'
    });
    assert.equal(calls[0].url, FEED_URL);
    assert.equal(calls[0].options.cache, undefined);
    assert.equal(calls[0].options.headers['Cache-Control'], 'no-cache');

    const head = await worker.fetch(new Request('https://yo.example/api/latest-video', { method: 'HEAD' }));
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal(calls.length, 2);
  });

  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 503 });
  try {
    const failed = await worker.fetch(new Request('https://yo.example/api/latest-video'));
    assert.equal(failed.status, 502);
    assert.deepEqual(await failed.json(), { error: 'youtube_unavailable' });
  } finally {
    globalThis.fetch = original;
  }
});

test('Passes every other route to static assets', async () => {
  let forwarded = null;
  const env = { ASSETS: { fetch: request => { forwarded = request; return new Response('page', { status: 200 }); } } };
  const request = new Request('https://yo.example/');
  const response = await worker.fetch(request, env);
  assert.equal(forwarded, request);
  assert.equal(await response.text(), 'page');
});
