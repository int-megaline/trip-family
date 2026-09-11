/* ==========================================================================
   모노톤 라인 아이콘 세트 (검은색/흰색 단색, currentColor 상속)
   사용법: <span class="icon" data-icon="calendar"></span> 를 마크업에 두면
   common.js의 TripUtil.hydrateIcons() 가 innerHTML을 채워줍니다.
   동적으로 생성되는 문자열에서는 TripUtil.icon('calendar') 헬퍼를 사용하세요.
   ========================================================================== */
(function (global) {
  "use strict";

  function svg(inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">' + inner + '</svg>';
  }

  var ICONS = {
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2.2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>'),
    "map-pin": svg('<path d="M12 21s-7-7.4-7-12.4a7 7 0 0 1 14 0C19 13.6 12 21 12 21z"/><circle cx="12" cy="8.6" r="2.4"/>'),
    car: svg('<path d="M5 11l1.4-4.4A2 2 0 0 1 8.3 5.2h7.4a2 2 0 0 1 1.9 1.4L19 11"/><rect x="3" y="11" width="18" height="6.2" rx="2"/><circle cx="7.5" cy="17.3" r="1.4"/><circle cx="16.5" cy="17.3" r="1.4"/>'),
    money: svg('<rect x="2" y="6" width="20" height="12" rx="2.2"/><circle cx="12" cy="12" r="3"/><line x1="5.5" y1="9" x2="5.5" y2="9"/><line x1="18.5" y1="15" x2="18.5" y2="15"/>'),
    map: svg('<path d="M9 3 3 5.2v15.8l6-2.2 6 2.2 6-2.2V2.8l-6 2.2-6-2z"/><line x1="9" y1="3" x2="9" y2="19"/><line x1="15" y1="5.2" x2="15" y2="21"/>'),
    suitcase: svg('<rect x="3" y="8" width="18" height="12" rx="2.2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="3" y1="13.5" x2="21" y2="13.5"/>'),
    thermometer: svg('<path d="M12 14.8V4.5a2.2 2.2 0 1 0-4.4 0v10.3a4.3 4.3 0 1 0 4.4 0z"/><line x1="12" y1="8" x2="12" y2="8"/>'),
    wifi: svg('<path d="M2.5 8.8a15.5 15.5 0 0 1 19 0"/><path d="M5.8 12.6a10.8 10.8 0 0 1 12.4 0"/><path d="M9 16.3a5.6 5.6 0 0 1 6 0"/><circle cx="12" cy="19.6" r="1" fill="currentColor" stroke="none"/>'),
    droplet: svg('<path d="M12 3s6.2 7.2 6.2 11.6A6.2 6.2 0 0 1 5.8 14.6C5.8 10.2 12 3 12 3z"/>'),
    "alert-triangle": svg('<path d="M12 3 2 20.2h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="17.6" r="0.7" fill="currentColor" stroke="none"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>'),
    list: svg('<line x1="8.5" y1="6" x2="21" y2="6"/><line x1="8.5" y1="12" x2="21" y2="12"/><line x1="8.5" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="0.9" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="0.9" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="0.9" fill="currentColor" stroke="none"/>'),
    "bar-chart": svg('<line x1="5" y1="20" x2="5" y2="11.5"/><line x1="12" y1="20" x2="12" y2="5.5"/><line x1="19" y1="20" x2="19" y2="15"/>'),
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4.2 1.2L4 16 16.5 3.5z"/>'),
    download: svg('<path d="M12 3v12.5"/><polyline points="7 11.5 12 16.5 17 11.5"/><path d="M5 20h14"/>'),
    upload: svg('<path d="M12 20.5V8"/><polyline points="7 12 12 7 17 12"/><path d="M5 20.5h14"/>'),
    smartphone: svg('<rect x="6.5" y="2" width="11" height="20" rx="2.2"/><line x1="11" y1="18.2" x2="13" y2="18.2"/>'),
    sun: svg('<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="3.5" y1="12" x2="1.5" y2="12"/><line x1="22.5" y1="12" x2="20.5" y2="12"/><line x1="4.9" y1="4.9" x2="6.6" y2="6.6"/><line x1="17.4" y1="17.4" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="6.6" y2="17.4"/><line x1="17.4" y1="6.6" x2="19.1" y2="4.9"/>'),
    moon: svg('<path d="M20.2 14.8A8.6 8.6 0 1 1 9.2 3.8a7.1 7.1 0 0 0 11 11z"/>'),
    "arrow-up": svg('<line x1="12" y1="19.5" x2="12" y2="5"/><polyline points="5.5 11.5 12 5 18.5 11.5"/>'),
    "menu-lines": svg('<line x1="3.5" y1="6.5" x2="20.5" y2="6.5"/><line x1="3.5" y1="12" x2="20.5" y2="12"/><line x1="3.5" y1="17.5" x2="20.5" y2="17.5"/>'),
    plane: svg('<path d="M21.5 2.5 10.6 13.4"/><path d="M21.5 2.5 14.8 21.5l-4-8.1-8.1-4L21.5 2.5z"/>'),
    home: svg('<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10"/><path d="M10 20.5V14h4v6.5"/>'),
    "external-link": svg('<path d="M14 3h7v7"/><path d="M21 3 10 14"/><path d="M20 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6"/>'),
    "check-circle": svg('<circle cx="12" cy="12" r="9"/><polyline points="7.5 12.5 10.5 15.5 16.5 9"/>'),
    circle: svg('<circle cx="12" cy="12" r="9"/>'),
    "chevron-down": svg('<polyline points="6 9 12 15 18 9"/>'),
    "x-circle": svg('<circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>'),
    utensils: svg('<path d="M7 3v7a2 2 0 0 0 2 2v9"/><path d="M7 3v5M10 3v5"/><path d="M17 3c-1.7 0-3 2-3 5.5S15.3 12 17 12v9"/>')
  };

  global.ICONS = ICONS;
})(window);
