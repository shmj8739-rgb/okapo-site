// ===================================================
// OKAPO MONEY CRASH — 起動処理
// ---------------------------------------------------
// 依存順に読み込まれた各モジュール（constants → storage → audio →
// particles → notes → game → ui）を組み立てて起動する。
// ===================================================

(() => {
  const gameAreaEl = document.getElementById("mb-game-area");
  const notesLayerEl = document.getElementById("mb-notes-layer");
  const canvasEl = document.getElementById("mb-particles");

  const game = new MoneyCrashGame();

  // UIのイベント購読を先に済ませてから game.init() を呼ぶ
  // （game.init() 内の resetField() が最初の statsChange 等を
  //   emit するため、購読が後だと初期表示を取りこぼす）。
  UI.init(game);
  game.init(gameAreaEl, notesLayerEl, canvasEl);

  window.__okapoMoneyCrash = game; // デバッグ用に参照だけ残しておく
})();
