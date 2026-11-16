/* =====================================================================
   Wrong and Ugly — service worker (pasta game/)
   Só duas funções: INSTALAÇÃO (PWA) e OFFLINE.
   Estratégia cache-first: o jogo é um arquivo único e autossuficiente,
   então depois da primeira visita ele abre inteiro do cache, sem rede.
   Sem push, sem notificações, sem coleta de nada.
   Trocar a versão do CACHE a cada deploy que mudar os arquivos.
   ===================================================================== */

var CACHE = "wu-game-v9";
var PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        /* guarda cópia do que veio da rede (só respostas boas,
           do mesmo escopo) pra próxima visita ser offline */
        if (res && res.status === 200 && new URL(req.url).origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        /* offline e fora do cache: navegação cai na página do jogo */
        if (req.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});
