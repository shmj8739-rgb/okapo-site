/**
 * game.js
 * -----------------------------------------------------------------------
 * OKARIS 本体のステートマシン兼メインループ。
 * Board(盤面ロジック) / Piece(ピース) / Renderer(描画) / InputController(入力)
 * をつなぎ合わせ、スコア・レベル・ライン数・ハイスコア・演出・UI更新を統括する。
 *
 * 状態: READY -> PLAYING <-> PAUSED, PLAYING -> GAMEOVER -> (restart) PLAYING
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const C = global.OKARIS_CONST;
  const Piece = global.OkarisPiece;
  const Board = global.OkarisBoard;
  const Renderer = global.OkarisRenderer;
  const Storage = global.OkarisStorage;

  const LINE_CLEAR_ANIM_MS = 260;
  const SOFT_DROP_INTERVAL_DIVISOR = 12; // ソフトドロップ中は自然落下より十分速く

  class Game {
    constructor() {
      this.board = new Board();
      this.el = this._queryElements();

      this.renderer = new Renderer({
        boardCanvas: this.el.boardCanvas,
        fxCanvas: this.el.fxCanvas,
        nextCanvas: this.el.nextCanvas,
      });

      // ---- ゲーム状態 ----
      this.state = 'READY'; // READY | PLAYING | PAUSED | GAMEOVER
      this.bag = [];
      this.currentPiece = null;
      this.nextPieceName = null;
      this.score = 0;
      this.level = 1;
      this.linesCleared = 0;
      this.dropInterval = C.dropIntervalForLevel(1);
      this.dropAccumulator = 0;
      this.softDropActive = false;
      this.lineClearBusy = false;
      this.highScoreAtStart = 0;

      // ---- 永続データ ----
      this.highScore = Storage.getHighScore();
      this.soundEnabled = Storage.getSoundEnabled();
      this.audioCtx = null;

      this._levelUpTimeout = null;
      this.lastTimestamp = 0;

      this._updateStatsUI();
      this._updateHighScoreUI();
      this._updateSoundButtonUI();
      this._bindButtons();

      window.addEventListener('resize', () => this.renderer.resize());

      this._loopBound = this._loop.bind(this);
      this.rafId = requestAnimationFrame(this._loopBound);
    }

    // =================================================================
    // 初期化・DOM取得
    // =================================================================
    _queryElements() {
      const $ = (id) => document.getElementById(id);
      return {
        boardCanvas: $('board-canvas'),
        fxCanvas: $('fx-canvas'),
        nextCanvas: $('next-canvas'),
        score: $('score'),
        highScore: $('high-score'),
        level: $('level'),
        lines: $('lines'),
        finalScore: $('final-score'),
        newRecord: $('new-record'),
        overlayStart: $('overlay-start'),
        overlayPause: $('overlay-pause'),
        overlayGameover: $('overlay-gameover'),
        levelupBanner: $('levelup-banner'),
        btnStart: $('btn-start'),
        btnResume: $('btn-resume'),
        btnRestart: $('btn-restart'),
        btnPause: $('btn-pause'),
        btnRestartSide: $('btn-restart-side'),
        btnSound: $('btn-sound'),
      };
    }

    _bindButtons() {
      this.el.btnStart.addEventListener('click', () => this.start());
      this.el.btnRestart.addEventListener('click', () => this.start());
      this.el.btnRestartSide.addEventListener('click', () => this.start());
      this.el.btnResume.addEventListener('click', () => this.togglePause());
      this.el.btnPause.addEventListener('click', () => this.togglePause());
      this.el.btnSound.addEventListener('click', () => this._toggleSound());
    }

    // =================================================================
    // ゲームフロー制御
    // =================================================================
    start() {
      this._ensureAudio();

      this.board.reset();
      this.bag = [];
      this.score = 0;
      this.level = 1;
      this.linesCleared = 0;
      this.dropInterval = C.dropIntervalForLevel(1);
      this.dropAccumulator = 0;
      this.softDropActive = false;
      this.lineClearBusy = false;
      this.highScoreAtStart = this.highScore;

      this.nextPieceName = this._drawFromBag();
      this._spawnNext();

      this.state = 'PLAYING';
      this._hideAllOverlays();
      this._updateStatsUI();
    }

    togglePause() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.softDropActive = false;
        this._showOverlay(this.el.overlayPause);
      } else if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        this._hideOverlay(this.el.overlayPause);
      }
    }

    _triggerGameOver() {
      this.state = 'GAMEOVER';
      this.softDropActive = false;
      this._playSound('gameover');

      const isNewRecord = this.score > this.highScoreAtStart && this.score > 0;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        Storage.setHighScore(this.highScore);
        this._updateHighScoreUI();
      }

      this.el.finalScore.textContent = this.score;
      this.el.newRecord.classList.toggle('is-hidden', !isNewRecord);
      this._showOverlay(this.el.overlayGameover);
    }

    // =================================================================
    // ピース操作（InputControllerから呼び出される公開API）
    // =================================================================
    moveLeft() {
      this._tryMove(-1, 0);
    }

    moveRight() {
      this._tryMove(1, 0);
    }

    _tryMove(dx, dy) {
      if (this.state !== 'PLAYING' || this.lineClearBusy || !this.currentPiece) return;
      const cells = this.currentPiece.getCells(dx, dy);
      if (this.board.isValidPosition(cells)) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
      }
    }

    rotate() {
      if (this.state !== 'PLAYING' || this.lineClearBusy || !this.currentPiece) return;
      const piece = this.currentPiece;
      const nextState = (piece.rotationState + 1) % 4;
      // 簡易ウォールキック：その場 -> 左右に1,2マスずらして試す
      const kicks = [0, -1, 1, -2, 2];
      for (const dx of kicks) {
        const cells = piece.getCells(dx, 0, nextState);
        if (this.board.isValidPosition(cells)) {
          piece.rotationState = nextState;
          piece.x += dx;
          this._playSound('rotate');
          return;
        }
      }
      // どこにも回転先がなければ何もしない
    }

    softDropStart() {
      if (this.state !== 'PLAYING') return;
      this.softDropActive = true;
    }

    softDropStop() {
      this.softDropActive = false;
    }

    hardDrop() {
      if (this.state !== 'PLAYING' || this.lineClearBusy || !this.currentPiece) return;

      let distance = 0;
      while (this.board.isValidPosition(this.currentPiece.getCells(0, distance + 1))) {
        distance++;
      }

      if (distance > 0) {
        const cellsBefore = this.currentPiece.getCells();
        const cols = [...new Set(cellsBefore.map((c) => c[0]))];
        const fromRow = Math.max(0, Math.min(...cellsBefore.map((c) => c[1])));

        this.currentPiece.y += distance;
        this._addScorePoints(distance * C.HARD_DROP_SCORE_PER_CELL);

        const toRow = fromRow + distance;
        this.renderer.addHardDropEffect(cols, fromRow, toRow, this.currentPiece.color);
      }

      this._playSound('drop');
      this._lockCurrentPiece();
    }

    // =================================================================
    // 落下・固定・ライン消去
    // =================================================================
    _tickNaturalDrop(isSoftDrop) {
      if (!this.currentPiece) return;
      const cells = this.currentPiece.getCells(0, 1);
      if (this.board.isValidPosition(cells)) {
        this.currentPiece.y += 1;
        if (isSoftDrop) this._addScorePoints(C.SOFT_DROP_SCORE_PER_CELL);
      } else {
        this._lockCurrentPiece();
      }
    }

    _lockCurrentPiece() {
      this.board.lockPiece(this.currentPiece);
      this._playSound('lock');
      const fullRows = this.board.findFullRows();

      if (fullRows.length > 0) {
        this.lineClearBusy = true;
        this.currentPiece = null; // 消去演出中は操作対象を外す
        this.renderer.addLineClearEffect(fullRows);
        this._playSound('clear');
        setTimeout(() => {
          this.board.removeRows(fullRows);
          this._applyLineClearResult(fullRows.length);
          this.lineClearBusy = false;
          this._spawnNext();
        }, LINE_CLEAR_ANIM_MS);
      } else {
        this._spawnNext();
      }
    }

    _applyLineClearResult(clearedCount) {
      const baseScore = C.LINE_SCORE[clearedCount] || 0;
      const multiplier = C.scoreMultiplierForLevel(this.level);
      const gained = Math.round(baseScore * multiplier);

      this.score += gained;
      this.linesCleared += clearedCount;

      const newLevel = Math.floor(this.linesCleared / C.LINES_PER_LEVEL) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.dropInterval = C.dropIntervalForLevel(this.level);
        this._showLevelUpBanner();
      }

      this._syncHighScoreLive();
      this._updateStatsUI();
      this._pulse(this.el.score);
    }

    _addScorePoints(points) {
      if (points <= 0) return;
      this.score += Math.round(points);
      this._syncHighScoreLive();
      this._updateStatsUI();
    }

    _syncHighScoreLive() {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        Storage.setHighScore(this.highScore);
        this._updateHighScoreUI();
      }
    }

    // =================================================================
    // ピース生成（7種バッグ方式）
    // =================================================================
    _drawFromBag() {
      if (this.bag.length === 0) {
        const fresh = [...C.PIECE_NAMES];
        for (let i = fresh.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
        }
        this.bag.push(...fresh);
      }
      return this.bag.shift();
    }

    _spawnNext() {
      this.currentPiece = new Piece(this.nextPieceName);
      this.nextPieceName = this._drawFromBag();
      this.renderer.drawNext(this.nextPieceName, C.PIECE_DEFS);

      if (!this.board.isValidPosition(this.currentPiece.getCells())) {
        this._triggerGameOver();
      }
    }

    // =================================================================
    // メインループ
    // =================================================================
    _loop(timestamp) {
      const delta = this.lastTimestamp ? timestamp - this.lastTimestamp : 0;
      this.lastTimestamp = timestamp;

      if (this.state === 'PLAYING' && !this.lineClearBusy && this.currentPiece) {
        this.dropAccumulator += delta;
        const interval = this.softDropActive
          ? Math.max(25, this.dropInterval / SOFT_DROP_INTERVAL_DIVISOR)
          : this.dropInterval;

        if (this.dropAccumulator >= interval) {
          this.dropAccumulator = 0;
          this._tickNaturalDrop(this.softDropActive);
        }
      }

      this._render(timestamp);
      this.rafId = requestAnimationFrame(this._loopBound);
    }

    _render(timestamp) {
      const ghostCells = this.currentPiece ? this._computeGhostCells() : null;
      this.renderer.drawBoard(this.board, this.currentPiece, ghostCells);
      this.renderer.renderEffects(timestamp);
    }

    _computeGhostCells() {
      let distance = 0;
      while (this.board.isValidPosition(this.currentPiece.getCells(0, distance + 1))) {
        distance++;
      }
      return this.currentPiece.getCells(0, distance);
    }

    // =================================================================
    // UI更新
    // =================================================================
    _updateStatsUI() {
      this.el.score.textContent = this.score;
      this.el.level.textContent = this.level;
      this.el.lines.textContent = this.linesCleared;
    }

    _updateHighScoreUI() {
      this.el.highScore.textContent = this.highScore;
    }

    _pulse(el) {
      el.classList.remove('pulse');
      // eslint-disable-next-line no-unused-expressions
      void el.offsetWidth; // reflow でアニメーションを再トリガー
      el.classList.add('pulse');
    }

    _showLevelUpBanner() {
      const el = this.el.levelupBanner;
      el.classList.remove('play');
      el.classList.remove('is-hidden');
      void el.offsetWidth;
      el.classList.add('play');
      this._playSound('levelup');
      clearTimeout(this._levelUpTimeout);
      this._levelUpTimeout = setTimeout(() => {
        el.classList.add('is-hidden');
      }, 1300);
    }

    _showOverlay(overlayEl) {
      this._hideAllOverlays();
      overlayEl.classList.remove('is-hidden');
    }

    _hideOverlay(overlayEl) {
      overlayEl.classList.add('is-hidden');
    }

    _hideAllOverlays() {
      [this.el.overlayStart, this.el.overlayPause, this.el.overlayGameover].forEach((o) =>
        o.classList.add('is-hidden')
      );
    }

    // =================================================================
    // サウンド（外部音源なし・WebAudioによる簡易効果音）
    // =================================================================
    _ensureAudio() {
      if (this.audioCtx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        this.audioCtx = new AudioCtx();
      } catch (e) {
        this.audioCtx = null;
      }
    }

    _toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      Storage.setSoundEnabled(this.soundEnabled);
      this._updateSoundButtonUI();
    }

    _updateSoundButtonUI() {
      this.el.btnSound.setAttribute('aria-pressed', String(this.soundEnabled));
    }

    _playSound(type) {
      if (!this.soundEnabled || !this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const freqMap = {
        rotate: 340,
        drop: 460,
        lock: 200,
        clear: 700,
        levelup: 880,
        gameover: 120,
      };
      const durationMap = { gameover: 0.45, clear: 0.22 };

      const ctx = this.audioCtx;
      const freq = freqMap[type] || 300;
      const duration = durationMap[type] || 0.14;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    }
  }

  global.OkarisGame = Game;
})(window);
