(function () {
  "use strict";
  var TD = window.TripData, TU = window.TripUtil;
  var catChartInst, dailyLineChartInst;

  // ---------------- 패럴럭스 히어로 배너 ----------------
  function initHeroParallax() {
    var section = document.getElementById("heroParallax");
    var bg = document.getElementById("heroParallaxBg");
    var creditEl = document.getElementById("heroParallaxCredit");
    if (!section || !bg) return;

    var img = TD.HERO_IMAGE;
    if (img && img.src) {
      bg.style.backgroundImage = 'url("' + img.src + '")';
      if (creditEl && img.credit) {
        creditEl.innerHTML = '사진: <a href="' + img.creditUrl + '" target="_blank" rel="noopener">' + TU.escapeHtml(img.credit) + '</a>';
      }
    }
    TU.bindParallax(section, bg, { speed: 0.35, slackRatio: 0.18 });
  }

  function renderDayCards() {
    var grid = document.getElementById("dayCardGrid");
    var totals = TD.plannedTotalByDate();
    grid.innerHTML = TD.DAYS.map(function (d) {
      var total = totals[d.date] || 0;
      return (
        '<a class="card day-card" href="day' + d.id + '.html">' +
          '<div class="day-card-tag">' + TD.dayLabel(d) + '</div>' +
          '<h3>' + TU.escapeHtml(d.title) + '</h3>' +
          '<div class="day-card-desc">' + TU.escapeHtml(d.summary) + '</div>' +
          '<div class="day-card-foot"><span>' + d.items.length + '개 일정</span><span>' + TU.formatKRW(total) + '</span></div>' +
        '</a>'
      );
    }).join("");
  }

  function renderStats() {
    var grid = document.getElementById("statGrid");
    var prepaidList = TU.loadPrepaid();
    var total = TU.mergedPlannedTotal(prepaidList);
    var prepaidSum = prepaidList.reduce(function (s, p) { return s + (p.price || 0); }, 0);
    var paidSum = prepaidList.filter(function (p) { return p.status === "paid"; }).reduce(function (s, p) { return s + (p.price || 0); }, 0);
    var pendingSum = prepaidSum - paidSum;
    var onsite = total - prepaidSum;

    var stats = [
      { label: "전체 예정 비용 합계", value: TU.formatKRW(total), sub: "사전결제 + 현지 예정 지출" },
      { label: "사전 결제 완료", value: TU.formatKRW(paidSum), sub: "실제 결제가 끝난 항목" },
      { label: "사전 결제 예정", value: TU.formatKRW(pendingSum), sub: "숙소 · 렌터카 등 결제 대기 항목" },
      { label: "현지 예정 지출", value: TU.formatKRW(onsite), sub: "식사 · 입장료 · 주유 등" }
    ];
    grid.innerHTML = stats.map(function (s) {
      return '<div class="card stat-card"><div class="stat-label">' + s.label + '</div><div class="stat-value">' + s.value + '</div><div class="stat-sub">' + s.sub + '</div></div>';
    }).join("");

    var flagged = prepaidList.filter(function (p) { return p.flag; });
    var cb = document.getElementById("flightFlagCallout");
    if (flagged.length) {
      cb.innerHTML = flagged.map(function (p) {
        return TU.icon("alert-triangle") + ' <strong>' + TU.escapeHtml(p.activity) + '</strong> 금액 확인 필요 — ' + TU.escapeHtml(p.flag);
      }).join("<br>");
      TU.hydrateIcons(cb);
    } else {
      cb.style.display = "none";
    }
  }

  function renderCharts() {
    if (typeof Chart === "undefined") {
      ["catChart", "dailyLineChart"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.innerHTML = '<p class="muted" style="font-size:12.5px;">차트 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.</p>';
      });
      return;
    }
    var byCat = TU.mergedPlannedByCategory(TU.loadPrepaid());
    var labels = TD.CATEGORIES.map(function (c) { return c.label; });
    var values = TD.CATEGORIES.map(function (c) { return byCat[c.key] || 0; });
    var colors = ["#7fa9d8","#6f9bcb","#a79bd0","#9fbfd8","#cf9aa4","#d8b27f","#7fb99a","#e0c68f","#b9bac0"];

    var isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.hasAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var gridColor = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)";
    var tickColor = isDark ? "#b7b8bf" : "#55565c";

    if (catChartInst) catChartInst.destroy();
    catChartInst = new Chart(document.getElementById("catChart"), {
      type: "bar",
      data: { labels: labels, datasets: [{ label: "계획 비용(KRW)", data: values, backgroundColor: colors, borderRadius: 6, maxBarThickness: 34 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (ctx) { return "₩" + ctx.parsed.y.toLocaleString("ko-KR"); } } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, callback: function (v) { return (v / 10000) + "만"; } } }
        }
      }
    });

    var dayTotals = TD.plannedTotalByDate();
    var dayLabels = TD.DAYS.map(function (d) { return "Day " + d.id; });
    var dayValues = TD.DAYS.map(function (d) { return dayTotals[d.date] || 0; });
    var cum = []; var run = 0;
    dayValues.forEach(function (v) { run += v; cum.push(run); });

    if (dailyLineChartInst) dailyLineChartInst.destroy();
    dailyLineChartInst = new Chart(document.getElementById("dailyLineChart"), {
      type: "line",
      data: {
        labels: dayLabels,
        datasets: [
          { label: "일별 지출", data: dayValues, borderColor: "#7fa9d8", backgroundColor: "rgba(127,169,216,.25)", tension: 0, pointRadius: 4, borderWidth: 2 },
          { label: "누적 지출", data: cum, borderColor: "#7fb99a", backgroundColor: "rgba(127,185,154,.15)", tension: 0, pointRadius: 4, borderWidth: 2, borderDash: [5, 4] }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: tickColor, boxWidth: 10, font: { size: 11 } } },
          tooltip: { callbacks: { label: function (ctx) { return ctx.dataset.label + ": ₩" + ctx.parsed.y.toLocaleString("ko-KR"); } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, callback: function (v) { return (v / 10000) + "만"; } } }
        }
      }
    });
  }

  function renderDayDetailGrid() {
    var grid = document.getElementById("dayDetailGrid");
    grid.innerHTML = TD.DAYS.map(function (d) {
      var firstPhoto = d.hero;
      var items = d.items.slice(0, 3).map(function (it) {
        return '<li>' + it.start + ' · ' + TU.escapeHtml(it.activity) + '</li>';
      }).join("");
      return (
        '<div class="card" style="padding:0;overflow:hidden;">' +
          (firstPhoto ? '<img class="tl-card-photo" style="aspect-ratio:16/8;" src="' + firstPhoto + '" alt="' + TU.escapeHtml(d.title) + '" loading="lazy" onerror="this.style.display=\'none\';">' : '') +
          '<div style="padding:16px 18px;">' +
            '<div class="day-card-tag">' + TD.dayLabel(d) + '</div>' +
            '<h3 style="margin:4px 0 8px;font-size:16px;">' + TU.escapeHtml(d.title) + '</h3>' +
            '<ul style="margin:0 0 12px;padding-left:18px;font-size:12.5px;color:var(--text-2);">' + items + '</ul>' +
            '<a class="btn btn-sm" href="day' + d.id + '.html">전체 일정 보기 →</a>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function renderFootnotes() {
    var ids = ["heroImage", "sheet", "dazaifu", "kinrin", "oyamadam"];
    var r = TU.renderFootnotes(ids);
    document.getElementById("fnContainer").innerHTML = r.html;
  }

  function safe(fn, label) {
    try { fn(); } catch (e) { console.error("[index.js] " + label + " failed:", e); }
  }

  // budget.html에서 입력한 사전결제/계획예산이 클라우드(Firebase)에 연동되어
  // 있으면, 다른 기기에서의 변경사항도 이 페이지 통계·차트에 실시간 반영합니다.
  function initCloudSync() {
    TU.cloudSync("prepaid", function () { return TU.loadPrepaid(); }, function (cloudList) {
      try { localStorage.setItem(TU.PREPAID_KEY, JSON.stringify(cloudList || [])); } catch (e) { /* noop */ }
      safe(renderStats, "renderStats");
      safe(renderCharts, "renderCharts");
    });
    TU.cloudSync("budgetOverrides", function () { return TU.loadBudgetOverrides(); }, function (cloudObj) {
      try { localStorage.setItem(TU.BUDGET_OVERRIDE_KEY, JSON.stringify(cloudObj || {})); } catch (e) { /* noop */ }
      safe(renderStats, "renderStats");
      safe(renderCharts, "renderCharts");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(initHeroParallax, "initHeroParallax");
    safe(renderDayCards, "renderDayCards");
    safe(renderStats, "renderStats");
    safe(renderCharts, "renderCharts");
    safe(renderDayDetailGrid, "renderDayDetailGrid");
    safe(renderFootnotes, "renderFootnotes");
    safe(initCloudSync, "initCloudSync");
  });
})();
