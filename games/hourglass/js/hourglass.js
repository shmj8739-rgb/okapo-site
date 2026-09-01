/* =====================================================================
   hourglass.js
   このゲームの中心ビジュアル。SVG の砂時計を描画し、
   経過率（0..1）に応じて上下の砂の量を更新する。

   ・上のチャンバー … 残された時間（remainingRatio ぶん満ちている。減っていく）
   ・下のチャンバー … これまで生きた時間（elapsedRatio ぶん積もっていく）
   ・首の落下（stream + grains）は経過率が 0 < e < 1 のときだけ表示し、
     「今この瞬間も時間は流れている」ことを静かに示す。

   デザイン：木製フレームなし。ガラスそのものを主役にした未来的・ミニマルな砂時計。
   シルエットは中央軸（x=150）に対して完全対称、かつ上下も首（y=226）に対して対称。
     右側の制御点 (cx,cy) は必ず左側 (300-cx,cy) と対になっている。

   幾何は viewBox 0 0 300 452 の固定座標。見た目の CSS は style.css 側。
   prefers-reduced-motion では tween せず即座に反映する（アニメ速度・計算は不変）。
===================================================================== */
window.LH = window.LH || {};

LH.Hourglass = (function () {
  /* チャンバーの上端・首・下端（SVG ユーザー座標）。
     すべて中央軸 x=150 に対して左右対称、首 y=226 に対して上下対称。 */
  var TOP_TOP = 44;         // 上チャンバーの天井
  var TOP_BOTTOM_Y = 224;   // 上チャンバー下端（くびれの上側）
  var BOT_TOP_Y = 228;      // 下チャンバー上端（くびれの下側）
  var BOT_BOTTOM = 408;     // 下チャンバーの床
  var TOP_SPAN = TOP_BOTTOM_Y - TOP_TOP;   // 180
  var BOT_SPAN = BOT_BOTTOM - BOT_TOP_Y;   // 180（上と同じ＝対称）

  /* 完全対称シルエット（右壁 → くびれ → 下 → 左壁 → くびれ → 上 と一周）。
     右側の制御点 cx は左側では 300-cx（例 252↔48, 190↔110, 154↔146）。 */
  var SILHOUETTE =
    'M48 44 L252 44 ' +
    'C252 118 190 176 154 222 ' +   // 右壁 → くびれ上（滑らかに絞る）
    'C152 224 152 228 154 230 ' +   // 右のくびれ（細いのど）
    'C190 276 252 334 252 408 ' +   // くびれ下 → 右下
    'L48 408 ' +
    'C48 334 110 276 146 230 ' +    // 左下 → くびれ下
    'C148 228 148 224 146 222 ' +   // 左のくびれ
    'C110 176 48 118 48 44 Z';      // くびれ上 → 左上

  var CLIP_TOP =
    'M48 44 L252 44 C252 118 190 176 154 222 ' +
    'C152 224 148 224 146 222 C110 176 48 118 48 44 Z';
  var CLIP_BOTTOM =
    'M154 230 C190 276 252 334 252 408 L48 408 ' +
    'C48 334 110 276 146 230 C148 228 152 228 154 230 Z';

  var SVG =
    '<svg class="lh-hg" viewBox="0 0 300 452" role="img" aria-label="人生の砂時計">' +
      '<defs>' +
        '<linearGradient id="lh-sand-grad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#cdbff8"/>' +
          '<stop offset="0.3" stop-color="#a794f4"/>' +
          '<stop offset="1" stop-color="#7d6ade"/>' +
        '</linearGradient>' +
        '<linearGradient id="lh-glass-fill-grad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="rgba(154,134,255,0.06)"/>' +
          '<stop offset="0.5" stop-color="rgba(255,255,255,0.015)"/>' +
          '<stop offset="1" stop-color="rgba(154,134,255,0.06)"/>' +
        '</linearGradient>' +
        '<linearGradient id="lh-glass-stroke-grad" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="rgba(198,190,255,0.14)"/>' +
          '<stop offset="0.5" stop-color="rgba(214,208,255,0.55)"/>' +
          '<stop offset="1" stop-color="rgba(198,190,255,0.14)"/>' +
        '</linearGradient>' +
        '<radialGradient id="lh-halo-grad" cx="0.5" cy="0.5" r="0.5">' +
          '<stop offset="0" stop-color="rgba(150,124,255,0.30)"/>' +
          '<stop offset="0.55" stop-color="rgba(150,124,255,0.08)"/>' +
          '<stop offset="1" stop-color="rgba(150,124,255,0)"/>' +
        '</radialGradient>' +
        '<clipPath id="lh-clip-top"><path d="' + CLIP_TOP + '"/></clipPath>' +
        '<clipPath id="lh-clip-bottom"><path d="' + CLIP_BOTTOM + '"/></clipPath>' +
      '</defs>' +

      '<ellipse class="lh-halo" cx="150" cy="226" rx="118" ry="172" fill="url(#lh-halo-grad)"/>' +

      /* ガラスの中身（うっすらとした体積感。砂の背面に置く） */
      '<path class="lh-glass-fill" d="' + SILHOUETTE + '" fill="url(#lh-glass-fill-grad)"/>' +

      /* 上の砂：残された時間 */
      '<g clip-path="url(#lh-clip-top)">' +
        '<rect class="lh-sand-top" x="46" width="208" y="44" height="184" fill="url(#lh-sand-grad)" fill-opacity="0.9"/>' +
      '</g>' +

      /* 落ちる砂（下チャンバーにクリップ）— 積もった砂より先に描いて隠れるようにする */
      '<g class="lh-flow">' +
        '<g clip-path="url(#lh-clip-bottom)">' +
          '<rect class="lh-stream" x="148.5" y="224" width="3" height="186" fill="url(#lh-sand-grad)"/>' +
        '</g>' +
        '<g class="lh-grains" clip-path="url(#lh-clip-bottom)">' +
          '<circle cx="150" cy="230" r="1.5"/>' +
          '<circle cx="150" cy="230" r="1.2"/>' +
          '<circle cx="150" cy="230" r="1.8"/>' +
          '<circle cx="150" cy="230" r="1.3"/>' +
        '</g>' +
      '</g>' +

      /* 下の砂：これまで生きた時間 */
      '<g clip-path="url(#lh-clip-bottom)">' +
        '<rect class="lh-sand-bottom" x="46" width="208" y="404" height="6" fill="url(#lh-sand-grad)" fill-opacity="0.92"/>' +
        '<ellipse class="lh-mound" cx="150" cy="404" rx="54" ry="6" fill="url(#lh-sand-grad)" fill-opacity="0.7"/>' +
      '</g>' +

      /* ガラスの輪郭（細い線。砂の上に重ねてエッジをくっきり） */
      '<path class="lh-glass-outline" d="' + SILHOUETTE + '" fill="none" ' +
        'stroke="url(#lh-glass-stroke-grad)" stroke-width="1.6"/>' +

      /* 内側のかすかな映り込み（左右対称の短い弧） */
      '<path class="lh-glass-sheen" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1.2" stroke-linecap="round" ' +
        'd="M72 66 C86 122 114 166 144 206 M228 66 C214 122 186 166 156 206"/>' +

      /* ガラスの口（木枠ではなく、細い光の線） */
      '<line class="lh-rim" x1="46" y1="44" x2="254" y2="44"/>' +
      '<line class="lh-rim" x1="46" y1="408" x2="254" y2="408"/>' +
    '</svg>';

  var wrap = null;
  var refs = {};
  var displayed = 0; // 現在表示中の経過率
  var raf = null;

  function reduceMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function mount(container) {
    wrap = container;
    wrap.innerHTML = SVG;
    refs.sandTop = wrap.querySelector('.lh-sand-top');
    refs.sandBottom = wrap.querySelector('.lh-sand-bottom');
    refs.mound = wrap.querySelector('.lh-mound');
    apply(0);
  }

  /* 経過率 e（0..1）を即座に反映する */
  function apply(e) {
    e = LH.calc.clamp(e, 0, 1);
    var r = 1 - e;

    var topY = TOP_BOTTOM_Y - r * TOP_SPAN;
    refs.sandTop.setAttribute('y', topY.toFixed(1));
    refs.sandTop.setAttribute('height', (r * TOP_SPAN + 6).toFixed(1));

    var botY = BOT_BOTTOM - e * BOT_SPAN;
    refs.sandBottom.setAttribute('y', botY.toFixed(1));
    refs.sandBottom.setAttribute('height', (e * BOT_SPAN + 6).toFixed(1));
    refs.mound.setAttribute('cy', botY.toFixed(1));
    refs.mound.style.opacity = (e > 0.015 && e < 0.999) ? '1' : '0';

    var flowing = e > 0.001 && e < 0.999;
    wrap.classList.toggle('is-flowing', flowing);
  }

  /* 経過率をなめらかに更新する（入力のたびに呼ばれる。速度 700ms は不変） */
  function update(elapsedRatio) {
    var target = LH.calc.clamp(elapsedRatio, 0, 1);
    if (reduceMotion()) {
      displayed = target;
      apply(target);
      return;
    }
    if (raf) cancelAnimationFrame(raf);
    var start = displayed;
    var t0 = performance.now();
    var dur = 700;
    function step(now) {
      var k = Math.min((now - t0) / dur, 1);
      var eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      displayed = start + (target - start) * eased;
      apply(displayed);
      if (k < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  return { mount: mount, update: update };
})();
