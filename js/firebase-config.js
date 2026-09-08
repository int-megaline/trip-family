/* ==========================================================================
   Firebase(Firestore) 프로젝트 설정값 — jeffrey-trip-fukuoka
   여기 값은 비밀키가 아니라 클라이언트에 노출되어도 되는 공개 식별값입니다.
   실제 보안은 Firebase 콘솔의 Firestore "규칙(Rules)"에서 제어합니다.

   projectId가 비어있거나 firebase-app-compat.js/firebase-firestore-compat.js가
   로드되지 않으면 js/cloud.js가 자동으로 비활성화되어, 사이트는 지금까지처럼
   브라우저 저장(localStorage) 방식으로만 동작합니다 — 즉 이 파일을 지우거나
   비워도 사이트는 정상 작동함.
   ========================================================================== */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyD65-xpgmhMXIuInjIaVenRl-SUP-HW724",
  authDomain: "jeffrey-trip-fukuoka.firebaseapp.com",
  databaseURL: "https://jeffrey-trip-fukuoka-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jeffrey-trip-fukuoka",
  storageBucket: "jeffrey-trip-fukuoka.firebasestorage.app",
  messagingSenderId: "157903477446",
  appId: "1:157903477446:web:5983430fef628f1a1695c7",
  measurementId: "G-XP5T16FS9G"
};
