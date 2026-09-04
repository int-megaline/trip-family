/* ==========================================================================
   후쿠오카·유후인·벳푸 가족여행 — 여행 데이터
   원본: Google Sheets "일본 - 정선 가족 여행" > schedule-final 시트
   ========================================================================== */

(function (global) {
  "use strict";

  // ---- Wikimedia 이미지 헬퍼 (File: 문서 URL → 실제 썸네일 URL) --------------
  function wmThumb(filePageUrl, width) {
    if (!filePageUrl) return "";
    return filePageUrl.replace("/wiki/File:", "/wiki/Special:FilePath/") +
      (filePageUrl.indexOf("?") > -1 ? "&" : "?") + "width=" + (width || 900);
  }
  function mapLink(query) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
  }

  // ---- 출처(각주) ----------------------------------------------------------
  var FOOTNOTES = {
    sheet: { label: "일정 원본: Google Sheets「일본 - 정선 가족 여행」schedule-final", url: "https://docs.google.com/spreadsheets/d/1YuaUq6idXvIkjWzrGec3N3eEGWlMhJ2-XUGdyXnJ-do/edit?gid=104610685#gid=104610685" },
    dazaifu: { label: "다자이후 텐만구 – Japan Travel (JNTO 공식)", url: "https://www.japan.travel/en/spot/798/" },
    kinrin: { label: "긴린코 – Japan Travel (JNTO 공식)", url: "https://www.japan.travel/en/spot/712/" },
    yunotsubo: { label: "유노츠보 거리 – 오이타현 공식 관광 사이트", url: "https://www.visit-oita.jp/spots/detail/4357" },
    sagiridai: { label: "사기리다이 전망대 – 오이타현 공식 관광 사이트", url: "https://www.visit-oita.jp/spots/detail/4361" },
    kamado: { label: "가마도지옥 – 벳푸지옥순례 공식 사이트", url: "https://www.beppu-jigoku.com/kamado/" },
    sandbath: { label: "벳푸 해변 모래찜질 – Japan Travel (JNTO 공식)", url: "https://www.japan.travel/en/spot/718/" },
    futagoji: { label: "후타고지 – Visit Kyushu 공식 사이트", url: "https://www.visit-kyushu.com/en/see-and-do/spots/futagoji-temple/" },
    roundhouse: { label: "분고모리 기관고 – Wikipedia", url: "https://en.wikipedia.org/wiki/Bungo-Mori_Roundhouse" },
    aso: { label: "아소쿠주 국립공원 – 일본 환경성(MOE) 공식", url: "https://www.env.go.jp/en/nature/nps/park/aso/index.html" },
    oyamadam: { label: "오야마 댐 – 히타시 관광협회", url: "https://oidehita.com/archives/62034" },
    hakata: { label: "하카타역 – Wikipedia", url: "https://en.wikipedia.org/wiki/Hakata_Station" },
    airport: { label: "후쿠오카 공항 – 공식 사이트", url: "https://www.fukuoka-airport.jp/en/" },
    weather: { label: "후쿠오카 11월 평균 기후 – Weather2Travel", url: "https://www.weather2travel.com/japan/fukuoka/november/" },
    fx: { label: "환율 변환 데이터 – Frankfurter Exchange Rates API (ECB 기준)", url: "https://frankfurter.dev/" },
    driving: { label: "일본 렌터카 이용 안내 – Japan Travel (JNTO 공식)", url: "https://www.japan.travel/en/plan/getting-around/cars/" },
    mofa: { label: "주후쿠오카 대한민국 총영사관 – 주소 및 연락처(외교부 공식)", url: "https://overseas.mofa.go.kr/jp-fukuoka-ko/wpge/m_1587/contents.do" },
    heroImage: { label: "후쿠오카 스카이라인(모모치 해변) – Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Fukuoka_Skyline_of_Seaside_Momochi.jpg" },
    lodging: { label: "카메카와 유카리 안(亀川ゆかり庵) 예약 페이지 – Hotels.com", url: "https://kr.hotels.com/ho3224660736/kamekawa-yukari-ann-bespu-ilbon/?chkin=2026-11-06&chkout=2026-11-08" }
  };

  // ---- 메인 페이지 상단 배경(패럴럭스) 이미지 --------------------------------
  var HERO_IMAGE = {
    src: wmThumb("https://commons.wikimedia.org/wiki/File:Fukuoka_Skyline_of_Seaside_Momochi.jpg", 1920),
    credit: "Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Fukuoka_Skyline_of_Seaside_Momochi.jpg",
    alt: "모모치 해변에서 바라본 후쿠오카 스카이라인과 후쿠오카 타워"
  };

  // ---- 통합 비용 카테고리 (예산 트래커 드롭다운과 동일 체계) ------------------
  var CATEGORIES = [
    { key: "항공", label: "항공", cls: "cat-교통" },
    { key: "렌트", label: "렌트(차량)", cls: "cat-교통" },
    { key: "숙박", label: "숙박", cls: "cat-숙박" },
    { key: "편의점", label: "편의점", cls: "cat-편의점" },
    { key: "쇼핑", label: "쇼핑", cls: "cat-쇼핑" },
    { key: "식사", label: "식사", cls: "cat-식사" },
    { key: "관광지", label: "관광지 입장료", cls: "cat-관광지" },
    { key: "간식", label: "간식", cls: "cat-간식" },
    { key: "기타", label: "기타", cls: "cat-기타" }
  ];

  // ---- 사전 결제(선결제) 항목 --------------------------------------------
  // status: "paid"(결제 완료) | "pending"(결제 예정) — budget.html에서 직접
  // 추가/수정/삭제가 가능하며, 그 결과는 이 배열을 시드값으로 브라우저에
  // 저장됩니다(TripUtil.loadPrepaid/savePrepaid 참고).
  var PREPAID = [
    { id: "flight", activity: "항공권 결제", memo: "에어부산 BX453/BX454 왕복 · 성인 5명 · 1인 488,200원", category: "항공", price: 2441000, status: "paid",
      flag: "sheet 원본 금액(24,410,000원)이 1인 단가(48.82만원) × 성인 5명 = 2,441,000원의 정확히 10배로 기재되어 있어, 자릿수 오류로 판단해 2,441,000원으로 자동 보정했습니다. 실제 결제 영수증과 반드시 대조 확인해 주세요." },
    { id: "rentcar", activity: "렌터카 예약 결제", memo: "미쓰비시 델리카 (보험 포함)", category: "렌트", price: 372000, status: "pending" },
    { id: "lodging-beppu", activity: "숙소 예약 결제 – 벳푸", memo: "카메카와 유카리 안(亀川中央町) · 67,500원/인 기준 2박(11/6~11/8)", category: "숙박", price: 675773, status: "pending" },
    { id: "lodging-fukuoka", activity: "숙소 예약 결제 – 후쿠오카", memo: "70,000원/인 기준 1박(11/8~11/9)", category: "숙박", price: 350000, status: "pending" }
  ];

  // ---- 숙소 정보 -------------------------------------------------------
  var LODGING = [
    {
      name: "카메카와 유카리 안 (亀川ゆかり庵 / Kamekawa Yukari Ann)",
      city: "벳푸시 (오이타현)",
      checkin: "2026-11-06", checkout: "2026-11-08", nights: 2,
      note: "다자이후·오야마 댐 경유 후 도착, 2박째 되는 날 유후인·벳푸 관광의 베이스캠프",
      map: "亀川中央町 벳푸",
      bookingLabel: "Hotels.com 예약 페이지",
      bookingUrl: FOOTNOTES.lodging.url
    },
    {
      name: "후쿠오카 시내 숙소",
      city: "후쿠오카 시내",
      checkin: "2026-11-08", checkout: "2026-11-09", nights: 1,
      note: "아소쿠주 관광 · 렌터카 반납 후 마지막 밤 숙박, 하카타역 인근",
      map: "하카타역",
      bookingLabel: null,
      bookingUrl: null
    }
  ];

  // ---- 일자별 상세 일정 -----------------------------------------------------
  var DAYS = [
    {
      id: 1, date: "2026-11-06", weekday: "금",
      title: "후쿠오카 입국 · 다자이후 · 벳푸 숙소 이동",
      summary: "인천에서 후쿠오카로 입국해 렌터카를 픽업하고, 학문의 신을 모신 다자이후 텐만구를 들른 뒤 오야마 댐을 거쳐 벳푸시의 숙소(카메카와 유카리 안)에 도착합니다.",
      hero: wmThumb("https://commons.wikimedia.org/wiki/File:20100719_Dazaifu_Tenmangu_Shrine_3328.jpg", 1400),
      heroCredit: "Wikimedia Commons", heroCreditUrl: "https://commons.wikimedia.org/wiki/File:20100719_Dazaifu_Tenmangu_Shrine_3328.jpg",
      items: [
        { start: "07:25", end: "08:55", duration: "1시간 30분", activity: "ICN → FUK 이동", location: "후쿠오카 공항 (FUK)", category: "항공", memo: "에어부산 BX453", price: null,
          desc: "인천국제공항에서 후쿠오카 공항까지 약 1시간 30분 비행합니다. 후쿠오카 공항은 시내 하카타역에서 지하철로 5분 거리로 접근성이 좋습니다.", sourceIds: ["airport"], map: "후쿠오카 공항" },
        { start: "10:55", end: "11:25", duration: "30분", activity: "차량 렌트 (공항 근처)", location: "후쿠오카 공항 인근 렌터카 센터", category: "렌트", memo: "미쓰비시 델리카 (사전 결제 완료)", price: null,
          desc: "국제운전면허증(제네바협약)과 국내 면허증을 함께 지참해야 합니다. 일본은 좌측통행이므로 출발 전 차량 조작에 충분히 익숙해지는 것을 권장합니다.", sourceIds: ["driving"], map: "후쿠오카 공항 렌터카" },
        { start: "11:25", end: "11:40", duration: "15분", activity: "차량 주유 (40L)", location: "공항 인근 주유소", category: "렌트", memo: "170엔/리터 × 40리터", price: 65000 },
        { start: "11:40", end: "12:10", duration: "30분", activity: "편의점 간단 식사 (또는 라멘)", location: "이동 중 편의점", category: "편의점", memo: null, price: 50000 },
        { start: "13:10", end: "14:40", duration: "1시간 30분", activity: "다자이후 텐만구 참배", location: "다자이후 텐만구", category: "관광지", memo: "일본 3대 신사 중 하나, 학문의 신을 모심", price: null,
          desc: "학문의 신 스가와라노 미치자네를 모신 신사로 매년 수험생과 참배객이 몰리는 규슈 최고의 명소입니다. 매화나무 정원과 참배로 상점가(오미야게 거리)도 함께 둘러보기 좋습니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:20100719_Dazaifu_Tenmangu_Shrine_3328.jpg"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:20100719_Dazaifu_Tenmangu_Shrine_3328.jpg",
          sourceIds: ["dazaifu"], map: "다자이후 텐만구" },
        { start: "16:10", end: "16:40", duration: "30분", activity: "마메다마치 인근 식사", location: "마메다마치 (히타)", category: "식사", memo: "덮밥 또는 라멘 · 고속도로 휴게소 대체 가능", price: 75000,
          desc: "에도시대 상인 마을의 정취가 남아있는 히타시의 옛거리로, 이동 중 간단히 들러 식사하기 좋은 위치입니다.", map: "마메다마치 히타" },
        { start: "17:10", end: "18:10", duration: "1시간", activity: "오야마 댐 경유", location: "오야마 댐 (히타시)", category: "관광지", memo: "애니메이션 '진격의 거인' 배경 영감지로 알려짐", price: null,
          desc: "저수지와 주변 산세가 어우러진 경관으로 잠깐 들러 사진 찍기 좋은 포인트입니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:Oyama_Dam.jpg"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Oyama_Dam.jpg",
          sourceIds: ["oyamadam"], map: "오야마 댐 일본" },
        { start: "19:40", end: "20:00", duration: "20분", activity: "숙소 체크인 (벳푸)", location: "카메카와 유카리 안 (벳푸시)", category: "숙박", memo: "Hotels.com 예약 · 2박(11/6~11/8)", price: null,
          desc: "유후인·벳푸 관광의 베이스캠프가 되는 숙소로, 벳푸시 가메카와(亀川) 지역에 위치합니다.", sourceIds: ["lodging"], map: "亀川中央町 벳푸" },
        { start: "20:00", end: "20:30", duration: "30분", activity: "저녁거리 장보기", location: "숙소 인근 마트", category: "쇼핑", memo: null, price: null },
        { start: "20:30", end: "22:00", duration: "1시간 30분", activity: "저녁 식사", location: "숙소 또는 인근 식당", category: "식사", memo: "숙소 취사 vs 외식 선택", price: 150000 }
      ]
    },
    {
      id: 2, date: "2026-11-07", weekday: "토",
      title: "유후인 호수 산책 · 벳푸 지옥순례 & 모래찜질",
      summary: "유후인의 상징 긴린코와 유노츠보 거리를 거닐고, 실키로드 드라이브로 벳푸로 넘어가 가마도 지옥과 해변 모래찜질, 고찰 후타고지까지 알차게 둘러봅니다.",
      hero: wmThumb("https://commons.wikimedia.org/wiki/File:Lake_Kinrin_in_Yufuin,_Oita_-_Aug_24,_2018_(1).jpg", 1400),
      heroCredit: "Wikimedia Commons", heroCreditUrl: "https://commons.wikimedia.org/wiki/File:Lake_Kinrin_in_Yufuin,_Oita_-_Aug_24,_2018_(1).jpg",
      items: [
        { start: "09:00", end: "10:00", duration: "1시간", activity: "긴린코 호수 산책 & 브런치", location: "긴린코", category: "관광지", memo: "호수 근처 커피숍에서 브런치", price: null,
          desc: "아침 안개가 피어오르는 것으로 유명한 유후인의 상징적인 호수. 호수 주변으로 카페와 소품샵이 늘어서 있어 아침 산책 겸 브런치 코스로 인기가 많습니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:Lake_Kinrin_in_Yufuin,_Oita_-_Aug_24,_2018_(1).jpg"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Lake_Kinrin_in_Yufuin,_Oita_-_Aug_24,_2018_(1).jpg",
          sourceIds: ["kinrin"], map: "긴린코 유후인" },
        { start: "10:00", end: "10:30", duration: "30분", activity: "유노츠보 거리 산책 & 쇼핑", location: "유노츠보 거리", category: "관광지", memo: null, price: null,
          desc: "긴린코에서 유후인역까지 이어지는 약 1.2km의 먹거리·기념품 거리로 유후인 관광의 중심가입니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:View_of_Mount_Yufudake_and_Yufuin_Onsen_Street_in_front_of_Yufuin_Station.JPG"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:View_of_Mount_Yufudake_and_Yufuin_Onsen_Street_in_front_of_Yufuin_Station.JPG",
          sourceIds: ["yunotsubo"], map: "유노츠보 거리 유후인" },
        { start: "10:30", end: "11:00", duration: "30분", activity: "사기리다이 전망대", location: "사기리다이 전망대", category: "관광지", memo: "유후산 조망 포인트, 실키로드 입구", price: null,
          desc: "유후산과 유후인 분지를 한눈에 내려다볼 수 있는 전망대로, 유후 실키로드 드라이브 코스의 입구이기도 합니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:Yufuin_and_Mount_Yufu.jpg"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Yufuin_and_Mount_Yufu.jpg",
          sourceIds: ["sagiridai"], map: "사기리다이 전망대" },
        { start: "11:00", end: "12:30", duration: "1시간 30분", activity: "유후 실키로드 드라이브", location: "유후 실키로드 (Yufu Silky Road)", category: "관광지", memo: "전망 좋은 드라이브 코스", price: null,
          desc: "유후인과 벳푸를 잇는 산악 드라이브 코스로, 굽이굽이 도로를 따라 탁 트인 전망을 즐길 수 있습니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:View_of_Mount_Yufudake_and_Yufuin_Onsen_Street_in_front_of_Yufuin_Station_2.jpg"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:View_of_Mount_Yufudake_and_Yufuin_Onsen_Street_in_front_of_Yufuin_Station_2.jpg",
          map: "由布サイロード" },
        { start: "12:30", end: "13:30", duration: "1시간", activity: "간단 점심 (라멘/우동)", location: "벳푸시", category: "식사", memo: null, price: null },
        { start: "14:00", end: "14:30", duration: "30분", activity: "가마도 지옥 관람 (대체 옵션)", location: "가마도 지옥", category: "관광지", memo: "모래찜질과 양자택일 옵션", price: null,
          desc: "벳푸 8대 지옥 중 하나로, 부글부글 끓어오르는 뜨거운 온천과 독특한 조형물(가마솥 지옥할멈 상)이 특징입니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:Beppu_Kamado_Jigoku11n4272.jpg"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Beppu_Kamado_Jigoku11n4272.jpg",
          sourceIds: ["kamado"], map: "가마도지옥 벳푸" },
        { start: "14:00", end: "15:30", duration: "1시간 30분", activity: "벳푸 해변 모래찜질", location: "벳푸 해변 모래사장 (스나유)", category: "관광지", memo: "25,000원/인 기준", price: 125000,
          desc: "따뜻한 모래에 몸을 묻고 즐기는 벳푸 명물 온천 체험입니다. 유카타 대여가 포함되며 사전 예약 없이도 이용 가능하나 성수기 대기가 있을 수 있습니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:Japanese_ladies_taking_a_sand_bath,_Beppr_Wellcome_V0049854.jpg"), photoCredit: "Wellcome Collection (Wikimedia Commons)",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Japanese_ladies_taking_a_sand_bath,_Beppr_Wellcome_V0049854.jpg",
          sourceIds: ["sandbath"], map: "벳푸 해변 모래찜질" },
        { start: "16:00", end: "17:30", duration: "1시간 30분", activity: "후타고지 사찰 관람", location: "후타고지 (Futagoji Temple)", category: "관광지", memo: "300엔/인", price: 15000,
          desc: "쿠니사키 반도 산악 불교의 중심 사찰로, 웅장한 인왕상과 가을 단풍으로 유명합니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:Stone_Ni%C5%8D_Statues,_Futago-ji_temple,_Kunisaki_-_Mar_19,_2024.jpg"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Stone_Ni%C5%8D_Statues,_Futago-ji_temple,_Kunisaki_-_Mar_19,_2024.jpg",
          sourceIds: ["futagoji"], map: "후타고지 쿠니사키" },
        { start: "18:00", end: "19:00", duration: "1시간", activity: "저녁 식사 (스시 또는 와규)", location: "벳푸 시내", category: "식사", memo: "분고규 · 유자후추 · 토리텐 센베이", price: 150000 }
      ]
    },
    {
      id: 3, date: "2026-11-08", weekday: "일",
      title: "분고모리 철도유산 · 아소쿠주 대자연 · 후쿠오카 이동",
      summary: "벳푸 숙소를 나서 옛 철도유산 분고모리 기관고와 웅장한 아소쿠주 국립공원의 초원·분화구를 만끽한 뒤, 렌터카를 반납하고 하카타역 쇼핑까지 즐기는 날입니다.",
      hero: wmThumb("https://commons.wikimedia.org/wiki/File:Aso_Nakadake_20150920_from_Kusasenri.JPG", 1400),
      heroCredit: "Wikimedia Commons", heroCreditUrl: "https://commons.wikimedia.org/wiki/File:Aso_Nakadake_20150920_from_Kusasenri.JPG",
      items: [
        { start: "08:30", end: "08:50", duration: "20분", activity: "숙소 체크아웃 (벳푸)", location: "카메카와 유카리 안 (벳푸시)", category: "숙박", memo: "2박 일정 종료", price: null, map: "亀川中央町 벳푸" },
        { start: "09:00", end: "09:30", duration: "30분", activity: "분고모리 기관고 견학", location: "분고모리 기관고", category: "관광지", memo: "철도 박물관", price: null,
          desc: "1934년 지어진 부채꼴 모양의 목조 차고(라운드하우스)로, 옛 국철 규슈 철도유산이 원형에 가깝게 보존되어 있습니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:Bungo-Mori_Roundhouse_and_turntable_1.jpg"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Bungo-Mori_Roundhouse_and_turntable_1.jpg",
          sourceIds: ["roundhouse"], map: "분고모리 기관고" },
        { start: "10:30", end: "12:30", duration: "2시간", activity: "아소쿠주 국립공원 하이킹", location: "아소쿠주 국립공원", category: "관광지", memo: "활화산 분화구 & 초원(구사센리)", price: null,
          desc: "지금도 활동 중인 아소산 분화구와 드넓은 초원 구사센리가 펼쳐지는 일본 최대급 칼데라 국립공원입니다. 화산 활동 상황에 따라 분화구 접근이 통제될 수 있어 방문 전 최신 화산 정보 확인이 필요합니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:Aso_Nakadake_20150920_from_Kusasenri.JPG"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Aso_Nakadake_20150920_from_Kusasenri.JPG",
          sourceIds: ["aso"], map: "아소쿠주 국립공원" },
        { start: "15:30", end: "16:00", duration: "30분", activity: "숙소 체크인 (후쿠오카)", location: "후쿠오카 시내 숙소", category: "숙박", memo: "사전 결제 완료", price: null },
        { start: "16:00", end: "16:20", duration: "20분", activity: "렌터카 반납", location: "후쿠오카 시내 반납지점", category: "렌트", memo: null, price: null },
        { start: "17:30", end: "19:00", duration: "1시간 30분", activity: "돈키호테 & 역 주변 쇼핑", location: "하카타역", category: "쇼핑", memo: null, price: null,
          desc: "규슈 최대 터미널역으로 아뮤플라자, 돈키호테 등 쇼핑 시설이 밀집해 있습니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:JR_Hakata_station_,_JR_%E5%8D%9A%E5%A4%9A%E9%A7%85_-_panoramio.jpg"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:JR_Hakata_station_,_JR_%E5%8D%9A%E5%A4%9A%E9%A7%85_-_panoramio.jpg",
          sourceIds: ["hakata"], map: "하카타역" },
        { start: "19:00", end: "20:00", duration: "1시간", activity: "저녁 식사 (스시 또는 와규)", location: "하카타역 인근", category: "식사", memo: null, price: 150000 }
      ]
    },
    {
      id: 4, date: "2026-11-09", weekday: "월",
      title: "후쿠오카 출국",
      summary: "숙소를 정리하고 마지막 식사를 즐긴 뒤 대중교통으로 공항까지 이동, 인천으로 귀국하는 날입니다.",
      hero: wmThumb("https://commons.wikimedia.org/wiki/File:Fukuoka_Airport_Terminal_1.JPG", 1400),
      heroCredit: "Wikimedia Commons", heroCreditUrl: "https://commons.wikimedia.org/wiki/File:Fukuoka_Airport_Terminal_1.JPG",
      items: [
        { start: "10:00", end: "10:20", duration: "20분", activity: "숙소 체크아웃 (후쿠오카)", location: "후쿠오카 시내 숙소", category: "숙박", memo: null, price: null },
        { start: "10:30", end: "11:10", duration: "40분", activity: "식사 (출국 심사 후 가능)", location: "하카타역 인근", category: "식사", memo: "라멘 또는 우동", price: 75000 },
        { start: "11:20", end: "11:50", duration: "30분", activity: "공항 이동", location: "하카타역 → 후쿠오카 공항", category: "기타", memo: "지하철 + 공항 셔틀버스, 300엔/인", price: 15000 },
        { start: "13:50", end: "15:30", duration: "1시간 40분", activity: "FUK → ICN 이동", location: "인천공항 (ICN)", category: "항공", memo: "에어부산 BX454", price: null,
          desc: "규슈 최대 관문 후쿠오카 공항에서 인천으로 귀국합니다. 국제선 터미널(제2터미널)은 국내선 터미널과 무료 셔틀버스로 연결됩니다.",
          photo: wmThumb("https://commons.wikimedia.org/wiki/File:Fukuoka_Airport_Terminal_1.JPG"), photoCredit: "Wikimedia Commons",
          photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Fukuoka_Airport_Terminal_1.JPG",
          sourceIds: ["airport"], map: "후쿠오카 공항" },
        { start: "17:30", end: "18:00", duration: "30분", activity: "공항 주차비 정산", location: "인천국제공항 제1여객터미널 P2 장기주차장", category: "기타", memo: "9,000원/일", price: 36000 }
      ]
    }
  ];

  // ---- 파생 데이터 계산 헬퍼 -------------------------------------------------
  // prepaidList를 넘기면(예: budget.html에서 브라우저에 저장된 사용자 수정본)
  // 그 값을 기준으로 계산하고, 생략하면 기본 시드값(PREPAID)을 사용합니다.
  function allItems(prepaidList) {
    var out = [];
    (prepaidList || PREPAID).forEach(function (p) { out.push({ activity: p.activity, category: p.category, price: p.price, date: null, memo: p.memo }); });
    DAYS.forEach(function (d) {
      d.items.forEach(function (it) { out.push({ activity: it.activity, category: it.category, price: it.price, date: d.date, memo: it.memo }); });
    });
    return out;
  }

  function plannedByCategory(prepaidList) {
    var map = {};
    CATEGORIES.forEach(function (c) { map[c.key] = 0; });
    allItems(prepaidList).forEach(function (it) {
      if (it.price) map[it.category] = (map[it.category] || 0) + it.price;
    });
    return map;
  }

  function plannedTotal(prepaidList) {
    var t = 0;
    allItems(prepaidList).forEach(function (it) { if (it.price) t += it.price; });
    return t;
  }

  function plannedTotalByDate() {
    var map = {};
    DAYS.forEach(function (d) {
      var sum = 0;
      d.items.forEach(function (it) { if (it.price) sum += it.price; });
      map[d.date] = sum;
    });
    return map;
  }

  function dayLabel(d) {
    return "Day " + d.id + " · " + d.date.slice(5).replace("-", ".") + "(" + d.weekday + ")";
  }

  global.TripData = {
    meta: {
      title: "후쿠오카 · 유후인 · 벳푸 가족여행",
      subtitle: "3박 4일 규슈 가족 여행 대시보드",
      dateRange: "2026.11.06(금) ~ 2026.11.09(월)",
      nights: 3, days: 4,
      region: "후쿠오카 · 유후인 · 벳푸 · 아소 (규슈, 일본)"
    },
    FOOTNOTES: FOOTNOTES,
    CATEGORIES: CATEGORIES,
    PREPAID: PREPAID,
    LODGING: LODGING,
    DAYS: DAYS,
    HERO_IMAGE: HERO_IMAGE,
    wmThumb: wmThumb,
    mapLink: mapLink,
    allItems: allItems,
    plannedByCategory: plannedByCategory,
    plannedTotal: plannedTotal,
    plannedTotalByDate: plannedTotalByDate,
    dayLabel: dayLabel
  };
})(window);
