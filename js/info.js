(function () {
  "use strict";
  var TD = window.TripData, TU = window.TripUtil;

  function fmtDate(d) {
    return d.slice(5).replace("-", ".");
  }

  function renderLodging() {
    var grid = document.getElementById("lodgingGrid");
    if (!grid || !TD.LODGING) return;
    grid.innerHTML = TD.LODGING.map(function (l) {
      var bookingHtml = l.bookingUrl
        ? '<a class="btn btn-sm" href="' + l.bookingUrl + '" target="_blank" rel="noopener">' + TU.icon("external-link") + ' ' + TU.escapeHtml(l.bookingLabel || "예약 페이지") + '</a>'
        : '';
      var mapHtml = l.map ? '<a class="btn btn-sm" href="' + TD.mapLink(l.map) + '" target="_blank" rel="noopener">' + TU.icon("map-pin") + ' 지도에서 보기</a>' : '';
      return (
        '<div class="card lodging-card">' +
          '<div class="lodging-city">' + TU.icon("home") + ' ' + TU.escapeHtml(l.city) + '</div>' +
          '<h3>' + TU.escapeHtml(l.name) + '</h3>' +
          '<div class="lodging-dates">' +
            '<span class="pill">' + TU.icon("calendar") + ' ' + fmtDate(l.checkin) + ' – ' + fmtDate(l.checkout) + '</span>' +
            '<span class="pill">' + l.nights + '박</span>' +
          '</div>' +
          (l.note ? '<p>' + TU.escapeHtml(l.note) + '</p>' : '') +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + bookingHtml + mapHtml + '</div>' +
        '</div>'
      );
    }).join("");
    TU.hydrateIcons(grid);
  }

  function safe(fn, label) {
    try { fn(); } catch (e) { console.error("[info.js] " + label + " failed:", e); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(renderLodging, "renderLodging");
    var ids = ["weather", "driving", "mofa", "lodging"];
    var r = TU.renderFootnotes(ids);
    document.getElementById("fnContainer").innerHTML = r.html;
    document.getElementById("fnWeatherRef").innerHTML = TU.fnRef(r.idIndex, "weather");
    document.getElementById("fnDrivingRef").innerHTML = TU.fnRef(r.idIndex, "driving");
    document.getElementById("fnMofaRef").innerHTML = TU.fnRef(r.idIndex, "mofa");
  });
})();
