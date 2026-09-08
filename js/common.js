/* ==========================================================================
   공통 스크립트: 다크모드 토글, 햄버거 메뉴, 툴팁(모바일 탭 지원), 숫자 포맷
   ========================================================================== */

(function () {
  "use strict";

  var THEME_KEY = "fukuoka-trip-theme";

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function storeTheme(v) {
    try { localStorage.setItem(THEME_KEY, v); } catch (e) { /* noop */ }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === "dark" || theme === "light") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    updateThemeIcon();
  }

  function currentEffectiveTheme() {
    var attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function updateThemeIcon() {
    var btn = document.getElementById("themeToggleBtn");
    if (!btn) return;
    var isDark = currentEffectiveTheme() === "dark";
    btn.innerHTML = (window.ICONS && ICONS[isDark ? "sun" : "moon"]) || "";
    btn.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
  }

  function toggleTheme() {
    var next = currentEffectiveTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
  }

  function initTheme() {
    var stored = getStoredTheme();
    if (stored) applyTheme(stored);
    else updateThemeIcon();
    var btn = document.getElementById("themeToggleBtn");
    if (btn) btn.addEventListener("click", toggleTheme);
  }

  function initDrawer() {
    var openBtn = document.getElementById("hamburgerBtn");
    var drawer = document.getElementById("navDrawer");
    var scrim = document.getElementById("navScrim");
    if (!openBtn || !drawer || !scrim) return;

    function open() {
      drawer.classList.add("open");
      scrim.classList.add("open");
      openBtn.setAttribute("aria-expanded", "true");
    }
    function close() {
      drawer.classList.remove("open");
      scrim.classList.remove("open");
      openBtn.setAttribute("aria-expanded", "false");
    }
    openBtn.addEventListener("click", function () {
      drawer.classList.contains("open") ? close() : open();
    });
    scrim.addEventListener("click", close);
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  // Tooltip: hover works via CSS; this adds tap-to-toggle support for touch devices.
  // Uses event delegation on document so it also works for tooltips injected
  // later by page-specific scripts (e.g. day.js renders the timeline after
  // this listener is registered).
  function initTooltips() {
    document.addEventListener("click", function (e) {
      var tip = e.target.closest ? e.target.closest(".tip") : null;
      if (tip) {
        e.stopPropagation();
        var wasOpen = tip.classList.contains("tip-open");
        document.querySelectorAll(".tip.tip-open").forEach(function (t) { t.classList.remove("tip-open"); });
        if (!wasOpen) tip.classList.add("tip-open");
      } else {
        document.querySelectorAll(".tip.tip-open").forEach(function (t) { t.classList.remove("tip-open"); });
      }
    });
  }

  function markActiveNav() {
    var path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav-link]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
    });
  }

  // 맨 위로 이동 버튼: 일정 스크롤 이후 노출
  function initBackToTop() {
    var btn = document.getElementById("backToTopBtn");
    if (!btn) return;
    var SHOW_AT = 480;
    function onScroll() {
      if (window.scrollY > SHOW_AT) btn.classList.add("visible");
      else btn.classList.remove("visible");
    }
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Utilities exposed globally for page scripts
  window.TripUtil = {
    formatKRW: function (n) {
      if (n === null || n === undefined || isNaN(n)) return "-";
      return "₩" + Math.round(n).toLocaleString("ko-KR");
    },
    formatJPY: function (n) {
      if (n === null || n === undefined || isNaN(n)) return "-";
      return "¥" + Math.round(n).toLocaleString("ja-JP");
    },
    escapeHtml: function (s) {
      return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    tip: function (text) {
      return '<span class="tip" tabindex="0">?<span class="tip-bubble">' + this.escapeHtml(text) + '</span></span>';
    },
    // 사전 결제(선결제) 항목: budget.html에서 편집한 내용을 브라우저에 저장해
    // index.html / budget.html 양쪽에서 동일하게 읽어옵니다. 저장된 값이
    // 없으면 data.js의 기본 시드값(TripData.PREPAID)을 복제해 반환합니다.
    PREPAID_KEY: "fukuoka-trip-prepaid-v1",
    loadPrepaid: function () {
      var list;
      try {
        var raw = localStorage.getItem(this.PREPAID_KEY);
        if (raw) list = JSON.parse(raw);
      } catch (e) { /* noop */ }
      if (!list) {
        try {
          list = JSON.parse(JSON.stringify((window.TripData && window.TripData.PREPAID) || []));
        } catch (e) { list = []; }
      }
      // 예전에 저장된 항목에 남아있을 수 있는 flag(확인 필요 안내)는 data.js에서
      // 이미 해소된 것으로 간주하고 화면에는 표시하지 않습니다.
      list.forEach(function (p) { if (p && p.flag) delete p.flag; });
      return list;
    },
    savePrepaid: function (list) {
      try { localStorage.setItem(this.PREPAID_KEY, JSON.stringify(list)); } catch (e) { /* noop */ }
      if (window.TripCloud && window.TripCloud.enabled) window.TripCloud.set("prepaid", list);
    },
    resetPrepaid: function () {
      try { localStorage.removeItem(this.PREPAID_KEY); } catch (e) { /* noop */ }
      if (window.TripCloud && window.TripCloud.enabled) {
        window.TripCloud.set("prepaid", JSON.parse(JSON.stringify((window.TripData && window.TripData.PREPAID) || [])));
      }
    },
    // 계획 총 예산(카테고리별) 수동 조정값. 값이 없는 카테고리는 자동 계산값
    // (일정 데이터 + 사전결제 합계)을 그대로 사용합니다.
    BUDGET_OVERRIDE_KEY: "fukuoka-trip-budget-overrides-v1",
    loadBudgetOverrides: function () {
      try { return JSON.parse(localStorage.getItem(this.BUDGET_OVERRIDE_KEY) || "{}"); } catch (e) { return {}; }
    },
    saveBudgetOverrides: function (obj) {
      try { localStorage.setItem(this.BUDGET_OVERRIDE_KEY, JSON.stringify(obj)); } catch (e) { /* noop */ }
      if (window.TripCloud && window.TripCloud.enabled) window.TripCloud.set("budgetOverrides", obj);
    },
    // 클라우드(Firebase)가 설정되어 있으면 path의 값을 실시간 구독하고, 변경될
    // 때마다 onChange(cloudValue)를 호출합니다. 클라우드가 아직 비어있으면(이
    // 프로젝트를 처음 쓰는 경우) getLocalValue()의 현재 값을 한 번 올려 기준값으로
    // 삼습니다. 클라우드가 설정되어 있지 않으면 아무 것도 하지 않고 빈 해제 함수를
    // 반환합니다(기존 localStorage 전용 동작 그대로 유지).
    cloudSync: function (path, getLocalValue, onChange) {
      if (!window.TripCloud || !window.TripCloud.enabled) return function () { /* noop */ };
      return window.TripCloud.sync(path, getLocalValue, onChange);
    },
    // 카테고리별 "계획" 금액: 수동 조정값이 있으면 그 값, 없으면 자동 계산값(TripData.plannedByCategory)
    mergedPlannedByCategory: function (prepaidList) {
      var TD = window.TripData;
      if (!TD) return {};
      var base = TD.plannedByCategory(prepaidList);
      var overrides = this.loadBudgetOverrides();
      var merged = {};
      TD.CATEGORIES.forEach(function (c) {
        var ov = overrides[c.key];
        merged[c.key] = (ov !== undefined && ov !== null && ov !== "") ? Number(ov) : (base[c.key] || 0);
      });
      return merged;
    },
    mergedPlannedTotal: function (prepaidList) {
      var merged = this.mergedPlannedByCategory(prepaidList);
      var t = 0;
      Object.keys(merged).forEach(function (k) { t += merged[k] || 0; });
      return t;
    },
    catChip: function (catKey) {
      var cat = (window.TripData && window.TripData.CATEGORIES || []).find(function (c) { return c.key === catKey; });
      var label = cat ? cat.label : catKey;
      var cls = cat ? cat.cls : "cat-기타";
      return '<span class="cat-chip ' + cls + '"><span class="cat-dot"></span>' + this.escapeHtml(label) + '</span>';
    },
    // ids: ordered array of FOOTNOTES keys referenced on the page.
    // Returns { html, idIndex } where idIndex maps key -> displayed number.
    renderFootnotes: function (ids) {
      if (!window.TripData) return { html: "", idIndex: {} };
      var FN = window.TripData.FOOTNOTES;
      var seen = [], idIndex = {};
      ids.forEach(function (key) {
        if (FN[key] && idIndex[key] === undefined) {
          idIndex[key] = seen.length + 1;
          seen.push(key);
        }
      });
      if (!seen.length) return { html: "", idIndex: idIndex };
      var lis = seen.map(function (key, i) {
        var f = FN[key];
        return '<li id="fn' + (i + 1) + '">' + this.escapeHtml(f.label) +
          ' — <a href="' + f.url + '" target="_blank" rel="noopener">' + f.url + '</a></li>';
      }, this).join("");
      var html = '<div class="footnotes"><h3>출처 및 참고자료</h3><ol>' + lis + '</ol></div>';
      return { html: html, idIndex: idIndex };
    },
    fnRef: function (idIndex, key) {
      if (!idIndex || idIndex[key] === undefined) return "";
      return '<a class="fn-ref" href="#fn' + idIndex[key] + '">[' + idIndex[key] + ']</a>';
    },
    // 동적으로 생성하는 HTML 문자열 안에 넣을 아이콘 placeholder
    icon: function (name, extraClass) {
      return '<span class="icon' + (extraClass ? " " + extraClass : "") + '" data-icon="' + name + '"></span>';
    },
    // [data-icon] placeholder들을 실제 SVG로 채움. 여러 번 호출해도 안전(idempotent).
    hydrateIcons: function (root) {
      if (!window.ICONS) return;
      (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
        var name = el.getAttribute("data-icon");
        if (ICONS[name]) el.innerHTML = ICONS[name];
      });
    },
    // 스크롤 연동 패럴럭스 배경. sectionEl은 뷰포트 대비 위치를 재는 컨테이너,
    // bgEl은 그 안에서 translateY로 움직일 배경 레이어(컨테이너보다 커야 함).
    bindParallax: function (sectionEl, bgEl, opts) {
      if (!sectionEl || !bgEl) return;
      opts = opts || {};
      var speed = opts.speed || 0.3;
      var slackRatio = opts.slackRatio || 0.18;
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      var ticking = false;
      function update() {
        ticking = false;
        var rect = sectionEl.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        var slack = sectionEl.offsetHeight * slackRatio;
        var translate = Math.max(-slack, Math.min(slack, -rect.top * speed));
        bgEl.style.transform = "translateY(" + translate.toFixed(1) + "px)";
      }
      function onScroll() {
        if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      update();
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initDrawer();
    initTooltips();
    initBackToTop();
    markActiveNav();
    window.TripUtil.hydrateIcons();
  });

  // Apply theme ASAP (before DOMContentLoaded) to avoid flash of wrong theme
  applyTheme(getStoredTheme());
})();
