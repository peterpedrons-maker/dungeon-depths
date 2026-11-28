// Service worker: deixa o jogo abrir offline depois da primeira visita.
// - navegação: rede primeiro (pega versões novas), cache como reserva
// - arquivos do build (nomes com hash): cache primeiro
const CACHE = 'sentenca-v137';
const SHELL = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => {
  // a página manda a lista do que já carregou, pra primeira visita também ficar offline
  if (e.data && e.data.type === 'cache' && Array.isArray(e.data.urls)) {
    e.waitUntil(
      caches.open(CACHE).then((c) =>
        Promise.all(e.data.urls.filter((u) => u.startsWith(self.location.origin)).map((u) => c.add(u).catch(() => {}))),
      ),
    );
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./', { ignoreVary: true })),
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreVary: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
