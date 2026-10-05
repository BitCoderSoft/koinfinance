// KoinFin Service Worker
// Estratégia: cache-first para assets estáticos.
// Chamadas de API (Supabase, Binance, Cloudflare) vão direto à rede —
// o app já tem cache próprio via localStorage.

const CACHE = 'koinfin-v0.2.0-beta';

const ASSETS_ESTATICOS = [
    './',
    './index.html',
    './manifest.json',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
];

// dominios que nunca passam pelo cache do SW
const REDE_DIRETA = [
    'supabase.co',
    'binance.vision',
    'binance.com',
    'workers.dev',
    'coingecko.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'unpkg.com',
];

self.addEventListener('install', function (ev) {
    ev.waitUntil(
        caches.open(CACHE).then(function (cache) {
            return cache.addAll(ASSETS_ESTATICOS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (ev) {
    ev.waitUntil(
        caches.keys().then(function (chaves) {
            return Promise.all(
                chaves
                    .filter(function (k) { return k !== CACHE; })
                    .map(function (k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (ev) {
    var url = new URL(ev.request.url);

    // rede direta para APIs externas
    var ehExterno = REDE_DIRETA.some(function (dom) {
        return url.hostname.includes(dom);
    });
    if (ehExterno) return;

    // para tudo mais: cache-first, cai na rede se não achar
    ev.respondWith(
        caches.match(ev.request).then(function (cached) {
            if (cached) return cached;
            return fetch(ev.request).then(function (response) {
                if (
                    response.ok &&
                    url.origin === self.location.origin &&
                    ev.request.method === 'GET'
                ) {
                    var clone = response.clone();
                    caches.open(CACHE).then(function (cache) {
                        cache.put(ev.request, clone);
                    });
                }
                return response;
            });
        })
    );
});
