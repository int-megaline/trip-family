/* ==========================================================================
   Firebase Firestore 연동 (firebase-app-compat.js / firebase-firestore-compat.js
   를 js/ 폴더에 직접 번들링해서 사용 — 외부 CDN 의존 없음).

   FIREBASE_CONFIG.projectId가 없거나 compat SDK 스크립트가 로드되지 않았으면
   TripCloud.enabled = false 가 되고, 호출부(common.js 등)는 이 값을 확인해
   자동으로 localStorage 방식으로 대체 동작합니다. 즉 config를 비워도, SDK 파일이
   빠져도 사이트는 그대로 정상 작동합니다.

   데이터는 "fukuoka-trip" 컬렉션 아래 문서 하나("prepaid", "expenses",
   "budgetOverrides")로 저장합니다. Firestore 문서는 최상위가 반드시 객체여야
   하므로, 배열 값은 { __value: [...] } 로 감싸서 저장하고 읽을 때 풀어줍니다.
   ========================================================================== */
(function (global) {
  "use strict";

  var cfg = global.FIREBASE_CONFIG;
  var hasSdk = !!(global.firebase && global.firebase.firestore);
  var enabled = !!(cfg && cfg.projectId && hasSdk);
  var db = null;

  if (enabled) {
    try {
      if (!global.firebase.apps || !global.firebase.apps.length) {
        global.firebase.initializeApp(cfg);
      }
      db = global.firebase.firestore();
    } catch (e) {
      console.warn("[cloud] firebase 초기화 실패:", e);
      enabled = false;
    }
  }

  var COLLECTION = "fukuoka-trip";

  function wrap(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
    return { __value: value };
  }
  function unwrap(data) {
    if (data && Object.prototype.hasOwnProperty.call(data, "__value")) return data.__value;
    return data;
  }
  function docRef(path) {
    return db.collection(COLLECTION).doc(path);
  }

  // 1회성 읽기
  function get(path) {
    if (!enabled) return Promise.resolve(null);
    return docRef(path).get().then(function (snap) {
      return snap.exists ? unwrap(snap.data()) : null;
    }).catch(function (e) {
      console.warn("[cloud] get(" + path + ") failed:", e);
      return null;
    });
  }

  // 전체 값 덮어쓰기 (이 사이트는 항상 "배열/객체 전체를 통째로 저장"하는
  // 방식이라 set()만으로 충분합니다)
  function set(path, value) {
    if (!enabled) return Promise.resolve(false);
    return docRef(path).set(wrap(value)).then(function () { return true; }).catch(function (e) {
      console.warn("[cloud] set(" + path + ") failed:", e);
      return false;
    });
  }

  // 실시간 구독: 연결 직후 현재값으로 1회, 이후 값이 바뀔 때마다 cb(value) 호출.
  // 구독 해제 함수를 반환합니다.
  function subscribe(path, cb) {
    if (!enabled) return function () { /* noop */ };
    try {
      return docRef(path).onSnapshot(function (snap) {
        cb(snap.exists ? unwrap(snap.data()) : null);
      }, function (err) {
        console.warn("[cloud] subscribe(" + path + ") error:", err);
      });
    } catch (e) {
      console.warn("[cloud] subscribe(" + path + ") failed:", e);
      return function () { /* noop */ };
    }
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
