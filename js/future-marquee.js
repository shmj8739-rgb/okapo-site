// ===================================================
// FUTURE OKAPO — 「未来のおかぽ」広告風バナーの自動横スクロール
//
// 仕様:
// ・.future-track 内のカードを複製して2セット分並べ、CSSの
//   @keyframes（future-marquee-right, animation-iteration-count: infinite）
//   で右方向へ無限にループさせる。
// ・ページを開いた瞬間から自動で動き続け、途中で止まらない。
// ・マウスホバー / キーボードフォーカス中は CSS の :hover / :focus-within
//   だけで一時停止・再開する（JSのタイマー管理に依存しない）。
// ・タッチ操作中だけ JS でクラスを付け外しして一時停止する。
//
// 実装メモ:
// ・以前は JS の setTimeout ループで transform を毎フレーム書き換えて
//   いたが、JS側の状態管理（pause フラグの取りこぼし等）や
//   タブの状態次第で「途中で止まる」リスクがあった。
//   CSS animation はブラウザのコンポジタスレッドが駆動するため、
//   JSに何が起きても infinite ループ自体は止まらない。
//   JSの役割は「カードの複製」「1周分の距離から再生時間を算出して
//   CSS変数にセット」「タッチ中だけ一時停止クラスを付け外し」の3つに
//   限定している。
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

  // シームレスループのためにカード一式を複製して後ろに連結する。
  // これで .future-track は「オリジナル1セット + 複製1セット」の
  // 2セット構成になり、CSS側は translateX(-50%) から translateX(0%)
  // へアニメーションするだけで、ループの継ぎ目が見えなくなる。
  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("tabindex", "-1");
    track.appendChild(clone);
  });

  const SPEED_PX_PER_SEC = 34; // ゆっくり読める速度
  const TOUCH_RESUME_DELAY_MS = 300; // 指を離してから再開するまでの待ち時間

  // 1セット分の幅（px）から、その距離を SPEED_PX_PER_SEC で進むのに
  // かかる秒数を計算し、CSSアニメーションの再生時間として渡す。
  const measure = () => {
    const setWidth = track.scrollWidth / 2;
    if (setWidth > 0) {
      const durationSec = setWidth / SPEED_PX_PER_SEC;
      track.style.setProperty("--future-duration", `${durationSec}s`);
    }
    // 計測・CSS変数のセットが済んでからアニメーションを有効化する
    // （幅が確定する前に animation-iteration-count: infinite が
    // 走り出して、変な位置からループが始まるのを防ぐため）。
    track.classList.add("is-marquee-ready");
  };
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  // Webフォント読み込み完了でカード幅が変わるケースに備えて再計測する。
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(() => {});
  }

  // タッチ操作中だけ一時停止し、指を離したら再開する
  // （ホバー・キーボードフォーカスは CSS 側の :hover / :focus-within
  //   だけで完結しているので、ここではタッチだけを扱う）。
  let touchResumeTimer = null;

  const pauseForTouch = () => {
    if (touchResumeTimer) {
      clearTimeout(touchResumeTimer);
      touchResumeTimer = null;
    }
    track.classList.add("is-touch-paused");
  };

  const scheduleTouchResume = () => {
    if (touchResumeTimer) clearTimeout(touchResumeTimer);
    touchResumeTimer = setTimeout(() => {
      track.classList.remove("is-touch-paused");
    }, TOUCH_RESUME_DELAY_MS);
  };

  viewport.addEventListener("touchstart", pauseForTouch, { passive: true });
  viewport.addEventListener("touchend", scheduleTouchResume, { passive: true });
  viewport.addEventListener("touchcancel", scheduleTouchResume, { passive: true });
});
