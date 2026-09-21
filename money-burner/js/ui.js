// ===================================================
// OKAPO MONEY CRASH — UI制御（シンプル版）
// ---------------------------------------------------
// game.js（状態・ロジック）と DOM表示 を橋渡しする層。
// ミッション・実績・設定パネルなどは廃止し、
// タイトル／合計破壊金額／ツール／RESET だけを扱う。
// ===================================================

const UI = (() => {
  let game = null;
  const $ = (id) => document.getElementById(id);
  let els = {};

  function cacheEls() {
    els = {
      titleTag: $("mb-title-tag"),
      gameTitle: $("mb-game-title"),

      statDestroyed: $("mb-stat-destroyed"),

      gameArea: $("mb-game-area"),
      notesLayer: $("mb-notes-layer"),
      emptyHint: $("mb-empty-hint"),

      toolbar: $("mb-toolbar"),
      resetBtn: $("mb-reset-field-btn"),
    };
  }

  // ---------------------------------------------------
  // タイトル（constants.js の GAME_TITLE を書き換えるだけで反映される）
  // ---------------------------------------------------
  function applyTitle() {
    if (typeof GAME_TITLE === "undefined") return;
    document.title = `${GAME_TITLE.main}｜おかぽるLAB`;
    if (els.gameTitle) els.gameTitle.textContent = GAME_TITLE.main;
    if (els.titleTag) els.titleTag.textContent = GAME_TITLE.short;
  }

  // ---------------------------------------------------
  // ツールバー生成（TOOL_ORDER / TOOLS から自動生成）
  // ---------------------------------------------------
  function buildToolbar() {
    els.toolbar.innerHTML = "";
    TOOL_ORDER.forEach((id) => {
      const tool = TOOLS[id];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mb-tool-btn";
      btn.dataset.tool = id;
      btn.setAttribute("aria-pressed", id === game.selectedTool ? "true" : "false");
      btn.innerHTML = `
        <span class="mb-tool-icon" aria-hidden="true">${tool.icon}</span>
        <span class="mb-tool-label">${tool.label}</span>
        <span class="mb-tool-label-jp">${tool.jp}</span>
      `;
      btn.addEventListener("click", () => game.selectTool(id));
      els.toolbar.appendChild(btn);
    });
    highlightTool(game.selectedTool);
  }

  function highlightTool(id) {
    Array.from(els.toolbar.children).forEach((btn) => {
      const active = btn.dataset.tool === id;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  // ---------------------------------------------------
  // 統計表示
  // ---------------------------------------------------
  function renderStats(snapshot) {
    els.statDestroyed.textContent = `${formatNumber(snapshot.totalDestroyed)} ${CURRENCY_UNIT}`;
  }

  // ---------------------------------------------------
  // スコアポップアップ
  // ---------------------------------------------------
  function spawnScorePopup({ x, y, amount }) {
    const el = document.createElement("span");
    el.className = "mb-score-pop";
    el.textContent = `+${formatNumber(amount)}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    els.gameArea.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  // ---------------------------------------------------
  // 初期化
  // ---------------------------------------------------
  function init(gameInstance) {
    game = gameInstance;
    cacheEls();
    applyTitle();
    buildToolbar();

    game.on("statsChange", renderStats);
    game.on("toolChange", highlightTool);
    game.on("scorePopup", spawnScorePopup);
    game.on("fieldChange", ({ count }) => {
      els.emptyHint.hidden = count !== 0;
    });

    els.resetBtn.addEventListener("click", () => game.resetField());

    renderStats(game.getStatsSnapshot());
  }

  return { init };
})();
