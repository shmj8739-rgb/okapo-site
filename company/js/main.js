import * as THREE from '../vendor/three.module.min.js';
import { createWorld } from './scene.js?v=2';
import { SPAWN, STAFF, makeColliders, doorCollider, movePlayer, canCloseDoor, floorHeight, roomAt } from './layout.js?v=2';
import { bindTouchControls } from './touch-controls.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#world');
let touchEnabled = matchMedia('(any-pointer: coarse), (max-width: 700px)').matches || navigator.maxTouchPoints > 0;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !touchEnabled, powerPreference: touchEnabled ? 'default' : 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const world = createWorld();
// The fabric loads in the background so a slow texture never blocks exploration.
new THREE.TextureLoader().load(new URL('../assets/gold-brocade.png', import.meta.url).href,
  texture => world.setSuitTexture(texture), undefined,
  () => console.warn('Gold fabric unavailable; using the black-and-gold material fallback.'));
const camera = new THREE.PerspectiveCamera(48, 1, .08, 150);
camera.rotation.order = 'YXZ';
const obstacles = [...makeColliders(), ...world.extraColliders];
const player = { ...SPAWN };
const keys = new Set(), visited = new Set(['command']);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode = 'overview', walking = false, yaw = 0, pitch = 0, sensitivity = 1;
let ignoreUnlock = false, target = null, toastTimer, touchRunning = false;
let previous = performance.now(), time = 0, mapTime = 0, sampleTime = 0, sampleCount = 0, autoLowered = false;
let audioContext, audioGain, audioStarted = false;
let quality = 'auto';
const dialogs = [...document.querySelectorAll('dialog')];
const map = $('#minimap').getContext('2d');
const touch = bindTouchControls({
  pad: $('#move-pad'), stick: $('#move-stick'), canvas,
  active: () => walking, locked: () => document.pointerLockElement === canvas,
  look: (dx, dy) => turnView(dx, dy, touchEnabled ? .004 : .002),
  onTouch: () => { if (!touchEnabled) { touchEnabled = true; updateTouchUI(); renderQuality(); } }
});
function turnView(dx, dy, factor = .002) {
  yaw -= dx * factor * sensitivity;
  pitch = THREE.MathUtils.clamp(pitch - dy * factor * sensitivity, -1.3, 1.3);
}
function updateTouchUI() {
  document.body.dataset.touch = String(touchEnabled);
  $('#touch-controls').hidden = !touchEnabled || !walking;
  $('#entry-note').textContent = touchEnabled ? '移動パッドで歩く・画面をドラッグで見回す' : 'PC・キーボードとマウスで探索';
}

