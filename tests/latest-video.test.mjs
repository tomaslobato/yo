import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNEL_ID, FEED_URL, getLatestVideo, parseLatestVideo } from '../lib/latest-video.mjs';
const entry = (id, published, extra = '') => `<entry><yt:channelId>${CHANNEL_ID}</yt:channelId><yt:videoId>${id}</yt:videoId><title>Video &amp; ingeniería</title><published>${published}</published>${extra}</entry>`;
test('Selects the most recently published video, ignoring later edits and future uploads', () => {
  const feed = entry('aaaaaaaaaaa', '2026-09-01T00:00:00Z', '<updated>2026-09-15T00:00:00Z</updated>') + entry('bbbbbbbbbbb', '2026-09-13T00:00:00Z') + entry('ccccccccccc', '2030-01-01T00:00:00Z');
  const result = parseLatestVideo(feed, Date.parse('2026-09-15'));
  assert.equal(result.id, 'bbbbbbbbbbb');
  assert.equal(result.title, 'Video & ingeniería');
});
test('Queries the long-form-only feed again on every request, without caching an ID', async () => {
  let calls = 0;
  const fetcher = async (url, options) => {
    assert.equal(url, FEED_URL);
    assert.match(url, /playlist_id=UULF/);
    assert.equal(options.cache, 'no-store');
    return new Response(entry(++calls === 1 ? 'aaaaaaaaaaa' : 'bbbbbbbbbbb', '2020-01-01T00:00:00Z'));
  };
  assert.equal((await getLatestVideo(fetcher)).id, 'aaaaaaaaaaa');
  assert.equal((await getLatestVideo(fetcher)).id, 'bbbbbbbbbbb');
  assert.equal(calls, 2);
});
test('Rejects malformed feeds, foreign channels, invalid IDs, and upstream errors', async () => {
  assert.throws(() => parseLatestVideo('<html>Unavailable</html>'));
  assert.throws(() => parseLatestVideo(entry('aaaaaaaaaaa', '2020-01-01').replace(CHANNEL_ID, 'different-channel')));
  assert.throws(() => parseLatestVideo(entry('invalid', '2020-01-01')));
  await assert.rejects(getLatestVideo(async () => new Response('', { status: 503 })));
});
