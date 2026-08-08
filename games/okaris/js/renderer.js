/**
 * renderer.js
 * -----------------------------------------------------------------------
 * Canvas描画を一手に担う。
 * ・board-canvas   : 盤面グリッド／固定ブロック／ゴーストピース／操作中ピース
 * ・fx-canvas      : ライン消去フラッシュ、ハードドロップの軌跡などの演出
 * ・next-canvas    : NEXTピースのプレビュー
 *
 * ゲームロジック(Game/Board/Piece)には一切依存せず、描画に必要なデータを
 * 引数として受け取るだけの「見た目」専任レイヤーにする。
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const { COLS, ROWS } = global.OKARIS_CONST;

  class Renderer {
    constructor({ boardCanvas, fxCanvas, nextCanvas }) {
      this.boardCanvas = boardCanvas;
      this.fxCanvas = fxCanvas;
      this.nextCanvas = nextCanvas;
      this.boardCtx = boardCanvas.getContext('2d');
      this.fxCtx = fxCanvas.getContext('2d');
      this.nextCtx = nextCanvas.getContext('2d');

      this.cellSize = 30;
      this.dpr = Math.max(1, window.devicePixelRatio || 1);
      this.effects = []; // { type, startTime, duration, data }

      this.resize();
    }

    /** コンテナのCSSサイズに合わせてcanvasの内部解像度を再計算する */
    resize() {
      const rect = this.boardCanvas.getBoundingClientRect();
      const cssWidth = rect.width || this.boardCanvas.clientWidth || 300;
      const cssHeight = cssWidth * (ROWS / COLS);

      this.cellSize = cssWidth / COLS;

      [this.boardCanvas, this.fxCanvas].forEach((canvas) => {
        canvas.width = Math.round(cssWidth * this.dpr);
        canvas.height = Math.round(cssHeight * this.dpr);
        canvas.style.height = `${cssHeight}px`;
      });
      this.boardCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.fxCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // NEXTプレビューは正方形固定。中身のセルサイズだけ調整する。
      const nextRect = this.nextCanvas.getBoundingClientRect();
      const nextSize = nextRect.width || this.nextCanvas.clientWidth || 120;
      this.nextCanvas.width = Math.round(nextSize * this.dpr);
      this.nextCanvas.height = Math.round(nextSize * this.dpr);
      this.nextCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.nextCssSize = nextSize;
    }

    // ---------------------------------------------------------------
    // 盤面描画
    // ---------------------------------------------------------------

    /**
     * @param {Board} board
     * @param {Piece|null} activePiece
     * @param {Array<[number,number]>|null} ghostCells
     */
    drawBoard(board, activePiece, ghostCells) {
      const ctx = this.boardCtx;
      const size = this.cellSize;
      const w = COLS * size;
      const h = ROWS * size;

      ctx.clearRect(0, 0, w, h);

      // 背景
      ctx.fillStyle = 'rgba(10, 12, 20, 0.9)';
      ctx.fillRect(0, 0, w, h);

      // グリッド線
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * size, 0);
        ctx.lineTo(c * size, h);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * size);
        ctx.lineTo(w, r * size);
        ctx.stroke();
      }

      // 固定済みブロック
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const color = board.grid[r][c];
          if (color) this._drawCell(ctx, c, r, color, 1);
        }
      }

      // ゴーストピース（着地予測、輪郭のみ）
      if (ghostCells) {
        for (const [col, row] of ghostCells) {
          if (row < 0) continue;
          this._drawGhostCell(ctx, col, row, activePiece.color);
        }
      }

      // 操作中ピース
      if (activePiece) {
        for (const [col, row] of activePiece.getCells()) {
          if (row < 0) continue;
          this._drawCell(ctx, col, row, activePiece.color, 1, activePiece.glow);
        }
      }
    }

    _drawCell(ctx, col, row, color, alpha, glow) {
      const size = this.cellSize;
      const x = col * size;
      const y = row * size;
      const pad = Math.max(1, size * 0.06);

      ctx.save();
      ctx.globalAlpha = alpha;
      if (glow) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = size * 0.5;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
      ctx.restore();

      // ハイライト（左上に薄い光沢）
      ctx.save();
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + pad, y + pad, size - pad * 2, (size - pad * 2) * 0.28);
      ctx.restore();
    }

    _drawGhostCell(ctx, col, row, color) {
      const size = this.cellSize;
      const x = col * size;
      const y = row * size;
      const pad = Math.max(1, size * 0.08);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = Math.max(1, size * 0.06);
      ctx.strokeRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
      ctx.restore();
    }

    // ---------------------------------------------------------------
    // NEXTプレビュー
    // ---------------------------------------------------------------

    drawNext(shapeName, pieceDefs) {
      const ctx = this.nextCtx;
      const size = this.nextCssSize;
      ctx.clearRect(0, 0, size, size);
      if (!shapeName) return;

      const def = pieceDefs[shapeName];
      const cells = def.rotations[0];
      const minX = Math.min(...cells.map((c) => c[0]));
      const maxX = Math.max(...cells.map((c) => c[0]));
      const minY = Math.min(...cells.map((c) => c[1]));
      const maxY = Math.max(...cells.map((c) => c[1]));
      const shapeW = maxX - minX + 1;
      const shapeH = maxY - minY + 1;

      const cell = Math.min(size / 5, size / (Math.max(shapeW, shapeH) + 1));
      const offsetX = (size - shapeW * cell) / 2;
      const offsetY = (size - shapeH * cell) / 2;

      ctx.save();
      ctx.shadowColor = def.glow;
      ctx.shadowBlur = cell * 0.4;
      ctx.fillStyle = def.color;
      for (const [cx, cy] of cells) {
        const x = offsetX + (cx - minX) * cell;
        const y = offsetY + (cy - minY) * cell;
        const pad = cell * 0.08;
        ctx.fillRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2);
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------
    // 演出（fx-canvas）
    // ---------------------------------------------------------------

    /** ライン消去のフラッシュ演出を追加 */
    addLineClearEffect(rows) {
      this.effects.push({
        type: 'lineClear',
        startTime: performance.now(),
        duration: 260,
        data: { rows },
      });
    }

    /** ハードドロップの軌跡演出を追加 */
    addHardDropEffect(cellsCols, fromRow, toRow, color) {
      this.effects.push({
        type: 'hardDrop',
        startTime: performance.now(),
        duration: 220,
        data: { cellsCols, fromRow, toRow, color },
      });
    }

    /** 毎フレーム呼び出し、演出を描画・寿命切れのものを破棄する */
    renderEffects(timestamp) {
      const ctx = this.fxCtx;
      const size = this.cellSize;
      ctx.clearRect(0, 0, COLS * size, ROWS * size);

      this.effects = this.effects.filter((fx) => {
        const elapsed = timestamp - fx.startTime;
        if (elapsed > fx.duration) return false;
        const progress = elapsed / fx.duration;

        if (fx.type === 'lineClear') {
          const alpha = 1 - progress;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#ffffff';
          for (const row of fx.data.rows) {
            ctx.fillRect(0, row * size, COLS * size, size);
          }
          ctx.restore();
        } else if (fx.type === 'hardDrop') {
          const alpha = 1 - progress;
          ctx.save();
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillStyle = fx.data.color;
          for (const col of fx.data.cellsCols) {
            ctx.fillRect(
              col * size,
              fx.data.fromRow * size,
              size,
              (fx.data.toRow - fx.data.fromRow) * size
            );
          }
          ctx.restore();
        }
        return true;
      });
    }
  }

  global.OkarisRenderer = Renderer;
})(window);
