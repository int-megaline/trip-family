(function () {
  "use strict";
  var TD = window.TripData, TU = window.TripUtil;
  var STORE_KEY = "fukuoka-trip-expenses-v1";
  var FX_CACHE_KEY = "fukuoka-trip-fxcache-v1";
  var FALLBACK_RATE = 9.3; // 1 JPY -> KRW, 자동 조회 실패 시 대체값 (수동 편집 가능)

  var catChart, pieChart;

  // ---------------- localStorage helpers ----------------
  function loadExpenses() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveExpenses(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* noop */ }
  }
  function loadFxCache() {
    try { return JSON.parse(localStorage.getItem(FX_CACHE_KEY) || "{}"); } catch (e) { return {}; }
  }
  function saveFxCache(cache) {
    try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* noop */ }
  }

  var expenses = loadExpenses();
  var fxCache = loadFxCache();
  var prepaid = TU.loadPrepaid();

  // ---------------- FX rate fetch (Frankfurter API, ECB 기준) ----------------
  function getRateForDate(dateStr, cb) {
    if (fxCache[dateStr]) { cb(fxCache[dateStr], true); return; }
    var url = "https://api.frankfurter.app/" + dateStr + "?from=JPY&to=KRW";
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error("bad response");
      return r.json();
    }).then(function (data) {
      var rate = data && data.rates && data.rates.KRW;
      if (!rate) throw new Error("no rate");
      fxCache[dateStr] = rate;
      saveFxCache(fxCache);
      cb(rate, false);
    }).catch(function () {
      cb(FALLBACK_RATE, false, true);
    });
  }

  // ---------------- Form ----------------
  function initForm() {
    var catSelect = document.getElementById("f-cat");
    catSelect.innerHTML = TD.CATEGORIES.map(function (c) {
      return '<option value="' + c.key + '">' + c.label + '</option>';
    }).join("");

    var dateInput = document.getElementById("f-date");
    var jpyInput = document.getElementById("f-jpy");
    var krwInput = document.getElementById("f-krw");
    var fxTag = document.getElementById("fxRateTag");
    var fxStatus = document.getElementById("fxStatus");
    var currentRate = FALLBACK_RATE;

    function refreshRate() {
      fxTag.textContent = "(환율 조회 중…)";
      getRateForDate(dateInput.value, function (rate, fromCache, isFallback) {
        currentRate = rate;
        fxTag.textContent = "(1엔 ≈ " + rate.toFixed(2) + "원" + (isFallback ? ", 대체값" : "") + ")";
        fxStatus.textContent = isFallback
          ? "환율 자동 조회에 실패해 대체 환율(1엔≈" + FALLBACK_RATE + "원)을 사용했습니다. 네트워크 연결을 확인하거나 수동으로 계산해 주세요."
          : "환율 출처: Frankfurter Exchange Rates API (ECB 기준 " + dateInput.value + " 종가)" + (fromCache ? " · 캐시됨" : "");
        recalcKrw();
      });
    }
    function recalcKrw() {
      var jpy = parseFloat(jpyInput.value) || 0;
      krwInput.value = jpy ? TU.formatKRW(jpy * currentRate) : "";
    }

    dateInput.addEventListener("change", refreshRate);
    jpyInput.addEventListener("input", recalcKrw);
    refreshRate();

    document.getElementById("expenseForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var jpy = parseFloat(jpyInput.value) || 0;
      if (!jpy) return;
      expenses.push({
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        date: dateInput.value,
        category: catSelect.value,
        detail: document.getElementById("f-detail").value.trim(),
        jpy: jpy,
        rate: currentRate,
        krw: Math.round(jpy * currentRate),
        memo: document.getElementById("f-memo").value.trim()
      });
      saveExpenses(expenses);
      document.getElementById("f-detail").value = "";
      jpyInput.value = "";
      document.getElementById("f-memo").value = "";
      krwInput.value = "";
      renderAll();
    });
  }

  // ---------------- 사전 결제(선결제) 관리 ----------------
  var STATUS_LABEL = { paid: "결제 완료", pending: "결제 예정" };

  function renderPrepaid() {
    var tbody = document.getElementById("prepaidTbody");
    if (!tbody) return;
    // 참고: .table-wrap은 가로 스크롤을 위해 overflow-x:auto를 쓰는데, 이 경우
    // overflow-y도 사실상 auto로 취급되어(CSS 스펙) 테이블 안에 커스텀 툴팁
    // 말풍선(.tip)을 넣으면 day 페이지에서 고쳤던 것과 같은 방식으로 잘려
    // 보일 수 있습니다. 그래서 표 안에서는 네이티브 title 속성만 쓰고,
    // 전체 설명은 표 아래 콜아웃에 별도로 보여줍니다.
    var flagged = prepaid.filter(function (p) { return p.flag; });
    var flagBox = document.getElementById("prepaidFlagCallout");
    if (flagBox) {
      if (flagged.length) {
        flagBox.innerHTML = flagged.map(function (p) {
          return TU.icon("alert-triangle") + ' <strong>' + TU.escapeHtml(p.activity) + '</strong> — ' + TU.escapeHtml(p.flag);
        }).join("<br>");
        flagBox.style.display = "block";
        TU.hydrateIcons(flagBox);
      } else {
        flagBox.style.display = "none";
      }
    }

    tbody.innerHTML = prepaid.map(function (p) {
      var statusIcon = p.status === "paid" ? "check-circle" : "circle";
      var flagMark = p.flag ? ' <span class="icon" data-icon="alert-triangle" style="width:13px;height:13px;" title="' + TU.escapeHtml(p.flag) + '"></span>' : '';
      return (
        '<tr>' +
          '<td data-label="항목">' + TU.escapeHtml(p.activity) + flagMark + '</td>' +
          '<td data-label="카테고리">' + TU.catChip(p.category) + '</td>' +
          '<td data-label="금액">' + TU.formatKRW(p.price) + '</td>' +
          '<td data-label="상태"><span class="status-chip ' + p.status + '">' + TU.icon(statusIcon) + ' ' + STATUS_LABEL[p.status] + '</span></td>' +
          '<td data-label="메모" class="wrap">' + TU.escapeHtml(p.memo || "-") + '</td>' +
          '<td data-label=""><button class="btn btn-sm btn-danger" data-del-prepaid="' + p.id + '">삭제</button></td>' +
        '</tr>'
      );
    }).join("");
    TU.hydrateIcons(tbody);

    tbody.querySelectorAll("[data-del-prepaid]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        prepaid = prepaid.filter(function (p) { return p.id !== btn.getAttribute("data-del-prepaid"); });
        TU.savePrepaid(prepaid);
        renderPrepaid();
        renderStats();
      });
    });
  }

  function initPrepaid() {
    var catSelect = document.getElementById("p-cat");
    if (!catSelect) return;
    catSelect.innerHTML = TD.CATEGORIES.map(function (c) {
      return '<option value="' + c.key + '">' + c.label + '</option>';
    }).join("");

    document.getElementById("prepaidForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var price = parseFloat(document.getElementById("p-price").value) || 0;
      var activity = document.getElementById("p-activity").value.trim();
      if (!activity || !price) return;
      prepaid.push({
        id: "custom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        activity: activity,
        category: catSelect.value,
        price: price,
        status: document.getElementById("p-status").value,
        memo: document.getElementById("p-memo").value.trim()
      });
      TU.savePrepaid(prepaid);
      document.getElementById("p-activity").value = "";
      document.getElementById("p-price").value = "";
      document.getElementById("p-memo").value = "";
      renderPrepaid();
      renderStats();
      renderCharts();
    });

    var resetBtn = document.getElementById("prepaidResetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (!confirm("사전 결제 내역을 기본값으로 초기화할까요? 직접 추가/수정한 내용은 사라집니다.")) return;
        TU.resetPrepaid();
        prepaid = TU.loadPrepaid();
        renderAll();
      });
    }
  }

  // ---------------- Table ----------------
  function renderTable() {
    var tbody = document.getElementById("expenseTbody");
    var empty = document.getElementById("emptyState");
    var sorted = expenses.slice().sort(function (a, b) {
      return a.date === b.date ? 0 : (a.date < b.date ? -1 : 1);
    });

    if (!sorted.length) {
      tbody.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    var dayRunning = {}; var grandRunning = 0;
    var rows = sorted.map(function (e) {
      dayRunning[e.date] = (dayRunning[e.date] || 0) + e.krw;
      grandRunning += e.krw;
      return (
        '<tr>' +
          '<td data-label="날짜">' + e.date + '</td>' +
          '<td data-label="항목">' + TU.catChip(e.category) + '</td>' +
          '<td data-label="상세" class="wrap">' + TU.escapeHtml(e.detail || "-") + '</td>' +
          '<td data-label="¥ 비용">' + TU.formatJPY(e.jpy) + '</td>' +
          '<td data-label="₩ 환산">' + TU.formatKRW(e.krw) + '</td>' +
          '<td data-label="일별 누적">' + TU.formatKRW(dayRunning[e.date]) + '</td>' +
          '<td data-label="전체 누적">' + TU.formatKRW(grandRunning) + '</td>' +
          '<td data-label="비고" class="wrap">' + TU.escapeHtml(e.memo || "-") + '</td>' +
          '<td data-label=""><button class="btn btn-sm btn-danger" data-del="' + e.id + '">삭제</button></td>' +
        '</tr>'
      );
    });
    tbody.innerHTML = rows.join("");

    tbody.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        expenses = expenses.filter(function (e) { return e.id !== btn.getAttribute("data-del"); });
        saveExpenses(expenses);
        renderAll();
      });
    });
  }

  // ---------------- Stats ----------------
  function renderStats() {
    var grid = document.getElementById("budgetStatGrid");
    var planned = TD.plannedTotal(prepaid);
    var actualTotal = expenses.reduce(function (s, e) { return s + e.krw; }, 0);
    var diff = planned - actualTotal;
    var days = {};
    expenses.forEach(function (e) { days[e.date] = (days[e.date] || 0) + e.krw; });
    var todayMax = Object.keys(days).reduce(function (m, d) { return Math.max(m, days[d]); }, 0);

    var stats = [
      { label: "계획 총 예산", value: TU.formatKRW(planned), sub: "사전결제 + 일정 예정 지출" },
      { label: "실사용 누적 합계", value: TU.formatKRW(actualTotal), sub: expenses.length + "건 입력됨" },
      { label: "예산 대비 잔액", value: TU.formatKRW(diff), sub: diff >= 0 ? "예산 이내" : "예산 초과" },
      { label: "일별 최대 지출일", value: TU.formatKRW(todayMax), sub: Object.keys(days).length ? "최고 지출일 기준" : "입력된 내역 없음" }
    ];
    grid.innerHTML = stats.map(function (s) {
      return '<div class="card stat-card"><div class="stat-label">' + s.label + '</div><div class="stat-value">' + s.value + '</div><div class="stat-sub">' + s.sub + '</div></div>';
    }).join("");
  }

  // ---------------- Charts ----------------
  function themeColors() {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.hasAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return {
      grid: isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)",
      tick: isDark ? "#b7b8bf" : "#55565c"
    };
  }

  function renderCharts() {
    if (typeof Chart === "undefined") {
      ["compareChart", "pieChart"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.innerHTML = '<p class="muted" style="font-size:12.5px;">차트 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.</p>';
      });
      return;
    }
    var colors = themeColors();
    var byCatPlanned = TD.plannedByCategory(prepaid);
    var byCatActual = {};
    TD.CATEGORIES.forEach(function (c) { byCatActual[c.key] = 0; });
    expenses.forEach(function (e) { byCatActual[e.category] = (byCatActual[e.category] || 0) + e.krw; });

    var labels = TD.CATEGORIES.map(function (c) { return c.label; });
    var plannedData = TD.CATEGORIES.map(function (c) { return byCatPlanned[c.key] || 0; });
    var actualData = TD.CATEGORIES.map(function (c) { return byCatActual[c.key] || 0; });

    if (catChart) catChart.destroy();
    catChart = new Chart(document.getElementById("compareChart"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "계획", data: plannedData, backgroundColor: "rgba(127,169,216,.55)", borderRadius: 5, maxBarThickness: 26 },
          { label: "실사용", data: actualData, backgroundColor: "rgba(127,185,154,.75)", borderRadius: 5, maxBarThickness: 26 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: colors.tick, boxWidth: 10, font: { size: 11 } } },
          tooltip: { callbacks: { label: function (ctx) { return ctx.dataset.label + ": ₩" + ctx.parsed.y.toLocaleString("ko-KR"); } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: colors.tick, font: { size: 10.5 } } },
          y: { grid: { color: colors.grid }, ticks: { color: colors.tick, callback: function (v) { return (v / 10000) + "만"; } } }
        }
      }
    });

    var pieColors = ["#7fa9d8","#6f9bcb","#a79bd0","#9fbfd8","#cf9aa4","#d8b27f","#7fb99a","#e0c68f","#b9bac0"];
    if (pieChart) pieChart.destroy();
    var hasActual = actualData.some(function (v) { return v > 0; });
    pieChart = new Chart(document.getElementById("pieChart"), {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{ data: hasActual ? actualData : labels.map(function () { return 0; }), backgroundColor: pieColors, borderWidth: 2, borderColor: "var(--bg-elev)" }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: colors.tick, boxWidth: 10, font: { size: 10.5 } } },
          tooltip: { callbacks: { label: function (ctx) { return ctx.label + ": ₩" + ctx.parsed.toLocaleString("ko-KR"); } } }
        }
      }
    });
  }

  // ---------------- Export / Import / Clear ----------------
  function initToolbar() {
    document.getElementById("exportBtn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(expenses, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "fukuoka-trip-expenses.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    document.getElementById("importInput").addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var imported = JSON.parse(reader.result);
          if (!Array.isArray(imported)) throw new Error("invalid");
          var existingIds = {};
          expenses.forEach(function (x) { existingIds[x.id] = true; });
          imported.forEach(function (x) { if (x && x.id && !existingIds[x.id]) expenses.push(x); });
          saveExpenses(expenses);
          renderAll();
          alert("가져오기가 완료되었습니다. (" + imported.length + "건 처리)");
        } catch (err) {
          alert("파일을 읽을 수 없습니다. 올바른 내보내기 JSON 파일인지 확인해 주세요.");
        }
        e.target.value = "";
      };
      reader.readAsText(file);
    });

    document.getElementById("clearBtn").addEventListener("click", function () {
      if (!expenses.length) return;
      if (!confirm("입력된 모든 사용 내역을 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
      expenses = [];
      saveExpenses(expenses);
      renderAll();
    });
  }

  function renderFootnotes() {
    var r = TU.renderFootnotes(["sheet", "fx"]);
    document.getElementById("fnContainer").innerHTML = r.html;
  }

  function safe(fn, label) {
    try { fn(); } catch (e) { console.error("[budget.js] " + label + " failed:", e); }
  }

  function renderAll() {
    safe(renderStats, "renderStats");
    safe(renderPrepaid, "renderPrepaid");
    safe(renderTable, "renderTable");
    safe(renderCharts, "renderCharts");
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(initForm, "initForm");
    safe(initPrepaid, "initPrepaid");
    safe(initToolbar, "initToolbar");
    renderAll();
    safe(renderFootnotes, "renderFootnotes");
  });
})();
