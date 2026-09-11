/* ==========================================================================
   서비스 워커 — 오프라인에서도 앱 셸(페이지/스타일/스크립트)을 열람할 수 있도록
   캐싱합니다. Wikimedia 사진, Firestore, 환율 API 등 외부(다른 출처) 요청은
   가로채지 않고 그대로 네트워크로 흘려보냅니다.

   파일을 새로 추가/삭제했다면 CACHE_VERSION을 올려주세요(예: v1 → v2).
   버전이 바뀌면 이전 캐시는 activate 단계에서 자동 정리됩니다.
   ========================================================================== */
"use strict";

var CACHE_VERSION = "v1";
var CACHE_NAME = "fukuoka-trip-" + CACHE_VERSION;

var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./day1.html",
  "./day2.html",
  "./day3.html",
  "./day4.html",
  "./budget.html",
  "./food.html",
  "./info.html",
  "./manifest.json",
  "./css/style.css",
  "./js/data.js",
  "./js/icons.js",
  "./js/common.js",
  "./js/layout.js",
  "./js/index.js",
  "./js/day.js",
  "./js/budget.js",
  "./js/food.js",
  "./js/info.js",
  "./js/chart.umd.js",
  "./js/firebase-app-compat.js",
  "./js/firebase-firestore-compat.js",
  "./js/firebase-config.js",
  "./js/cloud.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS).catch(function (e) {
        console.warn("[sw] precache 중 일부 실패(무시하고 진행):", e);
      });
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// same-origin GET 요청: stale-while-revalidate (캐시 즉시 응답 + 백그라운드 갱신)
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부 출처(사진/Firestore/환율 API)는 그대로 네트워크로

  event.respondWith(
    caches.match(req).then(function (cached) {
      var networkFetch = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || networkFetch;
    })
  );
});
