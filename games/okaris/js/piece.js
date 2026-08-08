/**
 * piece.js
 * -----------------------------------------------------------------------
 * 落下中の1ピース（テトロミノ）を表すクラス。
 * 4x4の基準グリッド上での回転パターン(constants.jsのPIECE_DEFS)と、
 * 盤面上のオフセット位置(x, y)を保持する。
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const { PIECE_DEFS, COLS } = global.OKARIS_CONST;

  class Piece {
    /**
     * @param {string} shapeName - 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
     */
    constructor(shapeName) {
      this.shapeName = shapeName;
      this.def = PIECE_DEFS[shapeName];
      this.rotationState = 0;
      // 盤面上での基準グリッドの左上座標（列, 行）。行は上部にはみ出す形で0未満から始まる。
      this.x = Math.floor((COLS - 4) / 2);
      this.y = shapeName === 'I' ? -1 : -2;
    }

    /** 現在の回転状態での4セル分の相対座標 [[col,row], ...] */
    getRelativeCells(rotationState = this.rotationState) {
      return this.def.rotations[rotationState % 4];
    }

    /** 盤面座標系での絶対セル位置を返す */
    getCells(offsetX = 0, offsetY = 0, rotationState = this.rotationState) {
      return this.getRelativeCells(rotationState).map(([col, row]) => [
        this.x + col + offsetX,
        this.y + row + offsetY,
      ]);
    }

    get color() {
      return this.def.color;
    }

    get glow() {
      return this.def.glow;
    }

    /** 複製を生成（衝突判定の試行に利用） */
    clone() {
      const p = new Piece(this.shapeName);
      p.rotationState = this.rotationState;
      p.x = this.x;
      p.y = this.y;
      return p;
    }
  }

  global.OkarisPiece = Piece;
})(window);
