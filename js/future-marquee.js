// ===================================================
// FUTURE OKAPO — 「未来のおかぽ」広告風バナーの自動横スクロール
//
// 仕様:
// ・.future-track 内のカードを複製して2セット分並べ、
//   scrollLeft をゆっくり進めることでシームレスな無限ループを作る。
// ・マウスホバー / タッチ操作 / キーボードフォーカス中は自動再生を一時停止。
// ・手動でスワイプ/ドラッグした場合はネイティブスクロールに任せ、
//   操作が止まってしばらくしたら自動再生を再開する。
// ・prefers-reduced-motion が有効な環境では自動再生自体を行わず、
//   通常の横スクロール（スワイプ可能）のみを提供する。
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  const viewport = document.querySelector(".future-viewport");
  const track = document.querySelector(".future-track");

  if (!viewport || !track) return;

  const cards = Array.from(track.children);
  if (cards.length === 0) return;

  // クリック先が未定（href="#"）のカードは、ページ内ジャンプさせない。
  // 実際のリンクが決まったら index.html 側の href を差し替えるだけで、
  // この処理は自然に効かなくなる。
  track.addEventListener("click", (event) => {
    const card = event.target.closest(".future-card");
    if (card && card.getAttribute("href") === "#") {
      event.preventDefault();
    }
  });

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    // 自動スクロールは行わず、手動スワイプ/ドラッグのみ有効にする。
    return;
  }

  // シームレスループのためにカード一式を複製して後ろに連結する。
  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("tabindex", "-1");
    track.appendChild(clone);
  });

  const SPEED_PX_PER_SEC = 34; // ゆっくり読める速度
  const RESUME_DELAY_MS = 2200; // 操作停止後、自動再生を再開するまでの待ち時間

  let setWidth = 0;
  let paused = false;
  let resumeTimer = null;
  let lastTime = null;

  const measure = () => {
    // 複製後の全幅の半分 = オリジナル1セット分の幅
    setWidth = track.scrollWidth / 2;
  };
  measure();
  window.addEventListener("resize", measure);

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

  // ホバー・タッチ・キーボードフォーカス・ホイール操作中は一時停止
  viewport.addEventListener("pointerenter", pause);
  viewport.addEventListener("pointerleave", scheduleResume);
  viewport.addEventListener("focusin", pause);
  viewport.addEventListener("focusout", scheduleResume);
  ["pointerdown", "touchstart", "wheel"].forEach((eventName) => {
    viewport.addEventListener(eventName, pause, { passive: true });
  });
  ["pointerup", "touchend", "touchcancel"].forEach((eventName) => {
    viewport.addEventListener(eventName, scheduleResume, { passive: true });
  });

  const step = (time) => {
    if (!paused && setWidth > 0) {
      if (lastTime !== null) {
        const deltaSec = (time - lastTime) / 1000;
        viewport.scrollLeft += SPEED_PX_PER_SEC * deltaSec;
        if (viewport.scrollLeft >= setWidth) {
          viewport.scrollLeft -= setWidth;
        }
      }
      lastTime = time;
    } else {
      lastTime = null;
    }
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
});
