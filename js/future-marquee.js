// ===================================================
// FUTURE OKAPO — 「未来のおかぽ」広告風バナーの自動横スクロール
//
// 仕様:
// ・.future-track 内のカードを複製して2セット分並べ、
//   transform: translateX() を少しずつ進めてシームレスな無限ループを作る。
// ・ページを開いた瞬間から自動で動き続け、途中で止まったままにはならない。
// ・マウスホバー / タッチ操作 / キーボードフォーカス中だけ一時停止し、
//   離れると自動再生を再開する。
// ・スマホ / タッチトラックパッドでは指でドラッグして手動スクロールできる。
//
// 実装メモ:
// ・requestAnimationFrame はタブが非アクティブになると呼び出しが
//   止まるブラウザが多く、「常に動き続ける」という要件を満たせない。
//   そのため setTimeout による経過時間ベースのループを採用している。
// ・ネイティブの overflow-x スクロール（scrollLeft）ではなく
//   transform: translateX() で位置を管理している。scrollLeft は
//   ブラウザによってスクロール位置の内部更新が最適化・遅延される
//   ことがあるが、transform は常に即座に反映されるため。
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  const viewport = document.querySelector(".future-viewport");
  const track = document.querySelector(".future-track");

  if (!viewport || !track) return;

  const cards = Array.from(track.children);
  if (cards.length === 0) return;

  // ドラッグ操作の直後に発生するクリックは無視する（誤クリック防止）。
  let suppressClickUntil = 0;

  // クリック先が未定（href="#"）のカードは、ページ内ジャンプさせない。
  // 実際のリンクが決まったら index.html 側の href を差し替えるだけで、
  // この処理は自然に効かなくなる。
  track.addEventListener("click", (event) => {
    if (Date.now() < suppressClickUntil) {
      event.preventDefault();
      return;
    }
    const card = event.target.closest(".future-card");
    if (card && card.getAttribute("href") === "#") {
      event.preventDefault();
    }
  });

  // シームレスループのためにカード一式を複製して後ろに連結する。
  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("tabindex", "-1");
    track.appendChild(clone);
  });

  const SPEED_PX_PER_SEC = 34; // ゆっくり読める速度
  const RESUME_DELAY_MS = 2200; // 操作停止後、自動再生を再開するまでの待ち時間
  const TICK_MS = 40; // 約25fps相当。setTimeoutなのでバックグラウンドでも進み続ける
  const DRAG_THRESHOLD_PX = 4; // これ未満の移動はクリックとして扱う

  let setWidth = 0; // 複製前1セット分の幅（この分だけ動いたらループさせる）
  let offset = 0; // 現在の左方向オフセット（0 〜 setWidth）
  let paused = false;
  let resumeTimer = null;
  let lastTime = null;

  let dragging = false;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let dragMoved = false;

  const normalizeOffset = () => {
    if (setWidth <= 0) return;
    offset = ((offset % setWidth) + setWidth) % setWidth;
  };

  const applyTransform = () => {
    track.style.transform = `translateX(${-offset}px)`;
  };

  const measure = () => {
    // 複製後の全幅の半分 = オリジナル1セット分の幅
    setWidth = track.scrollWidth / 2;
    normalizeOffset();
    applyTransform();
  };
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  // Webフォント読み込み完了でカード幅が変わるケースに備えて再計測する。
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(() => {});
  }

  const pause = () => {
    paused = true;
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  };

  const scheduleResume = () => {
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      paused = false;
      lastTime = null;
    }, RESUME_DELAY_MS);
  };

  // マウスホバー中は一時停止（タッチのホバー相当イベントは無視し、
  // ドラッグ操作側で個別に制御する）。
  viewport.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") pause();
  });
  viewport.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && !dragging) scheduleResume();
  });

  // キーボードフォーカス中も一時停止。
  viewport.addEventListener("focusin", pause);
  viewport.addEventListener("focusout", scheduleResume);

  // ドラッグ / スワイプ操作。
  const onPointerDown = (event) => {
    dragging = true;
    dragMoved = false;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartOffset = offset;
    pause();
    if (viewport.setPointerCapture) {
      try {
        viewport.setPointerCapture(dragPointerId);
      } catch (err) {
        // キャプチャに失敗しても致命的ではないので無視する。
      }
    }
  };

  const onPointerMove = (event) => {
    if (!dragging || event.pointerId !== dragPointerId) return;
    const deltaX = event.clientX - dragStartX;
    if (Math.abs(deltaX) > DRAG_THRESHOLD_PX) dragMoved = true;
    offset = dragStartOffset - deltaX;
    normalizeOffset();
    applyTransform();
  };

  const endDrag = (event) => {
    if (!dragging || (dragPointerId !== null && event.pointerId !== dragPointerId)) {
      return;
    }
    dragging = false;
    dragPointerId = null;
    if (dragMoved) {
      suppressClickUntil = Date.now() + 300;
    }
    scheduleResume();
  };

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  const tick = () => {
    const now = Date.now();
    if (!paused && !dragging && setWidth > 0) {
      if (lastTime !== null) {
        const deltaSec = (now - lastTime) / 1000;
        offset += SPEED_PX_PER_SEC * deltaSec;
        normalizeOffset();
        applyTransform();
      }
      lastTime = now;
    } else {
      lastTime = null;
    }
    setTimeout(tick, TICK_MS);
  };

  setTimeout(tick, TICK_MS);
});
