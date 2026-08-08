/**
 * main.js
 * -----------------------------------------------------------------------
 * エントリーポイント。DOM構築後にGameとInputControllerを生成して結びつける。
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const game = new global.OkarisGame();
    new global.OkarisInputController(game);
  });
})(window);