function toast(message) {
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4200);
}
function updateAudio() {
  if (!audioGain) return;
  audioGain.gain.setTargetAtTime($('#sound').checked && walking && !document.hidden ? .028 : 0, audioContext.currentTime, .4);
}
function activateAudio() {
  if (!$('#sound').checked) return;
  try {
    if (!audioStarted) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioGain = audioContext.createGain(); audioGain.gain.value = 0; audioGain.connect(audioContext.destination);
      for (const frequency of [55, 82.4]) { const oscillator = audioContext.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.connect(audioGain); oscillator.start(); }
      audioStarted = true;
    }
    audioContext.resume().catch(() => {}); updateAudio();
  } catch { $('#sound').checked = false; toast('このブラウザでは環境音を再生できません。'); }
}
function renderQuality() {
  const low = quality === 'low' || (quality === 'auto' && (autoLowered || touchEnabled));
  renderer.setPixelRatio(low ? Math.min(devicePixelRatio, 1) : Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = !low;
  resize();
}
function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  renderer.setSize(width, height, false); camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (mode === 'overview') overviewCamera();
}
function overviewCamera() {
  camera.fov = camera.aspect < 1.2 ? 64 : 48; camera.updateProjectionMatrix();
  const far = camera.aspect < .8 ? 1.18 : 1;
  camera.position.set(29 * far, 28 * far, 36 * far); camera.lookAt(-3, .1, -2);
}
function clearMovement() {
  keys.clear(); touch.reset(); touchRunning = false;
  $('#touch-run').setAttribute('aria-pressed', 'false');
}
function unlock() {
  if (document.pointerLockElement === canvas) { ignoreUnlock = true; document.exitPointerLock(); }
}
function closeDialogs() { dialogs.forEach(d => { if (d.open) d.close(); }); }
function showDialog(id) {
  walking = false; clearMovement(); unlock(); closeDialogs();
  updateTouchUI();
  $('#interact').hidden = true; $(id).showModal(); updateAudio();
}
function pause() { if (mode === 'walk') showDialog('#menu-dialog'); }
function updatePlayerCamera() {
  camera.position.set(player.x, 1.75 + floorHeight(player.x, player.z), player.z);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
}
function dragFallback() {
  if (!walking) return;
  toast(touchEnabled ? '左下のパッドで移動。画面をドラッグして見回せます。' : '画面をドラッグすると視点を動かせます。WASDで移動できます。');
}
function beginWalk() {
  closeDialogs(); clearMovement(); mode = 'walk'; walking = true; document.body.dataset.mode = 'walk';
  updateTouchUI();
  $('#intro').hidden = true; $('#walk-hud').hidden = false; $('#view-label').textContent = '探索中';
  world.setOverview(false); camera.fov = 68; camera.updateProjectionMatrix(); updatePlayerCamera();
  canvas.focus({ preventScroll: true }); activateAudio();
  if (touchEnabled) return;
  if (document.pointerLockElement !== canvas) {
    try {
      if (!canvas.requestPointerLock) return dragFallback();
      const result = canvas.requestPointerLock();
      if (result?.catch) result.catch(dragFallback);
    } catch { dragFallback(); }
  }
}
function overview() {
  walking = false; mode = 'overview'; clearMovement(); unlock(); closeDialogs();
  updateTouchUI();
  document.body.dataset.mode = 'overview'; $('#intro').hidden = false; $('#walk-hud').hidden = true;
  $('#interact').hidden = true; $('#view-label').textContent = '俯瞰表示'; $('#start-label').textContent = '本部を探索する';
  world.setOverview(true); overviewCamera(); updateAudio();
}
function interact() {
  if (!walking || !target) return;
  if (target.kind === 'door') {
    const door = target.door;
    if (door.target === 1) {
      if (!canCloseDoor(door, player)) return toast('ドアから少し離れると閉められます。');
      door.target = 0;
    } else door.target = 1;
  } else {
    const staff = target.staff;
    $('#staff-en').textContent = staff.en; $('#staff-name').textContent = staff.name;
    $('#staff-role').textContent = staff.role; $('#staff-quote').textContent = `「${staff.quote}」`;
    $('#staff-description').textContent = staff.description; showDialog('#staff-dialog');
  }
}
function nearestTarget() {
  if (!walking) return;
  let nearest = null, best = Infinity;
  const room = roomAt(player.x, player.z);
  // Interactions cannot reach employees through the side-room walls.
  if (room.id === 'command') for (const staff of STAFF) {
    const distance = Math.hypot(staff.x - player.x, staff.z - player.z);
    const angle = Math.atan2(-(staff.x - player.x), -(staff.z - player.z));
    const facing = Math.cos(angle - yaw) > .35;
    if (distance < (staff.id === 'okapo' ? 3.6 : 2.8) && distance < best && facing) {
      nearest = { kind: 'staff', staff }; best = distance;
    }
  }
  for (const door of world.doors) {
    const distance = Math.hypot(door.x - player.x, door.z - player.z);
    if (distance < 3.1 && distance < best) { nearest = { kind: 'door', door }; best = distance; }
  }
  target = nearest; $('#interact').hidden = !target;
  if (target) $('#interact-text').textContent = target.kind === 'staff'
    ? `${target.staff.name}に話しかける`
    : `${target.door.name}を${target.door.target ? '閉める' : '開く'}`;
}
function drawMap() {
  const ctx = map, w = 480, h = 320, scale = 8;
  const px = x => 240 + x * scale, pz = z => 153 + z * scale;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#26323f'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  const room = roomAt(player.x, player.z);
  for (const [id, x, z, rw, rh] of [['command', -16, -17, 32, 34], ['server', -25, -12, 9, 16], ['archive', 16, -12, 9, 16]]) {
    ctx.fillStyle = room.id === id ? '#32313b' : '#1b2631'; ctx.strokeStyle = '#78808c'; ctx.lineWidth = 1.7;
    ctx.fillRect(px(x), pz(z), rw * scale, rh * scale); ctx.strokeRect(px(x), pz(z), rw * scale, rh * scale);
  }
  ctx.fillStyle = '#d66b76'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('02', px(-20.5), pz(-5)); ctx.fillText('03', px(20.5), pz(-5));
  ctx.strokeStyle = '#b85063'; ctx.beginPath(); ctx.arc(px(0), pz(2), 3 * scale, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#70616c'; ctx.fillRect(px(-7), pz(-16), 14 * scale, 6 * scale);
  for (const door of world.doors) { ctx.strokeStyle = door.progress > .97 ? '#76bfb3' : '#e56573'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px(door.x), pz(door.z - 1.8)); ctx.lineTo(px(door.x), pz(door.z + 1.8)); ctx.stroke(); }
  for (const staff of STAFF) { ctx.fillStyle = staff.id === 'okapo' ? '#f1c9a6' : '#c7d0d9'; ctx.beginPath(); ctx.arc(px(staff.x), pz(staff.z), staff.id === 'okapo' ? 5 : 3.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.save(); ctx.translate(px(player.x), pz(player.z)); ctx.rotate(-yaw);
  ctx.fillStyle = '#fb5a65'; ctx.shadowColor = '#ff435b'; ctx.shadowBlur = 13;
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 7); ctx.lineTo(0, 3); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.restore();
  $('#room-number').textContent = room.number; $('#room-name').textContent = room.name; $('#room-en').textContent = room.en;
  if (walking && !visited.has(room.id)) { visited.add(room.id); toast(`${room.name}に入りました`); }
  $('#visited').textContent = `${String(visited.size).padStart(2, '0')} / 03`;
}

$('#start-button').addEventListener('click', beginWalk);
$('#resume-button').addEventListener('click', beginWalk);
$('#staff-resume').addEventListener('click', beginWalk);
$('#pause-button').addEventListener('click', pause);
$('#overview-button').addEventListener('click', overview);
$('#reset-button').addEventListener('click', () => { Object.assign(player, SPAWN); yaw = pitch = 0; beginWalk(); });
$('#help-button').addEventListener('click', () => showDialog('#help-dialog'));
$('#settings-button').addEventListener('click', () => showDialog('#settings-dialog'));
$('#interact').addEventListener('click', interact);
$('#touch-run').addEventListener('click', () => {
  if (!walking) return;
  touchRunning = !touchRunning;
  $('#touch-run').setAttribute('aria-pressed', String(touchRunning));
});
$('#quality').addEventListener('change', event => { quality = event.target.value; autoLowered = false; sampleCount = sampleTime = 0; renderQuality(); });
$('#sensitivity').addEventListener('input', event => { sensitivity = Number(event.target.value); });
$('#sound').addEventListener('change', () => { activateAudio(); updateAudio(); });
$('#fullscreen-button').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { toast('この表示では全画面を利用できません。ブラウザの全画面機能をご利用ください。'); }
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => {
  const dialog = button.closest('dialog'); dialog.close();
  if (mode === 'walk') { if (dialog.id === 'menu-dialog') beginWalk(); else pause(); }
}));
dialogs.forEach(dialog => dialog.addEventListener('cancel', event => {
  event.preventDefault(); dialog.close();
  if (mode === 'walk') pause();
}));
const motionCodes = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'KeyQ', 'KeyR']);
document.addEventListener('keydown', event => {
  if (event.code === 'Escape' && walking && document.pointerLockElement !== canvas) { event.preventDefault(); pause(); return; }
  if (!walking || event.target.closest('dialog') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (motionCodes.has(event.code)) { event.preventDefault(); keys.add(event.code); }
  if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); interact(); }
});
document.addEventListener('keyup', event => keys.delete(event.code));
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) { ignoreUnlock = false; }
  else if (ignoreUnlock) ignoreUnlock = false;
  else if (walking) pause();
});
document.addEventListener('pointerlockerror', dragFallback);
document.addEventListener('mousemove', event => {
  if (!walking || document.pointerLockElement !== canvas) return;
  turnView(event.movementX, event.movementY);
});
canvas.addEventListener('contextmenu', event => event.preventDefault());
window.addEventListener('blur', () => { clearMovement(); if (walking) pause(); });
document.addEventListener('visibilitychange', () => { clearMovement(); previous = performance.now(); if (document.hidden && walking) pause(); updateAudio(); });
window.addEventListener('resize', () => { clearMovement(); resize(); });
window.visualViewport?.addEventListener('resize', () => { clearMovement(); resize(); });
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); walking = false; clearMovement(); unlock(); closeDialogs(); updateAudio();
  updateTouchUI();
  $('#error-message').textContent = '3D描画が中断されました。ほかのタブを閉じ、ページを再読み込みしてください。';
  $('#error-panel').hidden = false;
});

