/**
 * board.js
 * -----------------------------------------------------------------------
 * ゲーム盤面（グリッド）の状態管理を担当。
 * ・衝突判定
 * ・ピースの固定
 * ・揃った行の検出とクリア
 * ・ゲームオーバー判定
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const { COLS, ROWS } = global.OKARIS_CONST;

  class Board {
    constructor() {
      this.reset();
    }

    reset() {
      // grid[row][col] = null(空) または セルの色(文字列)
      this.grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
    }

    /**
     * 指定セル群が盤面上に置けるか判定する。
     * 行が0未満（盤面上部より上）の場合は境界チェックのみ行い、
     * グリッドとの重なりチェックはスキップする（スポーン演出のため）。
     * @param {Array<[number, number]>} cells - [col, row] の配列
     */
    isValidPosition(cells) {
      for (const [col, row] of cells) {
        if (col < 0 || col >= COLS) return false;
        if (row >= ROWS) return false;
        if (row >= 0 && this.grid[row][col]) return false;
      }
      return true;
    }

    /** ピースを盤面に固定し、色情報をグリッドへ書き込む */
    lockPiece(piece) {
      const cells = piece.getCells();
      for (const [col, row] of cells) {
        if (row < 0) continue; // 盤面より上は無視（通常ここでゲームオーバー判定される）
        this.grid[row][col] = piece.color;
      }
    }

    /** 揃った行のインデックス一覧を返す（盤面は変更しない） */
    findFullRows() {
      const fullRows = [];
      for (let r = 0; r < ROWS; r++) {
        if (this.grid[r].every((cell) => cell !== null)) {
          fullRows.push(r);
        }
      }
      return fullRows;
    }

    /**
     * 指定した行を削除し、上から空行を詰める。
     * ライン消去アニメーションを先に見せたい場合は findFullRows() で
     * 対象行を取得してから、演出後にこのメソッドを呼び出す。
     * @param {number[]} rows
     */
    removeRows(rows) {
      for (const r of rows) {
        this.grid.splice(r, 1);
        this.grid.unshift(new Array(COLS).fill(null));
      }
    }

    /**
     * 揃った行を即座に検出・削除する（アニメーションを挟まない簡易版）。
     * @returns {{count: number, rows: number[]}}
     */
    clearLines() {
      const fullRows = this.findFullRows();
      this.removeRows(fullRows);
      return { count: fullRows.length, rows: fullRows };
    }
  }

  global.OkarisBoard = Board;
})(window);
