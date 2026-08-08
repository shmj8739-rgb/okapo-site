/**
 * input.js
 * -----------------------------------------------------------------------
 * キーボード操作とタッチ操作を統一的にGameインスタンスへディスパッチする。
 * ・単発操作（回転・ハードドロップ・一時停止）はkeydown/tapで即実行
 * ・連続操作（左右移動・高速落下）はDAS(初回遅延)/ARR(連続間隔)を簡易実装
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const DAS_DELAY = 170; // 押しっぱなし開始から連続移動が始まるまでの遅延(ms)
  const ARR_INTERVAL = 50; // 連続移動の間隔(ms)

  class InputController {
    /** @param {Game} game */
    constructor(game) {
      this.game = game;
      this.repeatTimers = {}; // key -> { timeoutId, intervalId }
      this._bindKeyboard();
      this._bindTouch();
    }

    // ---------------------------------------------------------------
    // キーボード
    // ---------------------------------------------------------------
    _bindKeyboard() {
      const handledKeys = new Set([
        'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'Spacebar', 'p', 'P',
      ]);

      window.addEventListener('keydown', (e) => {
        if (handledKeys.has(e.key)) e.preventDefault();
        if (e.repeat) {
          // ブラウザネイティブのキーリピートは使わず、独自のDAS/ARRで制御する
          return;
        }

        switch (e.key) {
          case 'ArrowLeft':
            this._startRepeat('left', () => this.game.moveLeft());
            break;
          case 'ArrowRight':
            this._startRepeat('right', () => this.game.moveRight());
            break;
          case 'ArrowDown':
            this.game.softDropStart();
            break;
          case 'ArrowUp':
            this.game.rotate();
            break;
          case ' ':
          case 'Spacebar':
            this.game.hardDrop();
            break;
          case 'p':
          case 'P':
            this.game.togglePause();
            break;
          default:
            break;
        }
      });

      window.addEventListener('keyup', (e) => {
        switch (e.key) {
          case 'ArrowLeft':
            this._stopRepeat('left');
            break;
          case 'ArrowRight':
            this._stopRepeat('right');
            break;
          case 'ArrowDown':
            this.game.softDropStop();
            break;
          default:
            break;
        }
      });

      // タブが非アクティブになったら移動系の押しっぱなし状態を解除しておく
      window.addEventListener('blur', () => {
        this._stopRepeat('left');
        this._stopRepeat('right');
        this.game.softDropStop();
      });
    }

    // ---------------------------------------------------------------
    // タッチ操作ボタン
    // ---------------------------------------------------------------
    _bindTouch() {
      const bind = (id, onStart, onEnd) => {
        const el = document.getElementById(id);
        if (!el) return;
        const start = (e) => {
          e.preventDefault();
          onStart();
        };
        const end = (e) => {
          e.preventDefault();
          if (onEnd) onEnd();
        };
        el.addEventListener('touchstart', start, { passive: false });
        el.addEventListener('touchend', end, { passive: false });
        el.addEventListener('touchcancel', end, { passive: false });
        // マウス操作（PCでのボタンクリック確認用）にも対応
        el.addEventListener('mousedown', start);
        el.addEventListener('mouseup', end);
        el.addEventListener('mouseleave', end);
      };

      bind('t-left', () => this._startRepeat('left', () => this.game.moveLeft()), () => this._stopRepeat('left'));
      bind('t-right', () => this._startRepeat('right', () => this.game.moveRight()), () => this._stopRepeat('right'));
      bind('t-down', () => this.game.softDropStart(), () => this.game.softDropStop());
      bind('t-rotate', () => this.game.rotate());
      bind('t-drop', () => this.game.hardDrop());
      bind('t-pause', () => this.game.togglePause());
    }

    // ---------------------------------------------------------------
    // DAS/ARR 共通ヘルパー
    // ---------------------------------------------------------------
    _startRepeat(key, action) {
      if (this.repeatTimers[key]) return; // 既に押下中なら何もしない
      action(); // 最初の1回は即実行
      const timeoutId = setTimeout(() => {
        const intervalId = setInterval(action, ARR_INTERVAL);
        this.repeatTimers[key].intervalId = intervalId;
      }, DAS_DELAY);
      this.repeatTimers[key] = { timeoutId, intervalId: null };
    }

    _stopRepeat(key) {
      const timer = this.repeatTimers[key];
      if (!timer) return;
      clearTimeout(timer.timeoutId);
      if (timer.intervalId) clearInterval(timer.intervalId);
      delete this.repeatTimers[key];
    }
  }

  global.OkarisInputController = InputController;
})(window);
