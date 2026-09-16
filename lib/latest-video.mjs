export const CHANNEL_ID = 'UC3lO1gKJOenjFyp-3OytN3Q';
export const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULF3lO1gKJOenjFyp-3OytN3Q';

function decodeXml(value) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, key) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (key[0] !== '#') return named[key.toLowerCase()];
    const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

export function parseLatestVideo(xml, now = Date.now()) {
  const entries = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)].map(([, entry]) => {
    const tag = name => entry.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`))?.[1]?.trim();
    const id = tag('yt:videoId');
    const title = tag('title');
    const publishedAt = tag('published');
    if (tag('yt:channelId') !== CHANNEL_ID || !/^[\w-]{11}$/.test(id || '') || !title || !Number.isFinite(Date.parse(publishedAt)) || Date.parse(publishedAt) > now) return null;
    return { id, title: decodeXml(title), publishedAt, url: `https://www.youtube.com/watch?v=${id}`, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  }).filter(Boolean).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  if (!entries.length) throw new Error('No published long-form videos found in the channel feed');
  return entries[0];
}

export async function getLatestVideo(fetcher = fetch) {
  const response = await fetcher(FEED_URL, { cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/atom+xml', 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw new Error(`YouTube feed returned ${response.status}`);
  return parseLatestVideo(await response.text());
}
