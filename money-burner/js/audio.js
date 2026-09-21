// ===================================================
// OKAPO MONEY CRASH — サウンド（Web Audio API 合成）
// ---------------------------------------------------
// 音声ファイルを使わず、Web Audio API でその場で効果音を合成する。
// 設定UIは持たない（シンプル化のため）。既定でON。
// ブラウザの自動再生制限があるため、最初のユーザー操作（タップ／
// クリック）で AudioContext を resume() する。
// ===================================================

const AudioManager = (() => {
  let ctx = null;
  const enabled = true;

  function ensureContext() {
    if (!ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    }
    return ctx;
  }

  function unlock() {
    const c = ensureContext();
    if (!c) return;
    if (c.state === "suspended") c.resume();
  }

  function tone(freq, { duration = 0.12, type = "sine", gain = 0.18, delay = 0, slideTo = null } = {}) {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), c.currentTime + delay + duration);
    }
    g.gain.setValueAtTime(0.0001, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + delay + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration);
    osc.connect(g).connect(c.destination);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration + 0.02);
  }

  function noiseBurst({ duration = 0.2, gain = 0.16, filterFreq = 1200, delay = 0 } = {}) {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration);
    src.connect(filter).connect(g).connect(c.destination);
    src.start(c.currentTime + delay);
  }

  return {
    unlock,
    ignite() {
      noiseBurst({ duration: 0.18, gain: 0.14, filterFreq: 2200 });
      tone(360, { duration: 0.1, type: "triangle", gain: 0.1, slideTo: 180 });
    },
    tear() {
      noiseBurst({ duration: 0.1, gain: 0.13, filterFreq: 3200 });
    },
    destroy(value) {
      const pitch = value >= 10000 ? 720 : value >= 5000 ? 620 : 520;
      tone(pitch, { duration: 0.14, type: "square", gain: 0.09, slideTo: pitch * 1.6 });
    },
  };
})();
