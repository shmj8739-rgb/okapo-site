/* =====================================================================
   hourglass.js
   このゲームの中心ビジュアル。

   ・ベース画像：assets/hourglass-main.png（参考画像そのもの。編集しない）
   ・その上に透明キャンバスを重ね、「上→くびれ→下」へ落ちる紫の砂粒だけを
     JavaScript で描画する。画像に含まれる砂とケンカしないよう、粒子は
     くびれ周辺の細い経路だけを通り、下チャンバー上部で発光して消える。

   ▼ 時間との連動
     LH.Hourglass.update(elapsedRatio) で受け取った経過率 e を使う。
       ・e が 0 または 1（砂が落ちきった／落ちる前）… 粒子を出さない
       ・e が増えるほど、発生ラインをわずかに下げ、消滅（着地）ラインを
         わずかに上げる＝「上の砂が減り、下に積もっていく」気配を出す
     ※ 計算そのもの（calc.js）には一切触れない。読み取るだけ。

   ▼ API（ui.js との契約は不変）
     LH.Hourglass.mount(container)
     LH.Hourglass.update(elapsedRatio)

   ▼ prefers-reduced-motion では rAF を回さず、静かなストリームを1枚だけ描く。
===================================================================== */
window.LH = window.LH || {};

LH.Hourglass = (function () {
  'use strict';

  var IMG_SRC = 'assets/hourglass-main.png';

  /* 参考画像（280x404）内での砂時計の首まわりの位置（0..1 の比率）。
     画像を直接いじらず、この座標系の上に粒子を重ねる。 */
  var GEO = {
    centerX: 0.5,
    neckY: 0.495,       // くびれ（画像でいちばん細い所）
    spawnYbase: 0.400,  // 粒子の発生ライン（上の砂の底あたり）
    landYbase: 0.660,   // 下の砂に触れて発光して消えるライン
    neckHalfW: 0.030,   // くびれの半幅
    spawnHalfW: 0.072,  // 発生時の横ひろがり
    landHalfW: 0.120    // 下チャンバーでの横ひろがり
  };

  /* 粒子色：紫 / 青紫 / ごく淡い白紫 */
  var PALETTE = [
    [167, 139, 250],
    [139, 124, 246],
    [124, 109, 240],
    [206, 196, 255],
    [231, 226, 255]
  ];

  var wrap = null, canvas = null, ctx = null, img = null;
  var dpr = 1, cw = 0, ch = 0;
  var particles = [];
  var lastSpawn = 0, lastFrame = 0, rafId = null, fallbackTimer = null;
  var elapsed = 0;
  var reduce = false;

  function isReduced() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function nowMs() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }
  function clamp(n, a, b) { return n < a ? a : (n > b ? b : n); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function mount(container) {
    if (!container) return;
    wrap = container;
    wrap.innerHTML =
      '<img class="lh-hg-img" src="' + IMG_SRC + '" ' +
        'alt="ゴールドの機械式砂時計" width="280" height="404" ' +
        'decoding="async" draggable="false">' +
      '<canvas class="lh-hg-canvas" aria-hidden="true"></canvas>';

    img = wrap.querySelector('.lh-hg-img');
    canvas = wrap.querySelector('.lh-hg-canvas');
    ctx = canvas.getContext('2d');
    reduce = isReduced();

    resize();
    if (img) img.addEventListener('load', resize);

    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(resize).observe(wrap);
    } else {
      window.addEventListener('resize', resize);
    }

    if (reduce) {
      drawStatic();
    } else {
      lastFrame = nowMs();
      start();
      // 保険：タブが非アクティブ等で rAF が止まっても animation を絶やさない。
      // rAF が回っているときは何もしない（frame() 側の間隔チェックで空振り）。
      if (fallbackTimer == null) fallbackTimer = setInterval(fallbackTick, 500);
    }
  }

  function start() {
    if (rafId == null && !reduce) rafId = requestAnimationFrame(loop);
  }

  function fallbackTick() {
    if (reduce) return;
    var t = nowMs();
    if (t - lastFrame > 650) frame(t);   // rAF が停止している → 手動で1歩進める
  }

  function update(elapsedRatio) {
    var e = Number(elapsedRatio);
    if (isFinite(e)) elapsed = clamp(e, 0, 1);
    if (reduce) drawStatic();
    else start();   // 何かの理由でループが止まっていたら復帰させる
  }

  function resize() {
    if (!canvas || !wrap) return;
    var r = wrap.getBoundingClientRect();
    cw = r.width; ch = r.height;
    if (cw <= 0 || ch <= 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce) drawStatic();
  }

  /* 経過率に応じたライン位置（比率）。 */
  function spawnY() { return GEO.spawnYbase + 0.055 * elapsed; }
  function landY()  { return GEO.landYbase  - 0.085 * elapsed; }
  function isFlowing() { return elapsed > 0.0005 && elapsed < 0.9995; }

  function spawn() {
    var t = Math.random() * Math.random();       // 中央寄りのばらつき
    var side = Math.random() < 0.5 ? -1 : 1;
    var x0 = GEO.centerX + side * t * GEO.spawnHalfW + (Math.random() - 0.5) * 0.008;
    particles.push({
      x0: x0,
      cx: x0,
      y: spawnY() + (Math.random() - 0.5) * 0.018,
      vy: 0.0035 + Math.random() * 0.0018,
      wobA: 0.005 + Math.random() * 0.009,       // 横ゆれ幅（比率）
      wobF: 1.3 + Math.random() * 1.7,           // 横ゆれ速さ
      phase: Math.random() * Math.PI * 2,
      driftSide: (Math.random() - 0.5) * 2,
      r: 0.75 + Math.random() * 1.15,            // 基準半径（cw=300 相当の px）
      col: PALETTE[(Math.random() * PALETTE.length) | 0],
      alpha: 0
    });
  }

  /* 1 フレーム進める。rAF からも fallbackTick からも呼ばれる。 */
  function frame(tNow) {
    var dt = clamp((tNow - lastFrame) / 16.6667, 0, 3);   // 1 = 60fps 基準
    lastFrame = tNow;
    step(dt, tNow);
    render(tNow);
  }

  function loop() {
    rafId = null;
    frame(nowMs());
    // 常に次フレームを予約する（タブ非表示時はブラウザが自動で保留・復帰）。
    if (!reduce) rafId = requestAnimationFrame(loop);
  }

  function step(dt, tNow) {
    var flowing = isFlowing();
    var MAX_P = 26, INTERVAL = 50;   // ms

    if (flowing && (tNow - lastSpawn) > INTERVAL && particles.length < MAX_P) {
      spawn();
      lastSpawn = tNow;
    }

    var nY = GEO.neckY, sY = spawnY(), lY = landY();

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];

      p.vy += 0.00022 * dt;                 // ゆるやかに加速
      if (p.vy > 0.011) p.vy = 0.011;       // 終端速度
      p.y += p.vy * dt;

      if (p.alpha < 1) p.alpha = Math.min(1, p.alpha + 0.055 * dt);
      if (p.y > lY) p.alpha -= 0.05 * dt;   // 着地帯で発光しながら消える

      var wob = Math.sin(tNow * 0.006 * p.wobF + p.phase) * p.wobA;

      if (p.y < nY) {
        // 上：発生位置 → くびれへ収束（横ゆれも一緒に細くなる）
        var k = ease(clamp((p.y - sY) / Math.max(nY - sY, 0.001), 0, 1));
        var funnelW = lerp(GEO.spawnHalfW, GEO.neckHalfW, k);
        p.cx = lerp(p.x0, GEO.centerX, k) + wob * (funnelW / GEO.spawnHalfW);
      } else {
        // 下：くびれ → 下チャンバーへゆるく広がる
        var k2 = ease(clamp((p.y - nY) / Math.max(lY - nY, 0.001), 0, 1));
        var spreadW = lerp(GEO.neckHalfW, GEO.landHalfW, k2);
        p.cx = GEO.centerX + p.driftSide * spreadW * k2 + wob * 0.5;
      }

      if (p.alpha <= 0 || p.y > lY + 0.09) particles.splice(i, 1);
    }
  }

  function render(tNow) {
    if (!ctx || cw <= 0) return;
    ctx.clearRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'lighter';

    var scale = cw / 300;

    if (isFlowing()) {
      var sYpx = spawnY() * ch, lYpx = landY() * ch, xpx = GEO.centerX * cw, nYpx = GEO.neckY * ch;

      // 中央のごく淡い連続ストリーム
      var shimmer = 0.09 + 0.035 * Math.sin(tNow * 0.004);
      var g = ctx.createLinearGradient(0, sYpx, 0, lYpx);
      g.addColorStop(0, 'rgba(150,124,255,0)');
      g.addColorStop(0.16, 'rgba(162,138,255,' + shimmer.toFixed(3) + ')');
      g.addColorStop(0.5, 'rgba(188,168,255,' + (shimmer * 1.7).toFixed(3) + ')');
      g.addColorStop(0.84, 'rgba(162,138,255,' + shimmer.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(150,124,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(xpx - 1.3 * scale, sYpx, 2.6 * scale, lYpx - sYpx);

      // くびれのわずかな発光（ゆっくり脈打つ）
      var pulse = 0.14 + 0.06 * Math.sin(tNow * 0.0022);
      var ng = ctx.createRadialGradient(xpx, nYpx, 0, xpx, nYpx, 26 * scale);
      ng.addColorStop(0, 'rgba(176,150,255,' + pulse.toFixed(3) + ')');
      ng.addColorStop(1, 'rgba(176,150,255,0)');
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.arc(xpx, nYpx, 26 * scale, 0, Math.PI * 2); ctx.fill();
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var a = clamp(p.alpha, 0, 1);
      if (a <= 0) continue;
      var x = p.cx * cw, y = p.y * ch;
      var c = p.col, rr = p.r * scale;

      var gr = rr * 5.4;
      var rad = ctx.createRadialGradient(x, y, 0, x, y, gr);
      rad.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.6 * a).toFixed(3) + ')');
      rad.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = rad;
      ctx.beginPath(); ctx.arc(x, y, gr, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(' +
        Math.min(255, c[0] + 40) + ',' +
        Math.min(255, c[1] + 40) + ',' +
        Math.min(255, c[2] + 32) + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  /* reduced-motion 用：動かさず、静かなストリーム＋まばらな点を1枚だけ */
  function drawStatic() {
    if (!ctx || cw <= 0) return;
    ctx.clearRect(0, 0, cw, ch);
    if (!isFlowing()) return;
    var scale = cw / 300;
    ctx.globalCompositeOperation = 'lighter';
    var sYpx = spawnY() * ch, lYpx = landY() * ch, xpx = GEO.centerX * cw;
    var g = ctx.createLinearGradient(0, sYpx, 0, lYpx);
    g.addColorStop(0, 'rgba(150,124,255,0)');
    g.addColorStop(0.5, 'rgba(178,158,255,0.12)');
    g.addColorStop(1, 'rgba(150,124,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(xpx - 1.1 * scale, sYpx, 2.2 * scale, lYpx - sYpx);
    for (var i = 0; i < 5; i++) {
      var yy = sYpx + (lYpx - sYpx) * (i + 0.5) / 5;
      ctx.fillStyle = 'rgba(184,164,255,0.5)';
      ctx.beginPath();
      ctx.arc(xpx + (i % 2 ? 1.4 : -1.4) * scale, yy, 1.1 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  return { mount: mount, update: update };
})();
