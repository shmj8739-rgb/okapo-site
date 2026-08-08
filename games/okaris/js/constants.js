/**
 * constants.js
 * -----------------------------------------------------------------------
 * OKARIS 全体で共有する定数群。
 * ・盤面サイズ / ピース形状 / 配色 / スコア設定 / 落下速度テーブルなど
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  // ---- 盤面サイズ -------------------------------------------------------
  const COLS = 10;
  const ROWS = 20;

  // ---- ピース定義 ---------------------------------------------------------
  // 4x4 グリッド上での回転状態（0〜3）ごとの座標配列を持つ。
  // 形状名は幾何学的な記号（一般名称）であり、特定作品由来の名称は用いない。
  const PIECE_DEFS = {
    I: {
      color: '#00f6ff',
      glow: 'rgba(0,246,255,0.65)',
      rotations: [
        [[0,1],[1,1],[2,1],[3,1]],
        [[2,0],[2,1],[2,2],[2,3]],
        [[0,2],[1,2],[2,2],[3,2]],
        [[1,0],[1,1],[1,2],[1,3]],
      ],
    },
    O: {
      color: '#ffd23f',
      glow: 'rgba(255,210,63,0.65)',
      rotations: [
        [[1,0],[2,0],[1,1],[2,1]],
        [[1,0],[2,0],[1,1],[2,1]],
        [[1,0],[2,0],[1,1],[2,1]],
        [[1,0],[2,0],[1,1],[2,1]],
      ],
    },
    T: {
      color: '#ff3ec8',
      glow: 'rgba(255,62,200,0.65)',
      rotations: [
        [[1,0],[0,1],[1,1],[2,1]],
        [[1,0],[1,1],[2,1],[1,2]],
        [[0,1],[1,1],[2,1],[1,2]],
        [[1,0],[0,1],[1,1],[1,2]],
      ],
    },
    S: {
      color: '#39ff88',
      glow: 'rgba(57,255,136,0.65)',
      rotations: [
        [[1,0],[2,0],[0,1],[1,1]],
        [[1,0],[1,1],[2,1],[2,2]],
        [[1,1],[2,1],[0,2],[1,2]],
        [[0,0],[0,1],[1,1],[1,2]],
      ],
    },
    Z: {
      color: '#ff4d4d',
      glow: 'rgba(255,77,77,0.65)',
      rotations: [
        [[0,0],[1,0],[1,1],[2,1]],
        [[2,0],[1,1],[2,1],[1,2]],
        [[0,1],[1,1],[1,2],[2,2]],
        [[1,0],[0,1],[1,1],[0,2]],
      ],
    },
    J: {
      color: '#5b8bff',
      glow: 'rgba(91,139,255,0.65)',
      rotations: [
        [[0,0],[0,1],[1,1],[2,1]],
        [[1,0],[2,0],[1,1],[1,2]],
        [[0,1],[1,1],[2,1],[2,2]],
        [[1,0],[1,1],[0,2],[1,2]],
      ],
    },
    L: {
      color: '#ff9f3e',
      glow: 'rgba(255,159,62,0.65)',
      rotations: [
        [[2,0],[0,1],[1,1],[2,1]],
        [[1,0],[1,1],[1,2],[2,2]],
        [[0,1],[1,1],[2,1],[0,2]],
        [[0,0],[1,0],[1,1],[1,2]],
      ],
    },
  };

  const PIECE_NAMES = Object.keys(PIECE_DEFS);

  // ---- スコアリング -------------------------------------------------------
  // 同時消去ライン数ごとの基本スコア。レベルに応じて倍率がかかる。
  const LINE_SCORE = { 1: 100, 2: 300, 3: 500, 4: 800 };
  const SOFT_DROP_SCORE_PER_CELL = 1;
  const HARD_DROP_SCORE_PER_CELL = 2;

  // レベルアップに必要な消去ライン数
  const LINES_PER_LEVEL = 10;

  // レベルごとの落下間隔(ms)。レベルが上がるほど短くなる（最速値でクランプ）。
  function dropIntervalForLevel(level) {
    const base = 1000;
    const step = 70;
    const min = 100;
    return Math.max(min, base - (level - 1) * step);
  }

  // レベルが上がるほどスコア倍率が上がる
  function scoreMultiplierForLevel(level) {
    return 1 + (level - 1) * 0.1;
  }

  const STORAGE_KEY_HIGH_SCORE = 'okaris.highScore';
  const STORAGE_KEY_SOUND = 'okaris.soundEnabled';

  global.OKARIS_CONST = {
    COLS,
    ROWS,
    PIECE_DEFS,
    PIECE_NAMES,
    LINE_SCORE,
    SOFT_DROP_SCORE_PER_CELL,
    HARD_DROP_SCORE_PER_CELL,
    LINES_PER_LEVEL,
    dropIntervalForLevel,
    scoreMultiplierForLevel,
    STORAGE_KEY_HIGH_SCORE,
    STORAGE_KEY_SOUND,
  };
})(window);
