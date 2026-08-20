// ===================================================
// FUTURE OKAPO — 「未来のおかぽ」広告風バナーの自動横スクロール
//
// 仕様:
// ・.future-track 内のカードを複製して2セット分並べ、CSSの
//   @keyframes（future-marquee-right, animation-iteration-count: infinite）
//   で右方向へ無限にループさせる。
// ・ページを開いた瞬間から自動で動き続け、PC・スマホ問わず途中で止まらない。
// ・マウスホバー / キーボードフォーカス中は CSS の :hover / :focus-within
//   だけで一時停止・再開する（JSのタイマー管理に依存しない）。
// ・スマホ（タッチ操作）では一時停止させない。ページを指でスクロールする
//   際に必ずこの領域を指が通過するため、タッチ中だけ止める実装にすると
//   touchend が正しく後続しなかった場合に止まったまま戻らなくなるリスクが
//   あるため、タッチによる一時停止は行わない仕様にしている。
//
// 実装メモ:
// ・以前は JS の setTimeout ループで transform を毎フレーム書き換えて
//   いたが、JS側の状態管理（pause フラグの取りこぼし等）や
//   タブの状態次第で「途中で止まる」リスクがあった。
//   CSS animation はブラウザのコンポジタスレッドが駆動するため、
//   JSに何が起きても infinite ループ自体は止まらない。
//   JSの役割は「カードの複製」と「1周分の距離から再生時間を算出して
//   CSS変数にセットする」の2つに限定している。
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
  // 2セット構成になり、CSS側は translate3d(-50%,0,0) から
  // translate3d(0,0,0) へアニメーションするだけで、ループの継ぎ目が
  // 見えなくなる。
  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("tabindex", "-1");
    track.appendChild(clone);
  });

  const SPEED_PX_PER_SEC = 34; // ゆっくり読める速度

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
});
