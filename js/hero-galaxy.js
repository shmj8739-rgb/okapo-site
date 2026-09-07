/* Canvas 2D galaxy: no dependencies, network requests, or shared global state. */
(() => {
  "use strict";

  const hero = document.querySelector(".hero--galaxy");
  const canvas = document.getElementById("hero-galaxy");
  const toggle = document.getElementById("hero-galaxy-toggle");
  if (!hero || !canvas || !toggle) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const TAU = Math.PI * 2;
  const FRAME_MS = 1000 / 30;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let stars = [];
  let particles = [];
  let galaxy;
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;
  let visible = false;
  let pageActive = true;
  let paused = motion.matches;
  let contextLost = false;
  let resizePending = true;
  const target = { x: 0, y: 0 };
  const offset = { x: 0, y: 0 };

  // Seeded positions prevent the sky from jumping randomly on resize.
  function randomSource() {
    let seed = 41726;
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function glowTexture(color) {
    const texture = document.createElement("canvas");
    texture.width = texture.height = 64;
    const brush = texture.getContext("2d");
    if (!brush) return null;
    const gradient = brush.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, `rgba(${color},1)`);
    gradient.addColorStop(0.12, `rgba(${color},0.8)`);
    gradient.addColorStop(0.4, `rgba(${color},0.18)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    brush.fillStyle = gradient;
    brush.fillRect(0, 0, 64, 64);
    return texture;
  }

  const glows = [glowTexture("137,168,255"), glowTexture("175,123,255"), glowTexture("221,231,255")];
  if (glows.some((texture) => !texture)) return;

  function spiralPoint(random, index) {
    const radius = 0.045 + Math.pow(random(), 0.72) * 0.93;
    const angle = (index % 3) * TAU / 3 + radius * 5.4 + (random() - 0.5) * 0.75;
    return { radius, angle };
  }

  // Prepaint the fine dust and nebula once, instead of thousands of gradients per frame.
  function createGalaxy(compact) {
    const texture = document.createElement("canvas");
    const size = compact ? 512 : 768;
    texture.width = texture.height = size;
    const brush = texture.getContext("2d");
    if (!brush) return null;
    const random = randomSource();
    brush.globalCompositeOperation = "lighter";
    const count = compact ? 1800 : 3000;
    for (let i = 0; i < count; i++) {
      const { radius, angle } = spiralPoint(random, i);
      const x = size / 2 + Math.cos(angle) * radius * size * 0.46;
      const y = size / 2 + Math.sin(angle) * radius * size * 0.46;
      const spread = (0.012 + random() * 0.055) * size;
      brush.globalAlpha = (1 - radius * 0.75) * 0.055;
      brush.drawImage(glows[i % 2], x - spread / 2, y - spread / 2, spread, spread);
      brush.globalAlpha = (0.12 + random() * 0.38) * (1 - radius * 0.65);
      brush.fillStyle = i % 3 ? "#91aaff" : "#d9ceff";
      const dot = 0.4 + random() * 0.85;
      brush.fillRect(x, y, dot, dot);
    }
    return texture;
  }

  function resize() {
    resizePending = false;
    const nextWidth = hero.clientWidth;
    const nextHeight = hero.clientHeight;
    if (!nextWidth || !nextHeight) return;
    const compact = nextWidth <= 640;
    // Cap both DPR and total backing pixels, including large desktop displays.
    const nextRatio = Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.5,
      Math.sqrt(2400000 / (nextWidth * nextHeight)));
    if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;
    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextRatio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const random = randomSource();
    const starCount = Math.min(compact ? 90 : 180, Math.round(width * height / 6500));
    stars = Array.from({ length: starCount }, () => ({
      x: random() * width, y: random() * height,
      size: 0.45 + random() * 1.1, alpha: 0.18 + random() * 0.6,
      phase: random() * TAU, depth: 0.3 + random() * 0.7
    }));
    const particleCount = compact ? 240 : 520;
    particles = Array.from({ length: particleCount }, (_, i) => ({
      ...spiralPoint(random, i), size: 0.45 + random() * 1.25,
      alpha: 0.25 + random() * 0.6, phase: random() * TAU, color: i % 3
    }));
    const textureSize = compact ? 512 : 768;
    if (!galaxy || galaxy.width !== textureSize) galaxy = createGalaxy(compact);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#dce5ff";
    for (const star of stars) {
      ctx.globalAlpha = star.alpha * (0.82 + Math.sin(elapsed * 0.35 + star.phase) * 0.18);
      const x = star.x + offset.x * star.depth;
      const y = star.y + offset.y * star.depth;
      ctx.fillRect(x, y, star.size, star.size);
    }

    const radius = Math.min(width * 0.66, height * 0.88);
    const centerX = width * 0.5 + offset.x;
    const centerY = height * 0.46 + offset.y;
    ctx.globalCompositeOperation = "lighter";
    // Broad blue/violet halo, with a smaller white-blue concentration at the center.
    ctx.globalAlpha = 0.23;
    ctx.drawImage(glows[0], centerX - radius, centerY - radius * 0.7, radius * 2, radius * 1.4);
    ctx.globalAlpha = 0.16;
    ctx.drawImage(glows[1], centerX - radius * 0.55, centerY - radius * 0.5, radius * 1.4, radius);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-0.32);
    ctx.scale(1, 0.57);
    ctx.rotate(elapsed * 0.014);
    ctx.globalAlpha = 0.85;
    if (galaxy) ctx.drawImage(galaxy, -radius, -radius, radius * 2, radius * 2);
    for (const particle of particles) {
      const angle = particle.angle + elapsed * 0.009 * (1.2 - particle.radius);
      // Gentle radial breathing suggests particles collecting around the core.
      const r = radius * 0.92 * particle.radius * (1 + Math.sin(elapsed * 0.16 + particle.phase) * 0.015);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const size = particle.size * 5;
      ctx.globalAlpha = particle.alpha * (0.84 + Math.sin(elapsed * 0.45 + particle.phase) * 0.16);
      ctx.drawImage(glows[particle.color], x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 0.48;
    ctx.drawImage(glows[2], -radius * 0.32, -radius * 0.32, radius * 0.64, radius * 0.64);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function canRender() {
    return visible && pageActive && !document.hidden && !contextLost;
  }

  function tick(now) {
    frame = 0;
    if (!canRender()) return;
    if (resizePending) resize();
    const delta = previousTime ? now - previousTime : FRAME_MS;
    if (!previousTime || delta >= FRAME_MS - 0.5) {
      const seconds = Math.min(delta / 1000, 0.08);
      if (!paused) elapsed += seconds;
      const ease = 1 - Math.exp(-seconds * 2.5);
      offset.x += (target.x - offset.x) * ease;
      offset.y += (target.y - offset.y) * ease;
      draw();
      previousTime = now;
    }
    if (!paused) frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (canRender()) frame = requestAnimationFrame(tick);
    toggle.textContent = paused ? "背景を再生" : "背景を一時停止";
  }

  function resetPointer() {
    target.x = target.y = 0;
  }

  hero.addEventListener("pointermove", (event) => {
    if (paused || !pointer.matches || event.pointerType !== "mouse") return;
    const rect = hero.getBoundingClientRect();
    target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
    target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
  }, { passive: true });
  hero.addEventListener("pointerleave", resetPointer, { passive: true });
  window.addEventListener("blur", resetPointer);
  pointer.addEventListener("change", resetPointer);
  toggle.addEventListener("click", () => {
    paused = !paused;
    syncPlayback();
  });
  motion.addEventListener("change", () => {
    paused = motion.matches;
    resetPointer();
    offset.x = offset.y = 0;
    syncPlayback();
  });
  document.addEventListener("visibilitychange", syncPlayback);
  window.addEventListener("pagehide", () => {
    pageActive = false;
    syncPlayback();
  });
  window.addEventListener("pageshow", () => {
    pageActive = true;
    syncPlayback();
  });

  function queueResize() {
    resizePending = true;
    if (paused || !frame) syncPlayback();
  }
  window.addEventListener("resize", queueResize, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(queueResize).observe(hero);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0 }).observe(hero);
  } else {
    const checkVisibility = () => {
      const rect = hero.getBoundingClientRect();
      const nextVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (nextVisible !== visible) {
        visible = nextVisible;
        syncPlayback();
      }
    };
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });
    checkVisibility();
  }

  canvas.addEventListener("contextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    hero.classList.remove("is-galaxy-ready");
    toggle.hidden = true;
    syncPlayback();
  });
  canvas.addEventListener("contextrestored", () => {
    contextLost = false;
    width = 0;
    resizePending = true;
    hero.classList.add("is-galaxy-ready");
    toggle.hidden = false;
    syncPlayback();
  });

  resize();
  draw();
  hero.classList.add("is-galaxy-ready");
  toggle.hidden = false;
  syncPlayback();
})();
