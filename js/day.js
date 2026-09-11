(function () {
  "use strict";
  var TD = window.TripData, TU = window.TripUtil;
  var dayId = window.DAY_ID;
  var day = TD.DAYS.find(function (d) { return d.id === dayId; });
  if (!day) return;

  function renderStrip() {
    var el = document.getElementById("dayStrip");
    el.innerHTML = TD.DAYS.map(function (d) {
      return '<a href="day' + d.id + '.html"' + (d.id === dayId ? ' class="active"' : '') + '>' + TD.dayLabel(d) + '</a>';
    }).join("") + '<a href="budget.html">' + TU.icon("money") + ' 예산·비용</a>';
    TU.hydrateIcons(el);
  }

  function renderHero() {
    document.title = TD.dayLabel(day) + " · " + day.title + " — 후쿠오카 가족여행";
    document.getElementById("dayHeroTag").textContent = TD.dayLabel(day) + " · " + day.date.replace(/-/g, ".");
    document.getElementById("dayHeroTitle").textContent = day.title;
    document.getElementById("dayHeroDesc").textContent = day.summary;

    var photoBox = document.getElementById("dayHeroPhoto");
    var photoBg = document.getElementById("dayHeroPhotoBg");
    var creditEl = document.getElementById("dayHeroPhotoCredit");
    if (day.hero && photoBox && photoBg) {
      photoBg.style.backgroundImage = 'url("' + day.hero + '")';
      if (creditEl && day.heroCredit) {
        creditEl.innerHTML = '사진: <a href="' + day.heroCreditUrl + '" target="_blank" rel="noopener">' + TU.escapeHtml(day.heroCredit) + '</a>';
      }
      TU.bindParallax(photoBox, photoBg, { speed: 0.28, slackRatio: 0.16 });
    } else if (photoBox) {
      photoBox.style.display = "none";
    }

    var totals = TD.plannedTotalByDate();
    document.getElementById("dayHeroTotal").textContent = TU.formatKRW(totals[day.date] || 0);
    document.getElementById("dayHeroCount").textContent = day.items.length + "개 일정";
  }

  function renderTimeline() {
    var el = document.getElementById("timeline");
    var sourceIds = ["sheet"];
    day.items.forEach(function (it) {
      (it.sourceIds || []).forEach(function (s) { if (sourceIds.indexOf(s) === -1) sourceIds.push(s); });
    });

    var fn = TU.renderFootnotes(sourceIds);
    document.getElementById("fnContainer").innerHTML = fn.html;

    el.innerHTML = day.items.map(function (it) {
      var photoHtml = it.photo
        ? '<img class="tl-card-photo" src="' + it.photo + '" alt="' + TU.escapeHtml(it.activity) + '" loading="lazy" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'none\';">' +
          (it.photoCredit ? '<div class="photo-credit">사진: <a href="' + it.photoCreditUrl + '" target="_blank" rel="noopener">' + TU.escapeHtml(it.photoCredit) + '</a></div>' : '')
        : '';
      var descHtml = it.desc
        ? '<div class="tl-desc">' + TU.escapeHtml(it.desc) + (it.sourceIds ? it.sourceIds.map(function (s) { return TU.fnRef(fn.idIndex, s); }).join("") : '') + '</div>'
        : '';
      var memoTip = it.memo ? TU.tip(it.memo) : '';
      var mapHtml = it.map ? ' · <a href="' + TD.mapLink(it.map) + '" target="_blank" rel="noopener">지도에서 보기 ↗</a>' : '';
      var foodHtml = it.foodRef ? '<a href="food.html#area-' + it.foodRef + '" class="tl-food-link">' + TU.icon("utensils") + ' 맛집·먹거리 보기 →</a>' : '';
      var priceHtml = it.price ? '<span class="tl-price">' + TU.formatKRW(it.price) + '</span>' : '<span class="muted" style="font-size:12px;">비용 없음 / 무료</span>';

      return (
        '<div class="tl-item">' +
          '<div class="tl-dot"></div>' +
          '<div class="tl-time">' + it.start + (it.end ? " – " + it.end : "") + ' · ' + it.duration + '</div>' +
          '<div class="tl-card">' +
            photoHtml +
            '<div class="tl-card-body">' +
              '<h4>' + TU.escapeHtml(it.activity) + ' ' + memoTip + '</h4>' +
              '<div class="tl-loc">' + TU.icon("map-pin") + ' ' + TU.escapeHtml(it.location) + mapHtml + '</div>' +
              descHtml +
              foodHtml +
              '<div class="tl-card-foot">' + TU.catChip(it.category) + priceHtml + '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join("");
    TU.hydrateIcons(el);
  }

  function renderPrevNext() {
    var el = document.getElementById("prevNext");
    var prev = dayId > 1 ? TD.DAYS.find(function (d) { return d.id === dayId - 1; }) : null;
    var next = dayId < TD.DAYS.length ? TD.DAYS.find(function (d) { return d.id === dayId + 1; }) : null;
    var prevHtml = prev
      ? '<a href="day' + prev.id + '.html"><div class="pn-label">← 이전</div><div class="pn-title">' + TD.dayLabel(prev) + '</div></a>'
      : '<a href="index.html"><div class="pn-label">← 이전</div><div class="pn-title">홈으로</div></a>';
    var nextHtml = next
      ? '<a href="day' + next.id + '.html" class="pn-next"><div class="pn-label">다음 →</div><div class="pn-title">' + TD.dayLabel(next) + '</div></a>'
      : '<a href="budget.html" class="pn-next"><div class="pn-label">다음 →</div><div class="pn-title">예산·비용 트래커</div></a>';
    el.innerHTML = prevHtml + nextHtml;
  }

  function safe(fn, label) {
    try { fn(); } catch (e) { console.error("[day.js] " + label + " failed:", e); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(renderStrip, "renderStrip");
    safe(renderHero, "renderHero");
    safe(renderTimeline, "renderTimeline");
    safe(renderPrevNext, "renderPrevNext");
  });
})();
