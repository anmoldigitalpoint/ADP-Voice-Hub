const CACHE_NAME = "adp-voice-hub-v1";
const ASSETS = [
  "index.html",
  "style.css",
  "app-shell.js",
  "manifest.json",
  "text-to-speech.html",
  "audio-to-text.html",
  "pdf-to-speech.html",
  "voice-recorder.html",
  "voice-enhancer.html",
  "voice-changer.html",
  "vocal-remover.html",
  "audio-trimmer.html",
  "audio-merger.html",
  "format-converter.html",
  "mp4-to-mp3.html",
  "ringtone-maker.html",
  "volume-booster.html",
  "speed-changer.html",
  "youtube-transcript.html",
  "translator.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});
