/* ==========================================================================
   공통 레이아웃(헤더/햄버거 메뉴/푸터) 주입 스크립트
   각 페이지의 <body> 최상단에 <div id="siteHeader"></div>,
   최하단 <div id="siteFooter"></div> 를 두면 이 스크립트가 내용을 채웁니다.
   ========================================================================== */
(function () {
  "use strict";

  var NAV_LINKS = [
    { href: "index.html", label: "홈" },
    { href: "day1.html", label: "Day 1" },
    { href: "day2.html", label: "Day 2" },
    { href: "day3.html", label: "Day 3" },
    { href: "day4.html", label: "Day 4" },
    { href: "budget.html", label: "예산·비용" },
    { href: "info.html", label: "여행 정보" }
  ];

  function buildHeader() {
    var desktopLinks = NAV_LINKS.map(function (l) {
      return '<a href="' + l.href + '" data-nav-link>' + l.label + '</a>';
    }).join("");

    var drawerLinks = NAV_LINKS.map(function (l) {
      return '<a href="' + l.href + '" data-nav-link>' + l.label + '</a>';
    }).join("");

    return (
      '<header class="site-header">' +
        '<div class="site-header-inner">' +
          '<a class="brand" href="index.html"><span class="brand-mark"><span class="icon" data-icon="plane"></span></span>후쿠오카 가족여행</a>' +
          '<nav class="nav-desktop">' + desktopLinks + '</nav>' +
          '<div class="header-actions">' +
            '<button id="themeToggleBtn" class="icon-btn" aria-label="다크 모드 전환"><span class="icon" data-icon="moon"></span></button>' +
            '<button id="hamburgerBtn" class="icon-btn hamburger-btn" aria-label="메뉴 열기" aria-expanded="false"><span class="icon" data-icon="menu-lines"></span></button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<div id="navScrim" class="scrim"></div>' +
      '<nav id="navDrawer" class="nav-drawer">' +
        '<div class="drawer-section">메뉴</div>' +
        drawerLinks +
      '</nav>'
    );
  }

  function buildFooter() {
    return (
      '<footer class="site-footer">' +
        '후쿠오카 · 유후인 · 벳푸 가족여행 대시보드 · 2026.11.06–11.09<br>' +
        '데이터 출처: Google Sheets 원본 일정 및 각 페이지 하단 출처 참고 · 개인 여행용으로 제작됨' +
      '</footer>'
    );
  }

  function buildBackToTop() {
    return '<button id="backToTopBtn" class="back-to-top" aria-label="맨 위로 이동"><span class="icon" data-icon="arrow-up"></span></button>';
  }

  var hEl = document.getElementById("siteHeader");
  if (hEl) hEl.outerHTML = buildHeader();
  var fEl = document.getElementById("siteFooter");
  if (fEl) fEl.outerHTML = buildFooter();

  document.body.insertAdjacentHTML("beforeend", buildBackToTop());
  if (window.TripUtil) window.TripUtil.hydrateIcons();
})();
