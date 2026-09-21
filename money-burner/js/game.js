// ===================================================
// OKAPO MONEY CRASH — ゲーム本体ロジック（シンプル版）
// ---------------------------------------------------
// ミッション・タイムアタック・コンボ・ランク・実績はすべて廃止。
// 「紙幣を燃やす／破る → 破壊した合計金額が増える」だけのゲーム。
// ===================================================

// ---- 汎用ヘルパー ----
function formatNumber(n) {
  return Math.round(n).toLocaleString("en-US");
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function layoutPositions(count, w, h) {
  const safeW = Math.max(w, 240);
  const safeH = Math.max(h, 240);
  const cols = Math.max(1, Math.round(Math.sqrt(count * (safeW / safeH))));
  const rows = Math.ceil(count / cols);
  const marginX = safeW * 0.11;
  const marginY = safeH * 0.13;
  const cellW = (safeW - marginX * 2) / cols;
  const cellH = (safeH - marginY * 2) / rows;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (Math.random() - 0.5) * cellW * 0.42;
    const jitterY = (Math.random() - 0.5) * cellH * 0.42;
    positions.push({
      x: marginX + cellW * (col + 0.5) + jitterX,
      y: marginY + cellH * (row + 0.5) + jitterY,
    });
  }
  // シャッフルして額面の並びが毎回変わるようにする
  for (let i = positions.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions;
}

const FIELD_NOTE_COUNT = 10;

class MoneyCrashGame {
  constructor() {
    this.listeners = {};
    this.notes = [];
    this.selectedTool = TOOL_ORDER[0]; // 'fire'
    this.pointer = { down: false, x: 0, y: 0, lastX: 0, lastY: 0, tearNote: null };
    this._lastTs = 0;

    this.data = Storage.load();
    this.totalDestroyed = this.data.totalDestroyed;
  }

  on(event, cb) {
    (this.listeners[event] = this.listeners[event] || []).push(cb);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }

  init(gameAreaEl, notesLayerEl, canvasEl) {
    this.gameAreaEl = gameAreaEl;
    this.notesLayer = notesLayerEl;
    ParticleSystem.init(canvasEl);

    this.gameAreaEl.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    window.addEventListener("pointermove", (e) => this._onPointerMove(e));
    window.addEventListener("pointerup", (e) => this._onPointerUp(e));
    window.addEventListener("pointercancel", (e) => this._onPointerUp(e));

    this._loop = this._loop.bind(this);
    this.resetField();
    this.emit("statsChange", this.getStatsSnapshot());
    requestAnimationFrame(this._loop);
  }

  areaSize() {
    const r = this.gameAreaEl.getBoundingClientRect();
    return { width: r.width, height: r.height };
  }

  selectTool(id) {
    if (!TOOLS[id]) return;
    this.selectedTool = id;
    this.pointer.tearNote = null;
    this.emit("toolChange", id);
  }

  // ---------------------------------------------------
  // フィールド管理
  // ---------------------------------------------------
  resetField() {
    this.clearField();
    this._spawnField(FIELD_NOTE_COUNT);
    this.emit("fieldChange", { count: this.notes.length });
  }

  clearField() {
    this.notes.forEach((n) => n.remove());
    this.notes = [];
    ParticleSystem.clear();
  }

  _spawnField(count) {
    const area = this.areaSize();
    const positions = layoutPositions(count, area.width, area.height);
    for (let i = 0; i < count; i++) {
      this._addNote(this._pickDenomination(), positions[i].x, positions[i].y);
    }
  }

  _pickDenomination() {
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < DENOMINATIONS.length; i++) {
      acc += DENOMINATION_WEIGHTS[i];
      if (r <= acc) return DENOMINATIONS[i];
    }
    return DENOMINATIONS[DENOMINATIONS.length - 1];
  }

  _addNote(denomination, x, y) {
    const note = new Note(denomination, x, y);
    this.notesLayer.appendChild(note.el);
    note.el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._activateNoteViaKeyboard(note);
      }
    });
    this.notes.push(note);
    return note;
  }

  // ---------------------------------------------------
  // 破壊処理
  // ---------------------------------------------------
  destroyNote(note, reason) {
    if (!note || note.destroyed) return;
    note.markDestroyed();
    const x = note.centerX();
    const y = note.centerY();
    const value = note.value;

    this.totalDestroyed += value;
    this.data.totalDestroyed = this.totalDestroyed;
    Storage.save(this.data);

    if (reason === "burn") {
      ParticleSystem.spawnAsh(x, y, 14);
    } else {
      ParticleSystem.spawnConfetti(x, y, 16, ["#efe7d6", "#cfc4a8", "#b9a97e"]);
    }
    AudioManager.destroy(value);

    this.emit("scorePopup", { x, y, amount: value });
    this._removeNoteFromField(note);
    this.emit("statsChange", this.getStatsSnapshot());
  }

  _removeNoteFromField(note) {
    const idx = this.notes.indexOf(note);
    if (idx >= 0) this.notes.splice(idx, 1);
    note.el.classList.add("is-gone");
    setTimeout(() => note.remove(), 320);
    this.emit("fieldChange", { count: this.notes.length });
  }

  getStatsSnapshot() {
    return { totalDestroyed: this.totalDestroyed };
  }

  getNoteByEl(el) {
    return this.notes.find((n) => n.el === el);
  }

  // ---------------------------------------------------
  // ポインター入力
  // ---------------------------------------------------
  _localPointOnNote(note, px, py, areaRect) {
    const r = note.el.getBoundingClientRect();
    const lx = (px + areaRect.left - r.left) / Math.max(1, r.width);
    const ly = (py + areaRect.top - r.top) / Math.max(1, r.height);
    return { x: clamp01(lx), y: clamp01(ly) };
  }

  _relativePoint(e) {
    const rect = this.gameAreaEl.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, rect };
  }

  _onPointerDown(e) {
    AudioManager.unlock();
    const { x: px, y: py, rect } = this._relativePoint(e);
    this.pointer.down = true;
    this.pointer.x = px;
    this.pointer.y = py;
    this.pointer.lastX = px;
    this.pointer.lastY = py;

    const noteEl = e.target.closest ? e.target.closest(".okapo-note") : null;
    if (!noteEl) return;
    const note = this.getNoteByEl(noteEl);
    if (!note || note.destroyed) return;

    if (this.selectedTool === "fire") {
      const wasIgnited = note.ignited;
      const local = this._localPointOnNote(note, px, py, rect);
      note.ignite(local.x, local.y);
      if (!wasIgnited) {
        AudioManager.ignite();
        ParticleSystem.spawnSmoke(note.x, note.y, 3);
      }
    } else if (this.selectedTool === "tear") {
      this.pointer.tearNote = note;
      AudioManager.tear();
    }
  }

  _onPointerMove(e) {
    if (!this.pointer.down) return;
    const { x: px, y: py } = this._relativePoint(e);
    const dist = Math.hypot(px - this.pointer.lastX, py - this.pointer.lastY);

    if (this.selectedTool === "tear" && this.pointer.tearNote && dist > 0.5) {
      const note = this.pointer.tearNote;
      if (!note.destroyed) {
        note.applyTear(dist);
        if (Math.random() < 0.4) ParticleSystem.spawnAsh(px, py, 2);
      }
    }

    this.pointer.x = px;
    this.pointer.y = py;
    this.pointer.lastX = px;
    this.pointer.lastY = py;
  }

  _onPointerUp() {
    this.pointer.down = false;
    this.pointer.tearNote = null;
  }

  _activateNoteViaKeyboard(note) {
    if (note.destroyed) return;
    if (this.selectedTool === "fire") {
      const wasIgnited = note.ignited;
      note.ignite(0.5, 0.5);
      if (!wasIgnited) AudioManager.ignite();
    } else if (this.selectedTool === "tear") {
      note.applyTear(36);
      AudioManager.tear();
    }
  }

  // ---------------------------------------------------
  // メインループ
  // ---------------------------------------------------
  _loop(ts) {
    const dt = this._lastTs ? Math.min((ts - this._lastTs) / 1000, 0.05) : 0;
    this._lastTs = ts;

    const completed = [];
    for (const note of this.notes) {
      const done = note.update(dt);
      if (done) completed.push(note);
      else if (note.isBurningActive) {
        if (Math.random() < 0.3) ParticleSystem.spawnSmoke(note.x, note.y - 18, 1);
        if (Math.random() < 0.45) ParticleSystem.spawnEmber(note.x + (Math.random() - 0.5) * 18, note.y, 1);
      }
    }
    completed.forEach((n) => this.destroyNote(n, n.burnProgress >= FIRE_CONFIG.complete ? "burn" : "tear"));

    ParticleSystem.update(dt);
    ParticleSystem.draw();

    this._raf = requestAnimationFrame(this._loop);
  }
}
