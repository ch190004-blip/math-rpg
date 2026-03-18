
const CACHE = "math-rpg-immersive-v2";
const FILES = [
  "./",
  "./index.html",
  "./lobby.html",
  "./tower-seven-up.html",
  "./chapter-1-1-field.html",
  "./1-1.html",
  "./styles/start.css",
  "./styles/game-ui.css",
  "./js/firebase-core.js",
  "./js/app-shell.js",
  "./js/pixel-art.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
    ))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
