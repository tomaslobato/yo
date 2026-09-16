const copy = {
  es: { hello: 'HOLA, SOY', bio: 'Creador de contenido y estudiante de ingeniería en computación.', latest: 'Último video', 'all-videos': 'Ver todos los videos', watch: 'Ver en YouTube', channel: 'Ver canal en YouTube', loading: 'Buscando el último video…', unavailable: 'No pudimos consultar el último video. Podés ver los videos en el canal.', player: 'Podés ver el video directamente en YouTube.' },
  en: { hello: 'HELLO, I’M', bio: 'Content creator and computer engineering student.', latest: 'Latest video', 'all-videos': 'Watch all videos', watch: 'Watch on YouTube', channel: 'View YouTube channel', loading: 'Finding the latest video…', unavailable: 'We couldn’t retrieve the latest video. You can find the videos on the channel.', player: 'You can watch the video directly on YouTube.' }
};
let language = 'es';
copy.es.contact = 'Contacto';
copy.en.contact = 'Contact';
let video = null;
let status = 'loading';
let youtubePlayer;
let playerTimer;
const preview = document.getElementById('video-cover');
const thumbnail = document.getElementById('video-thumbnail');
try { if (localStorage.getItem('language') === 'en') language = 'en'; } catch {}
function setLanguage(next) {
  language = next;
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = copy[language][element.dataset.i18n]; });
  document.querySelector('meta[name="description"]').content = `Tomas Lobato. ${copy[language].bio.replace('\n', ' ')}`;
  document.querySelector('.socials').setAttribute('aria-label', language === 'es' ? 'Redes sociales' : 'Social media');
  document.getElementById('language-toggle').setAttribute('aria-label', language === 'es' ? 'Switch to English' : 'Cambiar a español');
  document.getElementById('language-es').classList.toggle('selected', language === 'es');
  document.getElementById('language-en').classList.toggle('selected', language === 'en');
  const iframe = document.querySelector('#video-container iframe');
  if (iframe) iframe.title = `${copy[language].latest}: ${video?.title || 'Tomas Lobato'}`;
  preview.setAttribute('aria-label', video ? `${copy[language].watch}: ${video.title}` : copy[language].channel);
  document.getElementById('video-action').textContent = video ? copy[language].watch : copy[language].channel;
  document.getElementById('player-status').textContent = copy[language][status] || '';
  try { localStorage.setItem('language', language); } catch {}
}
function showVideoLink() {
  clearTimeout(playerTimer);
  preview.hidden = false;
  status = 'player';
  setLanguage(language);
}
function createPlayer() {
  youtubePlayer = new YT.Player('youtube-player', {
    host: 'https://www.youtube-nocookie.com',
    width: '100%', height: '100%', videoId: video.id,
    playerVars: { origin: location.origin, playsinline: 1, rel: 0, hl: language },
    events: {
      onReady(event) { event.target.getIframe().referrerPolicy = 'strict-origin-when-cross-origin'; setLanguage(language); },
      onStateChange(event) {
        if ([YT.PlayerState.CUED, YT.PlayerState.PLAYING, YT.PlayerState.PAUSED].includes(event.data)) {
          clearTimeout(playerTimer);
          preview.hidden = true;
          status = '';
          setLanguage(language);
        }
      },
      onError: showVideoLink
    }
  });
}
async function loadLatestVideo() {
  try {
    // One fresh request per page load; no timer, saved video ID or browser cache.
    const response = await fetch('/api/latest-video', { cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Latest video lookup failed');
    const latest = await response.json();
    if (!/^[\w-]{11}$/.test(latest.id || '') || typeof latest.title !== 'string' || !latest.title.trim()) throw new Error('Invalid video response');
    video = latest;
    preview.href = `https://www.youtube.com/watch?v=${video.id}`;
    thumbnail.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    thumbnail.alt = video.title;
    thumbnail.hidden = false;
    status = '';
    setLanguage(language);
  } catch {
    status = 'unavailable';
    setLanguage(language);
    return;
  }
  // Playback is independent of discovery. A blocked player still links to the fresh result.
  playerTimer = setTimeout(showVideoLink, 12000);
  window.onYouTubeIframeAPIReady = createPlayer;
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  script.onerror = showVideoLink;
  document.head.appendChild(script);
}
thumbnail.onerror = () => { thumbnail.hidden = true; };
document.getElementById('language-toggle').addEventListener('click', () => setLanguage(language === 'es' ? 'en' : 'es'));
document.getElementById('year').textContent = new Date().getFullYear();
setLanguage(language);
loadLatestVideo();


