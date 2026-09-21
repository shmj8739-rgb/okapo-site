// ===================================================
// OKAPO MONEY CRASH — 紙幣（Note）クラス
// ---------------------------------------------------
// 1枚の紙幣をDOM要素として生成する。持つ状態は2つだけ：
//   burnProgress（FIREで進む。0〜100。着火後は自動で進行）
//   tearProgress（TEARで進む。0〜100。なぞった距離だけ進行）
// どちらかが100に達したら破壊（update()がtrueを返す）。
//
// 見た目は「左右2つの破片（half）」を常に重ねて表示する構造。
// 2つのhalfはギザギザのclip-pathで噛み合っており、tearProgress=0の
// ときは重なって1枚の紙幣に見え、進むにつれて左右に裂けて離れていく。
// ===================================================

let __noteUid = 0;

// 完全に架空のシリアル番号を生成する（実在紙幣の記番号とは無関係の
// ランダムな英数字。雰囲気づけのための装飾用途のみ）。
function randomSerial() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXY";
  const l1 = letters[(Math.random() * letters.length) | 0];
  const l2 = letters[(Math.random() * letters.length) | 0];
  const digits = String((Math.random() * 900000 + 100000) | 0);
  return `${l1}${l2}${digits}`;
}

// 紙幣の「顔」部分のマークアップ。left/right どちらの破片にも同じ内容を
// 複製して使う（破れても両側に絵柄が残って見えるように）。
function noteFaceHTML(denomination, serial) {
  return `
    <div class="okapo-note-face">
      <div class="okapo-note-pattern" aria-hidden="true"></div>
      <div class="okapo-note-frame" aria-hidden="true"></div>
      <div class="okapo-note-corner okapo-note-corner--tl">${denomination.label}</div>
      <div class="okapo-note-corner okapo-note-corner--br">${denomination.label}</div>
      <div class="okapo-note-medallion" aria-hidden="true">
        <svg viewBox="0 0 60 60" width="34" height="34">
          <circle cx="30" cy="30" r="27" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.7"/>
          <circle cx="30" cy="24" r="9" fill="currentColor" opacity="0.55"/>
          <path d="M14 50 C14 36 46 36 46 50 Z" fill="currentColor" opacity="0.55"/>
        </svg>
      </div>
      <div class="okapo-note-center">
        <p class="okapo-note-value">${denomination.label}</p>
        <p class="okapo-note-unit">YEN</p>
      </div>
      <p class="okapo-note-bank">OKAPO CENTRAL BANK</p>
      <p class="okapo-note-serial">${serial}</p>
    </div>
  `;
}

class Note {
  constructor(denomination, x, y) {
    this.id = ++__noteUid;
    this.value = denomination.value;
    this.x = x;
    this.y = y;
    this.rot = (Math.random() - 0.5) * 12;
    this.burnProgress = 0;
    this.tearProgress = 0;
    this.ignited = false;
    this.destroyed = false;
    this.el = this._buildEl(denomination);
    this._applyTransform();
  }

  _buildEl(denomination) {
    const el = document.createElement("div");
    el.className = `okapo-note ${denomination.className}`;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", `${denomination.label}円札`);
    el.tabIndex = 0;
    const face = noteFaceHTML(denomination, randomSerial());
    el.innerHTML = `
      <div class="okapo-note-half okapo-note-half--a">${face}</div>
      <div class="okapo-note-half okapo-note-half--b">${face}</div>
      <div class="okapo-note-burn" aria-hidden="true"></div>
      <div class="okapo-note-flame" aria-hidden="true">
        <span class="okapo-note-flame-core"></span>
        <span class="okapo-note-flame-mid"></span>
        <span class="okapo-note-flame-tip"></span>
        <span class="okapo-note-flame-glow"></span>
      </div>
    `;
    return el;
  }

  _applyTransform() {
    this.el.style.setProperty("--x", `${this.x}px`);
    this.el.style.setProperty("--y", `${this.y}px`);
    this.el.style.setProperty("--rot", `${this.rot}deg`);
  }

  // ---- FIRE ----
  ignite(localX = 0.5, localY = 0.5) {
    if (this.destroyed || this.ignited) return;
    this.ignited = true;
    this.burnProgress = Math.max(this.burnProgress, 0.6);
    this.el.style.setProperty("--bx", `${localX * 100}%`);
    this.el.style.setProperty("--by", `${localY * 100}%`);
  }

  get isBurningActive() {
    return this.ignited && this.burnProgress > 0 && this.burnProgress < FIRE_CONFIG.complete;
  }

  // ---- TEAR ----
  // dist: 直前のポインター位置からの移動距離(px)
  applyTear(dist) {
    if (this.destroyed) return;
    this.tearProgress = Math.min(TEAR_CONFIG.complete, this.tearProgress + dist / TEAR_CONFIG.pxPerProgress);
    this.el.style.setProperty("--tear", (this.tearProgress / 100).toFixed(3));
  }

  get isTearingActive() {
    return this.tearProgress > 0 && this.tearProgress < TEAR_CONFIG.complete;
  }

  update(dt) {
    if (this.destroyed) return false;

    if (this.ignited && this.burnProgress < FIRE_CONFIG.complete) {
      this.burnProgress = Math.min(FIRE_CONFIG.complete, this.burnProgress + FIRE_CONFIG.autoBurnRate * dt);
      const p = this.burnProgress;
      this.el.style.setProperty("--burn", (p / 100).toFixed(3));
      this.el.style.setProperty("--r", `${Math.min(150, p * 1.55)}%`);
      this.el.classList.toggle("is-scorched", p >= FIRE_CONFIG.scorchStart && p < FIRE_CONFIG.burningStart);
      this.el.classList.toggle("is-burning-hot", p >= FIRE_CONFIG.burningStart && p < FIRE_CONFIG.ashStart);
      this.el.classList.toggle("is-ash", p >= FIRE_CONFIG.ashStart && p < FIRE_CONFIG.complete);
    }

    if (this.tearProgress > 0) {
      this.el.classList.toggle("is-tearing", this.tearProgress < TEAR_CONFIG.complete);
    }

    return this.burnProgress >= FIRE_CONFIG.complete || this.tearProgress >= TEAR_CONFIG.complete;
  }

  centerX() { return this.x; }
  centerY() { return this.y; }

  markDestroyed() {
    this.destroyed = true;
  }

  remove() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
}