function frame(now) {
  requestAnimationFrame(frame);
  const rawDt = (now - previous) / 1000; previous = now;
  if (document.hidden || renderer.getContext().isContextLost()) return;
  const dt = Math.min(rawDt, .05); time += dt;
  if (walking) {
    let forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown')) + touch.movement.y;
    let strafe = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + touch.movement.x;
    const length = Math.hypot(forward, strafe);
    if (length > 1) { forward /= length; strafe /= length; }
    if (keys.has('KeyQ')) yaw += dt * 1.5;
    if (keys.has('KeyR')) yaw -= dt * 1.5;
    const speed = touchRunning || keys.has('ShiftLeft') || keys.has('ShiftRight') ? 6.2 : 3.8;
    const activeObstacles = [...obstacles, ...world.doors.filter(d => d.progress < .98 || d.target === 0).map(doorCollider)];
    movePlayer(player, (strafe * Math.cos(yaw) - forward * Math.sin(yaw)) * speed * dt,
      (-forward * Math.cos(yaw) - strafe * Math.sin(yaw)) * speed * dt, activeObstacles);
    updatePlayerCamera(); nearestTarget();
  }
  // A closing door automatically reopens if the visitor enters its safety zone.
  for (const door of world.doors) if (!door.target && door.progress > 0 && !canCloseDoor(door, player)) door.target = 1;
  world.update(time, dt, reducedMotion);
  mapTime += dt; if (mapTime > .1) { drawMap(); mapTime = 0; }
  renderer.render(world.scene, camera);
  if (quality === 'auto' && !autoLowered && time > 3 && rawDt < .2) {
    sampleTime += rawDt; sampleCount++;
    if (sampleCount >= 180) {
      if (sampleTime / sampleCount > .026) { autoLowered = true; renderQuality(); }
      sampleCount = sampleTime = 0;
    }
  }
}
renderQuality(); overview(); drawMap();
renderer.render(world.scene, camera);
$('#start-button').disabled = false; $('#start-label').textContent = '本部を探索する';
updateTouchUI();
if (!document.documentElement.requestFullscreen) $('#fullscreen-button').hidden = true;
requestAnimationFrame(frame);
