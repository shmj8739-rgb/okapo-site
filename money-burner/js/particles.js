// ===================================================
// OKAPO MONEY BURNER — パーティクルシステム（Canvas）
// ---------------------------------------------------
// 火の粉・煙・灰・紙片・爆風の粒子をすべて1枚のcanvasにまとめて描画する。
// DOM要素を粒子ごとに生成しない（重くなるため）。
// requestAnimationFrame駆動、配列は使い回し、上限を超えたら古い粒子から間引く。
// ===================================================

const ParticleSystem = (() => {
  const MAX_PARTICLES = 260;
  let particles = [];
  let canvas = null;
  let ctx = null;
  let dpr = 1;
  let reduced = false;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function add(p) {
    if (reduced && particles.length > MAX_PARTICLES / 3) return;
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push(p);
  }

  // ---- 各種スポーン関数 ----
  function spawnEmber(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      add({
        type: "ember",
        x, y,
        vx: (Math.random() - 0.5) * 40,
        vy: -30 - Math.random() * 60,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 2,
        hue: 20 + Math.random() * 30,
      });
    }
  }

  function spawnSmoke(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      add({
        type: "smoke",
        x, y,
        vx: (Math.random() - 0.5) * 14,
        vy: -18 - Math.random() * 18,
        life: 0,
        maxLife: 1.1 + Math.random() * 0.8,
        size: 6 + Math.random() * 10,
      });
    }
  }

  function spawnAsh(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 90;
      add({
        type: "ash",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.6,
        size: 1 + Math.random() * 2.4,
        gravity: 160,
      });
    }
  }

  function spawnConfetti(x, y, count = 16, colors = ["#8de0e6", "#cfe9f3", "#9aa4c2"]) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 80 + Math.random() * 160;
      add({
        type: "strip",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 12,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.6,
        w: 3 + Math.random() * 2,
        h: 10 + Math.random() * 8,
        color: colors[(Math.random() * colors.length) | 0],
        gravity: 380,
      });
    }
  }

  function spawnBlast(x, y, count = 24) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      add({
        type: "spark",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.35,
        size: 1.5 + Math.random() * 2.5,
        gravity: 120,
      });
    }
  }

  function spawnWindStreak(x, y, dir = 1) {
    add({
      type: "streak",
      x, y,
      vx: 260 * dir,
      vy: (Math.random() - 0.5) * 20,
      life: 0,
      maxLife: 0.5,
      size: 2,
    });
  }

  function clear() {
    particles = [];
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      const g = p.gravity || 0;
      p.vy += g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.rot !== undefined) p.rot += p.vrot * dt;
    }
  }

  function draw() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    for (const p of particles) {
      const t = p.life / p.maxLife;
      const alpha = 1 - t;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      switch (p.type) {
        case "ember":
          ctx.fillStyle = `hsl(${p.hue}, 100%, ${60 - t * 20}%)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2);
          ctx.fill();
          break;
        case "smoke":
          ctx.fillStyle = `rgba(180,180,190,${0.28 * alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + t * 1.6), 0, Math.PI * 2);
          ctx.fill();
          break;
        case "ash":
          ctx.fillStyle = `rgba(120,120,128,${0.8 * alpha})`;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          break;
        case "strip":
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          break;
        case "spark":
          ctx.fillStyle = `rgba(255,${150 + (1 - t) * 80},80,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "streak":
          ctx.strokeStyle = `rgba(207,233,243,${0.5 * alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
          ctx.stroke();
          break;
      }
      ctx.restore();
    }
  }

  function count() {
    return particles.length;
  }

  return {
    init, resize, update, draw, clear, count,
    spawnEmber, spawnSmoke, spawnAsh, spawnConfetti, spawnBlast, spawnWindStreak,
  };
})();
