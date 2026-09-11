/* ==========================================================================
   맛집 · 먹거리 가이드 페이지 (food.html) 렌더링
   데이터 출처: js/data.js TripData.FOOD_AREAS
   ========================================================================== */
(function () {
  "use strict";
  var TD = window.TripData, TU = window.TripUtil;
  if (!TD || !TU) return;

  // 먹거리 구분 칩: 예산 카테고리 칩(.cat-chip)과 동일한 흑백+파스텔 점 스타일 재사용
  var TYPE_META = {
    "특산품": { cls: "cat-관광지", label: "특산품" },
    "간식": { cls: "cat-간식", label: "간식" },
    "점심": { cls: "cat-편의점", label: "점심 · 500~1,000엔" },
    "저녁": { cls: "cat-식사", label: "저녁 · 1,000~2,000엔" }
  };

  function typeChip(type, short) {
    var m = TYPE_META[type] || { cls: "cat-기타", label: type };
    return '<span class="cat-chip ' + m.cls + '"><span class="cat-dot"></span>' + TU.escapeHtml(short ? type : m.label) + '</span>';
  }

  function renderLegend() {
    var el = document.getElementById("foodLegend");
    if (!el) return;
    el.innerHTML = Object.keys(TYPE_META).map(function (t) {
      return '<span class="pill">' + typeChip(t) + '</span>';
    }).join("");
    TU.hydrateIcons(el);
  }

  function collectSourceIds(areas) {
    var ids = [];
    areas.forEach(function (area) {
      area.items.forEach(function (it) {
        (it.sourceIds || []).forEach(function (s) { if (ids.indexOf(s) === -1) ids.push(s); });
      });
    });
    return ids;
  }

  function foodCardHtml(it, idIndex) {
    var photoHtml = it.photo
      ? '<img class="tl-card-photo" src="' + it.photo + '" alt="' + TU.escapeHtml(it.name) + '" loading="lazy" onerror="this.style.display=\'none\';">' +
        (it.photoCredit ? '<div class="photo-credit">사진: <a href="' + it.photoCreditUrl + '" target="_blank" rel="noopener">' + TU.escapeHtml(it.photoCredit) + '</a></div>' : '')
      : '';
    var mapHtml = it.map ? ' · <a href="' + TD.mapLink(it.map) + '" target="_blank" rel="noopener">지도 보기 ↗</a>' : '';
    var srcHtml = (it.sourceIds || []).map(function (s) { return TU.fnRef(idIndex, s); }).join("");
    return (
      '<div class="tl-card food-card">' +
        photoHtml +
        '<div class="tl-card-body">' +
          '<h4>' + TU.escapeHtml(it.name) + (it.tip ? ' ' + TU.tip(it.tip) : '') + '</h4>' +
          '<div class="tl-loc">' + TU.icon("map-pin") + ' ' + TU.escapeHtml(it.shop) + mapHtml + '</div>' +
          '<div class="tl-desc">' + TU.escapeHtml(it.desc) + srcHtml + '</div>' +
          '<div class="tl-card-foot">' + typeChip(it.type, true) + '<span class="tl-price">' + TU.escapeHtml(it.price) + '</span></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderAreas() {
    var container = document.getElementById("foodAreas");
    if (!container) return;
    var areas = TD.FOOD_AREAS || [];

    var fn = TU.renderFootnotes(collectSourceIds(areas));
    var fnEl = document.getElementById("fnContainer");
    if (fnEl) fnEl.innerHTML = fn.html;

    container.innerHTML = areas.map(function (area, idx) {
      var photoHtml = area.photo
        ? '<div class="day-hero-photo food-area-photo" id="foodPhoto' + idx + '">' +
            '<div class="day-hero-photo-bg" id="foodPhotoBg' + idx + '" style="background-image:url(&quot;' + area.photo + '&quot;)"></div>' +
            (area.photoCredit ? '<div class="day-hero-photo-credit">사진: <a href="' + area.photoCreditUrl + '" target="_blank" rel="noopener">' + TU.escapeHtml(area.photoCredit) + '</a></div>' : '') +
          '</div>'
        : '';
      var cardsHtml = '<div class="grid grid-3">' + area.items.map(function (it) { return foodCardHtml(it, fn.idIndex); }).join("") + '</div>';
      return (
        '<section class="section" id="area-' + area.id + '">' +
          '<div class="section-head">' +
            '<h2>' + TU.icon("utensils") + ' ' + TU.escapeHtml(area.title) + '</h2>' +
            '<span class="section-desc">' + TU.escapeHtml(area.dayLabelText) + (area.desc ? ' · ' + TU.escapeHtml(area.desc) : '') + '</span>' +
          '</div>' +
          photoHtml +
          cardsHtml +
        '</section>'
      );
    }).join("");

    TU.hydrateIcons(container);

    areas.forEach(function (area, idx) {
      if (!area.photo) return;
      var box = document.getElementById("foodPhoto" + idx);
      var bg = document.getElementById("foodPhotoBg" + idx);
      TU.bindParallax(box, bg, { speed: 0.22, slackRatio: 0.14 });
    });
  }

  function safe(fn, label) {
    try { fn(); } catch (e) { console.error("[food.js] " + label + " failed:", e); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(renderLegend, "renderLegend");
    safe(renderAreas, "renderAreas");
  });
})();
