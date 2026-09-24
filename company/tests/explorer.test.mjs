import test from 'node:test';
import assert from 'node:assert/strict';
import { STAFF, DOORS, SPAWN, PLAYER_RADIUS, makeColliders, boxCollider, doorCollider, collides, movePlayer, canCloseDoor, floorHeight, roomAt } from '../js/layout.js';
import { createWorld } from '../js/scene.js';
import { Box3, Vector3, Texture } from '../vendor/three.module.min.js';

// Canvas text is stubbed; geometry is built with the real vendored Three.js.
// These tests do not emulate WebGL or claim to verify browser rendering.
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, fillText() {} }) }) };
const world = createWorld();
const obstacles = [...makeColliders(), ...world.extraColliders];
const closed = [...obstacles, ...DOORS.map(doorCollider)];

test('five employees; the director has only a right arm and a face-only logo', () => {
  assert.equal(STAFF.length, 5);
  assert.equal(new Set(STAFF.map(s => s.id)).size, 5);
  const director = world.scene.getObjectByName('okapo');
  assert.ok(director.getObjectByName('right-arm'));
  assert.ok(director.getObjectByName('right-hand'));
  assert.equal(director.getObjectByName('left-arm'), undefined);
  assert.equal(director.getObjectByName('left-hand'), undefined);
  assert.equal(STAFF[0].leftArm, false);
  assert.ok(world.scene.getObjectByName('face-only-logo').getObjectByName('face'));
});

test('all geometry has finite vertices and static furniture is instanced', () => {
  let instanceCount = 0, batchCount = 0;
  world.scene.traverse(node => {
    if (node.geometry) for (const coordinate of node.geometry.attributes.position.array) assert.ok(Number.isFinite(coordinate));
    if (node.isInstancedMesh) { instanceCount += node.count; batchCount++; }
  });
  assert.ok(instanceCount > 0 && batchCount < instanceCount / 4, 'Batching should reduce static draw calls by at least 75%');
});

test('every employee and both side rooms are reachable without intersecting furniture', () => {
  const step = .5, start = [SPAWN.x * 2, SPAWN.z * 2], queue = [start];
  const key = (x, z) => `${x}:${z}`;
  const reached = new Set([key(...start)]);
  for (let i = 0; i < queue.length; i++) {
    const [gx, gz] = queue[i];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = gx + dx, nz = gz + dz, id = key(nx, nz);
      if (reached.has(id) || collides(nx * step, nz * step, obstacles)) continue;
      const p = { x: gx * step, z: gz * step };
      movePlayer(p, dx * step, dz * step, obstacles);
      if (Math.abs(p.x - nx * step) > .001 || Math.abs(p.z - nz * step) > .001) continue;
      reached.add(id); queue.push([nx, nz]);
    }
  }
  for (const staff of STAFF) {
    const near = queue.some(([gx, gz]) => {
      const x = gx * step, z = gz * step;
      return z > staff.z && Math.hypot(x - staff.x, z - staff.z) < (staff.id === 'okapo' ? 3.6 : 2.8);
    });
    assert.ok(near, `${staff.name} must have a reachable interaction position`);
  }
  for (const x of [-20, 20]) assert.ok(reached.has(key(x * 2, -6 * 2)), `Side room x=${x} must be reachable`);
  assert.ok(reached.size > 3500);
});

test('closed doors stop movement, open doors allow passage in both directions', () => {
  for (const door of DOORS) {
    const sign = Math.sign(door.x);
    const p = { x: door.x - sign * 2, z: door.z };
    movePlayer(p, sign * 5, 0, closed);
    assert.ok(sign * (p.x - door.x) < -.5);
    const openP = { x: door.x - sign * 2, z: door.z };
    movePlayer(openP, sign * 5, 0, obstacles);
    assert.ok(sign * (openP.x - door.x) > 2.9);
    movePlayer(openP, -sign * 5, 0, obstacles);
    assert.ok(sign * (openP.x - door.x) < -1.9);
    assert.equal(canCloseDoor(door, { x: door.x, z: door.z }), false);
    assert.equal(canCloseDoor(door, { x: door.x + 2, z: door.z }), true);
  }
});

test('large movement steps cannot tunnel through walls, desks or the central table', () => {
  const p = { ...SPAWN };
  movePlayer(p, 0, -100, closed);
  assert.ok(p.z >= 4.8 + PLAYER_RADIUS - .18);
  const boundary = { x: 0, z: 14 };
  movePlayer(boundary, 100, 100, closed);
  assert.equal(collides(boundary.x, boundary.z, closed), false);
  assert.ok(boundary.x < 15.6 && boundary.z < 16.6);
});

test('diagonal wall motion slides instead of sticking or entering a wall', () => {
  const p = { x: 15.35, z: 9 };
  movePlayer(p, 3, 3, closed);
  assert.ok(p.z > 11.8);
  assert.ok(p.x < 15.6);
  assert.equal(collides(p.x, p.z, closed), false);
});

