// Minimal no-op service worker — exists ONLY so Chrome (Android/desktop)
// considers this page installable. Chrome's PWA install criteria require a
// registered service worker with a fetch event handler, even when the app
// wants zero offline caching — without this file, "Instalar app" never
// shows up at all, no matter how correct the manifest is.
//
// Deliberately does no caching of any kind: every request is passed
// straight through to the network. An installed shortcut can never show a
// stale build this way — see index.html's PWA comment for why that matters
// (the game ships updates very often).
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
