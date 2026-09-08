/* ==========================================================================
   Firebase Realtime Database 연동 — REST API + Server-Sent Events만 사용하고
   별도 Firebase SDK는 번들링하지 않습니다(용량 절약 + 버전 관리 불필요).
   FIREBASE_CONFIG.databaseURL이 없으면 TripCloud.enabled = false 가 되고,
   호출부(common.js 등)는 이 값을 확인해 자동으로 localStorage 방식으로 대체
   동작합니다. 즉 config를 비워도 사이트는 그대로 정상 작동합니다.
   ========================================================================== */
(function (global) {
  "use strict";

  var cfg = global.FIREBASE_CONFIG;
  var enabled = !!(cfg && cfg.databaseURL && /^https:\/\//.test(cfg.databaseURL));
  var BASE = enabled ? cfg.databaseURL.replace(/\/+$/, "") : "";
  var ROOT = "fukuoka-trip"; // 이 프로젝트를 다른 용도로도 쓸 경우를 대비해 데이터를 이 경로 하위로 한정

  function pathUrl(path) {
    return BASE + "/" + ROOT + "/" + path + ".json";
  }

  // 1회성 읽기
  function get(path) {
    if (!enabled) return Promise.resolve(null);
    return fetch(pathUrl(path)).then(function (r) {
      if (!r.ok) throw new Error("cloud get failed: " + r.status);
      return r.json();
    }).catch(function (e) {
      console.warn("[cloud] get(" + path + ") failed:", e);
      return null;
    });
  }

  // 전체 값 덮어쓰기 (이 사이트는 항상 "배열/객체 전체를 통째로 저장"하는
  // 방식이라 PUT만으로 충분합니다)
  function set(path, value) {
    if (!enabled) return Promise.resolve(false);
    return fetch(pathUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value === undefined ? null : value)
    }).then(function (r) { return r.ok; }).catch(function (e) {
      console.warn("[cloud] set(" + path + ") failed:", e);
      return false;
    });
  }

  // 실시간 구독: 연결 직후 현재값으로 1회, 이후 값이 바뀔 때마다 cb(value) 호출.
  // 구독 해제 함수를 반환합니다. Firebase RTDB REST 스트리밍은 EventSource로
  // 그대로 열 수 있고(별도 인증 헤더 불필요, 브라우저가 Accept: text/event-stream을
  // 자동으로 붙여줌), "put"(전체 교체)·"patch"(부분 변경) 두 이벤트를 내려줍니다.
  function subscribe(path, cb) {
    if (!enabled || typeof EventSource === "undefined") return function () { /* noop */ };
    var es;
    try {
      es = new EventSource(pathUrl(path));
    } catch (e) {
      console.warn("[cloud] subscribe(" + path + ") failed:", e);
      return function () { /* noop */ };
    }
    var value = null;
    es.addEventListener("put", function (e) {
      try {
        var msg = JSON.parse(e.data);
        value = msg.data;
        cb(value);
      } catch (err) { /* noop */ }
    });
    es.addEventListener("patch", function (e) {
      try {
        var msg = JSON.parse(e.data);
        var key = (msg.path || "/").replace(/^\//, "");
        if (!key) {
          value = msg.data;
        } else {
          if (!value || typeof value !== "object") value = {};
          value[key] = msg.data;
        }
        cb(value);
      } catch (err) { /* noop */ }
    });
    es.onerror = function () { /* EventSource가 자동 재연결을 시도합니다 */ };
    return function () { try { es.close(); } catch (e) { /* noop */ } };
  }

  // 페이지 진입시 흔히 쓰는 패턴: 구독을 시작하고, 클라우드에 아직 값이 없으면
  // (이 프로젝트를 처음 쓰는 경우) 현재 로컬 값을 클라우드에 한 번 올려 기준값으로
  // 삼습니다. 이후 변경사항은 onChange(cloudValue)로 전달됩니다.
  function sync(path, getLocalValue, onChange) {
    if (!enabled) return function () { /* noop */ };
    var firstCall = true;
    return subscribe(path, function (val) {
      if (firstCall) {
        firstCall = false;
        if (val === null || val === undefined) {
          set(path, getLocalValue());
          return;
        }
      }
      onChange(val);
    });
  }

  global.TripCloud = { enabled: enabled, get: get, set: set, subscribe: subscribe, sync: sync };
})(window);
