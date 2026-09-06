/* ===================================================
   WORLD TRADE ROUTES — UI制御
   ---------------------------------------------------
   ・ルート一覧（ON/OFFトグル）
   ・地域フィルタ（国・地域を選ぶと関係するルートだけ強調）
   ・ルートクリック → 詳細パネル表示（PC:サイドパネル／SP:ボトムシート）
=================================================== */

(function () {
  const { REGIONS, ROUTES, PORTS, portById } = window.TRADE_DATA;

  const state = {
    activeIds: new Set(ROUTES.map((r) => r.id)), // ON/OFF状態
    selectedId: null, // 詳細表示中のルート
    region: "all", // 地域フィルタ
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", async () => {
    cacheEls();
    buildRegionFilter();
    buildRouteList();
    bindPanelClose();

    await window.TradeMap.init(els.svg, {
      onRouteClick: selectRoute,
    });

    render();
  });

  function cacheEls() {
    els.svg = document.getElementById("tr-map-svg");
    els.regionFilter = document.getElementById("tr-region-filter");
    els.routeList = document.getElementById("tr-route-list");
    els.panel = document.getElementById("tr-detail-panel");
    els.panelBody = document.getElementById("tr-detail-body");
    els.panelClose = document.getElementById("tr-detail-close");
    els.panelPlaceholder = document.getElementById("tr-detail-placeholder");
    els.overlay = document.getElementById("tr-panel-overlay");
  }

  // ---------- 地域フィルタ ----------
  function buildRegionFilter() {
    const allBtn = makeFilterButton("all", "すべて");
    els.regionFilter.appendChild(allBtn);
    REGIONS.forEach((r) => {
      els.regionFilter.appendChild(makeFilterButton(r.id, r.label, r.color));
    });
  }

  function makeFilterButton(id, label, color) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tr-filter-btn";
    btn.dataset.region = id;
    if (color) btn.style.setProperty("--tr-region-color", color);
    btn.textContent = label;
    btn.addEventListener("click", () => {
      state.region = state.region === id ? "all" : id;
      render();
    });
    return btn;
  }

  // ---------- ルート一覧（ON/OFF） ----------
  function buildRouteList() {
    ROUTES.forEach((route) => {
      const item = document.createElement("li");
      item.className = "tr-route-item";
      item.dataset.routeId = route.id;

      const label = document.createElement("label");
      label.className = "tr-switch";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = true;
      input.addEventListener("change", () => {
        if (input.checked) {
          state.activeIds.add(route.id);
        } else {
          state.activeIds.delete(route.id);
          if (state.selectedId === route.id) closePanel();
        }
        render();
      });

      const track = document.createElement("span");
      track.className = "tr-switch-track";
      label.appendChild(input);
      label.appendChild(track);

      const text = document.createElement("button");
      text.type = "button";
      text.className = "tr-route-item-name";
      text.textContent = route.name;
      text.addEventListener("click", () => {
        if (!state.activeIds.has(route.id)) return;
        selectRoute(route.id);
      });

      item.appendChild(label);
      item.appendChild(text);
      els.routeList.appendChild(item);
    });
  }

  // ---------- 選択・描画反映 ----------
  function selectRoute(routeId) {
    state.selectedId = routeId;
    render();
    openPanel(routeId);
  }

  function render() {
    // 地域フィルタが指定されている場合、そのルートが対象かどうかを計算し、
    // 「対象でON」＝はっきり表示、「対象外」＝薄く表示、というノリにする。
    const visibleIds = new Set(
      ROUTES.filter((r) => state.activeIds.has(r.id)).map((r) => r.id)
    );

    const regionFilteredIds =
      state.region === "all"
        ? visibleIds
        : new Set(
            [...visibleIds].filter((id) => {
              const r = ROUTES.find((rt) => rt.id === id);
              return r.fromRegion === state.region || r.toRegion === state.region;
            })
          );

    // 「少し減光」させたいのは次の2ケース：
    // ・地域フィルタが効いていて対象外のルート
    // ・ルートを1本選択していて、それ以外のルート
    // dimOthers は「選択中ルート以外を暗くするかどうか」の指示として
    // applyState に渡す（選択が無ければフィルタの有無だけで判定）。
    window.TradeMap.applyState({
      activeIds: visibleIds,
      selectedId: state.selectedId,
      dimOthers: state.region !== "all" || !!state.selectedId,
      highlightIds: regionFilteredIds,
    });

    document.querySelectorAll(".tr-route").forEach((g) => {
      const id = g.getAttribute("data-route-id");
      if (!visibleIds.has(id)) return;
      const isSelected = id === state.selectedId;
      const outOfRegion = state.region !== "all" && !regionFilteredIds.has(id);
      g.classList.toggle("is-dimmed", !isSelected && (outOfRegion || !!state.selectedId));
    });

    // フィルタボタンの選択状態
    els.regionFilter.querySelectorAll(".tr-filter-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.region === state.region);
    });

    // ルート一覧の選択状態
    els.routeList.querySelectorAll(".tr-route-item").forEach((item) => {
      item.classList.toggle("is-selected", item.dataset.routeId === state.selectedId);
      item.classList.toggle("is-off", !state.activeIds.has(item.dataset.routeId));
    });
  }

  // ---------- 詳細パネル ----------
  function openPanel(routeId) {
    const route = ROUTES.find((r) => r.id === routeId);
    if (!route) return;

    const fromPort = portById[route.from];
    const toPort = portById[route.to];

    els.panelPlaceholder.hidden = true;
    els.panelBody.hidden = false;
    els.panelBody.innerHTML = `
      <p class="tr-detail-eyebrow">TRADE ROUTE</p>
      <h2 class="tr-detail-title">${route.name}</h2>
      <dl class="tr-detail-list">
        <div class="tr-detail-row">
          <dt>出発地域</dt>
          <dd>${fromPort.name}</dd>
        </div>
        <div class="tr-detail-row">
          <dt>到着地域</dt>
          <dd>${toPort.name}</dd>
        </div>
        <div class="tr-detail-row">
          <dt>主な品目</dt>
          <dd>${route.goods}</dd>
        </div>
        <div class="tr-detail-row">
          <dt>主要港</dt>
          <dd>${route.ports}</dd>
        </div>
        <div class="tr-detail-row">
          <dt>輸送手段</dt>
          <dd>${route.transport}</dd>
        </div>
      </dl>
      <div class="tr-detail-why">
        <p class="tr-detail-why-label">このルートが重要な理由</p>
        <p class="tr-detail-why-text">${route.why}</p>
      </div>
    `;

    els.panel.classList.add("is-open");
    els.overlay.classList.add("is-open");
  }

  function closePanel() {
    state.selectedId = null;
    els.panel.classList.remove("is-open");
    els.overlay.classList.remove("is-open");
    render();
  }

  function bindPanelClose() {
    els.panelClose = document.getElementById("tr-detail-close");
    els.panelClose.addEventListener("click", closePanel);
    els.overlay = document.getElementById("tr-panel-overlay");
    els.overlay.addEventListener("click", closePanel);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanel();
    });
  }
})();