test('director ramp is continuous and room transitions match the actual floor plan', () => {
  assert.equal(floorHeight(0, -8), 0);
  assert.equal(floorHeight(0, -9), .225);
  assert.equal(floorHeight(0, -10), .45);
  assert.equal(floorHeight(0, -14), .45);
  assert.ok(Math.abs(floorHeight(7.19, -13) - floorHeight(7.21, -13)) < .01);
  assert.ok(Math.abs(floorHeight(8.19, -13) - floorHeight(8.21, -13)) < .01);
  assert.equal(roomAt(-20, -6).id, 'server');
  assert.equal(roomAt(20, -6).id, 'archive');
  assert.equal(roomAt(0, -6).id, 'command');
});

test('sliding door geometry reaches its open and closed endpoints', () => {
  const door = world.doors[0]; door.target = 1;
  for (let i = 0; i < 180; i++) world.update(i / 60, 1 / 60, true);
  assert.equal(door.progress, 1);
  assert.equal(door.panel.position.z, -(door.width + .22));
  door.target = 0;
  for (let i = 0; i < 180; i++) world.update(i / 60, 1 / 60, true);
  assert.equal(door.progress, 0);
});

test('four employees have distinct reference outfits and two articulated arms each', () => {
  const features = {
    security: ['black-beret', 'scoped-rifle', 'sunglasses'],
    developer: ['black-hood', 'rectangular-glasses', 'typing-laptop', 'keyboard'],
    strategy: ['slick-black-hair', 'suit-jacket', 'sunglasses'],
    assistant: ['spiky-blond-hair', 'angular-fur-coat', 'cigar', 'paperwork'],
  };
  for (const employee of world.people.filter(p => p.rig)) {
    assert.ok(employee.group.getObjectByName('left-arm'));
    assert.ok(employee.group.getObjectByName('right-arm'));
    for (const name of features[employee.data.id]) assert.ok(employee.group.getObjectByName(name), `${employee.data.id}: missing ${name}`);
    let draws = 0;
    employee.group.traverse(node => { if (node.isMesh) draws++; });
    assert.ok(draws < 65, 'Rigid features should be batched, including the laptop keys');
  }
  const fabric = new Texture(); world.setSuitTexture(fabric);
  const suit = world.people.find(p => p.data.id === 'strategy');
  assert.equal(suit.group.getObjectByName('suit-jacket').material.map, fabric);
  assert.equal(suit.rig.suitMaterial.color.getHex(), 0xffffff);
});

test('employee gestures animate in place and stop with reduced motion', () => {
  function pose(rig) {
    return [...rig.head.rotation.toArray(), ...rig.left.hand.position.toArray(), ...rig.right.hand.position.toArray(), ...rig.body.position.toArray()];
  }
  for (const employee of world.people.filter(p => p.rig)) {
    const position = employee.group.position.toArray();
    employee.rig.update(.2, false); const first = pose(employee.rig);
    employee.rig.update(1.5, false); assert.notDeepEqual(pose(employee.rig), first, `${employee.data.id} needs its own animation`);
    assert.deepEqual(employee.group.position.toArray(), position, 'Idle motion must not move a workstation through the floor plan');
    employee.rig.update(2, true); const still = pose(employee.rig);
    employee.rig.update(12, true); assert.deepEqual(pose(employee.rig), still);
  }
});

test('typing fingertips stay above the actual laptop keyboard', () => {
  const hacker = world.people.find(p => p.data.id === 'developer');
  const keyboard = hacker.group.getObjectByName('keyboard');
  let low = Infinity, high = -Infinity;
  for (let i = 0; i < 120; i++) {
    hacker.rig.update(i / 60, false); hacker.group.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(keyboard);
    for (const arm of [hacker.rig.left, hacker.rig.right]) {
      const tip = arm.fingers[1].localToWorld(new Vector3(0, -.009, .07));
      assert.ok(tip.x > bounds.min.x && tip.x < bounds.max.x);
      assert.ok(tip.z > bounds.min.z && tip.z < bounds.max.z);
      assert.ok(Math.abs(tip.y - bounds.max.y) < .065, 'Fingers should tap the keys, not type in midair');
      low = Math.min(low, tip.y); high = Math.max(high, tip.y);
    }
  }
  assert.ok(high - low > .025, 'Typing should visibly lift and lower the hands');
});

test('animated silhouettes stay inside their fixed collision footprints', () => {
  for (const employee of world.people.filter(p => p.rig)) {
    const s = employee.data;
    const footprint = boxCollider({ x: s.x + (s.footprint.x || 0), z: s.z + (s.footprint.z || 0), w: s.footprint.w, d: s.footprint.d });
    for (let i = 0; i < 100; i++) {
      employee.rig.update(i * .4, false);
      const bounds = new Box3().setFromObject(employee.group);
      assert.ok(bounds.min.x >= footprint.minX && bounds.max.x <= footprint.maxX, `${s.id}: X silhouette leaves the footprint`);
      assert.ok(bounds.min.z >= footprint.minZ && bounds.max.z <= footprint.maxZ, `${s.id}: Z silhouette leaves the footprint`);
    }
  }
});
