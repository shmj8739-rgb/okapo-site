import test from 'node:test';
import assert from 'node:assert/strict';
import { bindTouchControls } from '../js/touch-controls.js';
import { movePlayer, makeColliders, SPAWN } from '../js/layout.js';

class Surface {
  events = new Map(); captures = new Set(); style = {};
  classList = { add() {}, remove() {} };
  addEventListener(type, listener) { this.events.set(type, listener); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 120, height: 120 }; }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); this.fire('lostpointercapture', id); }
  focus() {}
  fire(type, id, x = 60, y = 60, pointerType = 'touch') {
    this.events.get(type)?.({ pointerId: id, clientX: x, clientY: y, pointerType, button: 0, preventDefault() {} });
  }
}
function setup() {
  const pad = new Surface(), stick = new Surface(), canvas = new Surface(), turns = [];
  let active = true, locked = false;
  const controls = bindTouchControls({ pad, stick, canvas, active: () => active, locked: () => locked, look: (...delta) => turns.push(delta), onTouch() {} });
  return { pad, stick, canvas, turns, controls, pause: () => { active = false; controls.reset(); }, lock: () => { locked = true; } };
}
test('movement and view have independent fingers, and a third finger cannot take over', () => {
  const { pad, canvas, turns, controls } = setup();
  pad.fire('pointerdown', 1, 60, 10);
  canvas.fire('pointerdown', 2, 200, 150);
  canvas.fire('pointermove', 2, 240, 140);
  canvas.fire('pointerdown', 3, 300, 200);
  canvas.fire('pointermove', 3, 400, 100);
  assert.deepEqual(turns, [[40, -10]]);
  assert.equal(controls.movement.y, 1);
  canvas.fire('pointerup', 2);
  assert.equal(controls.movement.y, 1, 'lifting the view finger must not stop the movement finger');
  pad.fire('pointerup', 1);
  assert.deepEqual(controls.movement, { x: 0, y: 0 });
});
test('all cancellation paths release movement and capture without sticking', () => {
  for (const reason of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    const { pad, controls, stick } = setup();
    pad.fire('pointerdown', 1, 110, 60); pad.fire(reason, 1);
    assert.deepEqual(controls.movement, { x: 0, y: 0 }, reason);
    assert.equal(pad.captures.size, 0); assert.equal(stick.style.transform, 'translate(0px, 0px)');
  }
  const { pad, canvas, controls, turns, pause } = setup();
  pad.fire('pointerdown', 1, 60, 0); canvas.fire('pointerdown', 2, 200, 100);
  pause(); pad.fire('pointermove', 1, 60, 0); canvas.fire('pointermove', 2, 250, 100);
  assert.deepEqual(controls.movement, { x: 0, y: 0 }); assert.equal(turns.length, 0);
  assert.equal(pad.captures.size + canvas.captures.size, 0);
});
test('dead zone, analog speed and diagonal normalization preserve controllable movement', () => {
  const { pad, controls } = setup();
  pad.fire('pointerdown', 1, 61, 60); assert.equal(controls.movement.x, 0);
  pad.fire('pointermove', 1, 80, 60); assert.ok(controls.movement.x > 0 && controls.movement.x < 1);
  pad.fire('pointermove', 1, 120, 0);
  assert.ok(Math.abs(Math.hypot(controls.movement.x, controls.movement.y) - 1) < 1e-9);
});
test('touch movement feeds the same collision system and cannot walk through a wall', () => {
  const { pad, controls } = setup(); const player = { ...SPAWN }, start = { ...SPAWN };
  pad.fire('pointerdown', 1, 60, 0);
  for (let i = 0; i < 60; i++) movePlayer(player, controls.movement.x * 3.8 / 60, -controls.movement.y * 3.8 / 60, makeColliders());
  assert.ok(player.z < start.z - 1, 'the pad actually advances the player');
  pad.fire('pointermove', 1, 60, 120);
  for (let i = 0; i < 1000; i++) movePlayer(player, 0, -controls.movement.y * 3.8 / 60, makeColliders());
  assert.ok(player.z < 17, 'outer wall blocks the player');
});
test('desktop drag works without double-counting pointer-locked mouse movement', () => {
  const { canvas, turns, lock } = setup();
  canvas.fire('pointerdown', 1, 10, 10, 'mouse'); canvas.fire('pointermove', 1, 20, 30, 'mouse');
  assert.deepEqual(turns, [[10, 20]]); canvas.fire('pointerup', 1); lock();
  canvas.fire('pointerdown', 2, 10, 10, 'mouse'); canvas.fire('pointermove', 2, 30, 30, 'mouse');
  assert.equal(turns.length, 1);
});
