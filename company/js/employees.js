import * as THREE from '../vendor/three.module.min.js';

// Articulated, low-poly employees. The director is deliberately kept in scene.js.
// All idle motion stays within a fixed workstation footprint.
export function createEmployee(data, parent, helpers) {
  const { box, mesh } = helpers;
  const isHacker = data.id === 'developer';
  const isGuard = data.id === 'security';
  const isStrategist = data.id === 'strategy';
  const skin = isGuard ? 0xc6ac93 : isHacker ? 0xbda58c : isStrategist ? 0xc6a383 : 0xd7a777;
  const cloth = isGuard ? 0x292734 : isHacker ? 0x171c23 : 0x191c22;
  const goldSuit = isStrategist ? new THREE.MeshStandardMaterial({ color: 0x302a1e, roughness: .7, metalness: .23, flatShading: true }) : null;
  const jacket = goldSuit || cloth;
  const body = new THREE.Group(); body.name = 'upper-body'; parent.add(body);
  const head = new THREE.Group(); head.name = 'head'; head.position.set(0, isHacker ? 1.63 : 1.98, isHacker ? .13 : 0); body.add(head);
  const shoulders = isHacker ? 1.32 : 1.65;
  const axisY = new THREE.Vector3(0, 1, 0), direction = new THREE.Vector3();
  function cube(group, x, y, z, w, h, d, color, name) {
    const result = box(x, y, z, w, h, d, typeof color === 'number' ? color : 0xffffff, group);
    if (color?.isMaterial) result.material = color;
    if (name) result.name = name;
    return result;
  }
  function shape(group, geometry, color, x, y, z, name) {
    const result = mesh(geometry, typeof color === 'number' ? color : 0xffffff, x, y, z, group);
    if (color?.isMaterial) result.material = color;
    if (name) result.name = name;
    return result;
  }
  function segment(node, a, b, thickness = 1) {
    direction.copy(b).sub(a);
    node.position.copy(a).add(b).multiplyScalar(.5);
    node.scale.set(thickness, direction.length(), thickness);
    node.quaternion.setFromUnitVectors(axisY, direction.normalize());
  }
  function bone(group, a, b, radius, color, name) {
    const node = shape(group, new THREE.CylinderGeometry(radius * .86, radius, 1, 6), color, 0, 0, 0, name);
    segment(node, new THREE.Vector3(...a), new THREE.Vector3(...b)); return node;
  }
  function triangle(group, points, color) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3)); geometry.computeVertexNormals();
    const node = shape(group, geometry, color, 0, 0, 0);
    // Keep the shared material untouched: small cloth panels are double-sided.
    node.material = node.material.clone(); node.material.side = THREE.DoubleSide; return node;
  }

  // A tapered jaw, faceted cheekbones, ears and a projecting nose give the four
  // employees individual human faces, separate from the director's emblem face.
  const face = shape(head, new THREE.IcosahedronGeometry(.29, 1), skin, 0, -.005, .02, 'face'); face.scale.set(.87, 1.13, .81);
  const jaw = shape(head, new THREE.IcosahedronGeometry(.19, 0), skin, 0, -.18, .075); jaw.scale.set(.88, .66, .83);
  for (const side of [-1, 1]) shape(head, new THREE.IcosahedronGeometry(.059, 0), skin, side * .244, -.04, .007);
  const nose = shape(head, new THREE.ConeGeometry(.051, .145, 3), skin, 0, -.085, .262); nose.rotation.x = -.28;
  cube(head, 0, -.214, .219, .13, .015, .019, 0x785f53);
  bone(body, [0, shoulders + .03, 0], [0, shoulders + .19, .01], .085, skin);

  if (isHacker) {
    // Four-sided frames with visible eyes: these are spectacles, not sunglasses.
    const glasses = new THREE.Group(); glasses.name = 'rectangular-glasses'; head.add(glasses);
    for (const side of [-1, 1]) {
      const cx = side * .113;
      for (const y of [-.043, .06]) cube(glasses, cx, y, .249, .198, .024, .023, 0x080b10);
      for (const x of [-.087, .087]) cube(glasses, cx + x, .009, .249, .023, .114, .025, 0x080b10);
      cube(glasses, cx, .005, .242, .059, .022, .012, 0x211d1b);
    }
    cube(glasses, 0, .025, .26, .05, .019, .024, 0x080b10);
  } else {
    const glasses = new THREE.Group(); glasses.name = 'sunglasses'; head.add(glasses);
    for (const side of [-1, 1]) {
      const lens = shape(glasses, new THREE.CylinderGeometry(.113, .113, .029, 6), 0x080a0e, side * .124, .025, .237);
      lens.rotation.x = Math.PI / 2; lens.scale.z = .82;
    }
    cube(glasses, 0, .04, .258, .086, .023, .025, isStrategist ? 0x9e8853 : 0x171719);
    for (const side of [-1, 1]) cube(glasses, side * .218, .039, .106, .023, .021, .27, 0x171719);
  }

  function hairLock(group, base, tip, width, color) {
    const lock = shape(group, new THREE.ConeGeometry(width, 1, 4), color, 0, 0, 0);
    segment(lock, new THREE.Vector3(...base), new THREE.Vector3(...tip)); return lock;
  }
  if (isGuard || isHacker) {
    const hair = shape(head, new THREE.IcosahedronGeometry(.305, 0), 0x594b3a, 0, .13, -.018); hair.scale.set(.95, .67, 1);
    for (let i = 0; i < 7; i++) {
      const x = -.23 + i * .072;
      hairLock(head, [x, .19, .16], [x - .075, -.01 - (i % 3) * .047, .253], .067, [0x6f5a41, 0x483e32, 0x836a4b][i % 3]);
    }
  } else if (isStrategist) {
    const hair = new THREE.Group(); hair.name = 'slick-black-hair'; head.add(hair);
    shape(hair, new THREE.IcosahedronGeometry(.3, 1), 0x131719, 0, .15, -.05).scale.set(.91, .57, .93);
    for (let i = 0; i < 7; i++) hairLock(hair, [-.21 + i * .066, .23, .11], [-.22 + i * .071, .32 + (i % 2) * .035, -.20], .067, i % 2 ? 0x2d3130 : 0x141719);
  } else {
    const hair = new THREE.Group(); hair.name = 'spiky-blond-hair'; head.add(hair);
    shape(hair, new THREE.IcosahedronGeometry(.3, 0), 0xbe8a32, 0, .15, -.03).scale.set(.97, .64, .99);
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.399;
      hairLock(hair, [Math.sin(angle) * .18, .21, Math.cos(angle) * .15], [Math.sin(angle) * .34, .31 + (i % 4) * .042, Math.cos(angle) * .28], .083, [0xdbaf4c, 0xb4812c, 0xf0cd6e][i % 3]);
    }
  }

  const torso = shape(body, new THREE.CylinderGeometry(.32, .265, isHacker ? .58 : .69, 8), jacket, 0, isHacker ? 1.03 : 1.31, 0, isHacker ? 'hoodie' : 'suit-jacket');
  torso.scale.z = .65;
  cube(body, 0, isHacker ? .73 : .95, 0, .48, .21, .34, jacket);
  if (isHacker) {
    // Open hood: back shell, side panels and a peaked brow leave the face visible.
    const hood = new THREE.Group(); hood.name = 'black-hood'; head.add(hood);
    shape(hood, new THREE.IcosahedronGeometry(.4, 1), cloth, 0, .015, -.175).scale.set(1, 1.1, .56);
    for (const side of [-1, 1]) {
      const edge = shape(hood, new THREE.CylinderGeometry(.108, .14, .49, 5), 0x20252b, side * .286, .017, -.015); edge.rotation.z = -side * .20;
    }
    triangle(hood, [[-.31, .25, .08], [0, .45, -.04], [.31, .25, .08]], 0x252a2e);
    triangle(hood, [[-.31, .25, .08], [0, .45, -.04], [-.31, .2, -.29]], cloth);
    triangle(hood, [[.31, .25, .08], [0, .45, -.04], [.31, .2, -.29]], cloth);
    for (const side of [-1, 1]) cube(body, side * .095, 1.2, .224, .013, .27, .014, 0x626364);
    cube(body, 0, .91, .205, .34, .13, .02, 0x20252b);
  } else {
    const shirt = isGuard ? 0x171a23 : 0x17191d;
    cube(body, 0, 1.37, .213, .23, .54, .024, shirt);
    for (const side of [-1, 1]) {
      triangle(body, [[side * .27, 1.65, .14], [side * .035, 1.29, .229], [side * .14, 1.24, .23]], isStrategist ? 0x11151a : 0x353137);
      if (!isStrategist) triangle(body, [[0, 1.65, .205], [side * .115, 1.56, .23], [side * .065, 1.44, .235]], 0xbbbab2);
    }
    if (!isStrategist) cube(body, 0, 1.43, .255, .06, .27, .022, isGuard ? 0x31303a : 0x763b3e);
    cube(body, 0, .965, .202, .46, .065, .036, 0x11151a);
    cube(body, .015, .964, .227, .10, .075, .028, 0xb59351);
    for (const y of [1.13, 1.26]) shape(body, new THREE.IcosahedronGeometry(.019, 0), 0xb59a60, .04, y, .238);
  }

  if (isGuard) {
    const hat = new THREE.Group(); hat.name = 'black-beret'; head.add(hat); hat.rotation.z = -.19;
    shape(hat, new THREE.IcosahedronGeometry(.38, 1), 0x252432, -.025, .28, -.045).scale.set(1.04, .43, .87);
    cube(hat, 0, .215, .01, .51, .069, .41, 0x151720);
    // Long, angular coat tails and a utility belt echo the reference silhouette.
    for (const side of [-1, 1]) {
      const tail = shape(body, new THREE.CylinderGeometry(.20, .27, .58, 5), 0x2b2938, side * .225, .72, -.07); tail.scale.z = .85;
      cube(body, side * .30, .98, .15, .11, .16, .105, 0x171922);
    }
  }
  if (isStrategist) {
    // Small gold trims keep the silhouette readable while the brocade loads.
    for (const side of [-1, 1]) {
      triangle(body, [[side * .30, 1.59, .16], [side * .15, 1.35, .228], [side * .20, 1.51, .22]], 0xa37a38);
      cube(body, side * .20, 1.10, .215, .12, .027, .021, 0x887344);
    }
  }

  for (const side of [-1, 1]) {
    const legColor = isStrategist ? goldSuit : isHacker ? 0x161b22 : 0x1b1e26;
    if (isHacker) {
      bone(parent, [side * .16, .65, -.015], [side * .23, .57, .46], .14, legColor, side === 1 ? 'left-leg' : 'right-leg');
      bone(parent, [side * .23, .57, .46], [side * .23, .12, .5], .115, legColor);
    } else {
      bone(parent, [side * .16, .95, 0], [side * .18, .53, side * .028], .145, legColor, side === 1 ? 'left-leg' : 'right-leg');
      bone(parent, [side * .18, .53, side * .028], [side * .21, .12, side * .05], .105, legColor);
    }
    const x = side * (isHacker ? .23 : .21), z = isHacker ? .57 : side * .05 + .065;
    cube(parent, x, .057, z, .24, .10, .43, isHacker ? 0xc6c4bc : 0x10141a, 'shoe-sole');
    cube(parent, x, .13, z -.01, .218, .14, .39, isHacker ? 0x292e33 : isGuard || isStrategist ? 0x12161c : 0x744b31);
    if (data.id === 'assistant') shape(parent, new THREE.CylinderGeometry(.13, .115, .28, 6), 0x714a33, x, .24, z -.09);
  }

  function makeArm(side) {
    const root = new THREE.Group(); root.name = side === 1 ? 'left-arm' : 'right-arm'; root.position.set(side * .32, shoulders, .005); body.add(root);
    const upper = shape(root, new THREE.CylinderGeometry(.13, .108, 1, 6), jacket, 0, 0, 0);
    const fore = shape(root, new THREE.CylinderGeometry(.105, .085, 1, 6), jacket, 0, 0, 0);
    upper.userData.animated = fore.userData.animated = true;
    const hand = new THREE.Group(); hand.name = side === 1 ? 'left-hand' : 'right-hand'; root.add(hand);
    cube(hand, 0, -.009, .051, .143, .085, .164, skin);
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Group(); finger.position.set(-.048 + i * .032, 0, .125); hand.add(finger);
      cube(finger, 0, -.009, .044, .026, .031, .09 - Math.abs(i - 1.5) * .007, skin); fingers.push(finger);
    }
    cube(hand, -side * .087, -.014, .063, .041, .057, .096, skin);
    const elbow = new THREE.Vector3(), wrist = new THREE.Vector3(), origin = new THREE.Vector3();
    function pose(e, w, tilt = 0) {
      elbow.set(...e); wrist.set(...w); segment(upper, origin, elbow); segment(fore, elbow, wrist);
      hand.position.copy(wrist); hand.rotation.x = tilt;
    }
    pose([side * .04, -.32, .05], [side * .04, -.63, .10]);
    return { root, hand, fingers, pose };
  }
  const left = makeArm(1), right = makeArm(-1);
  let rifle, laptop, terminalCursor, paperwork, cape, smoke = [];

  if (isGuard) {
    rifle = new THREE.Group(); rifle.name = 'scoped-rifle'; rifle.position.set(-.21, 1.27, .40); rifle.rotation.z = -.12; body.add(rifle);
    cube(rifle, .26, 0, 0, .38, .145, .14, 0x272733);
    cube(rifle, -.09, 0, 0, .38, .11, .13, 0x141a22);
    bone(rifle, [-.25, 0, 0], [-.92, 0, 0], .034, 0x121722);
    bone(rifle, [-.9, 0, 0], [-1.03, 0, 0], .057, 0x252b34);
    bone(rifle, [-.4, .16, 0], [.035, .16, 0], .069, 0x10151e);
    cube(rifle, -.15, .085, 0, .18, .10, .047, 0x272c33);
    cube(rifle, .12, -.13, 0, .075, .23, .072, 0x111720).rotation.z = -.24;
    cube(rifle, -.09, -.115, 0, .085, .17, .072, 0x262935).rotation.z = -.10;
  } else if (isHacker) {
    laptop = new THREE.Group(); laptop.name = 'typing-laptop'; laptop.position.set(0, 1.093, .90); parent.add(laptop);
    cube(laptop, 0, 0, 0, .99, .045, .66, 0x4c5059);
    const keyboard = cube(laptop, 0, .028, -.025, .84, .013, .36, 0x111923, 'keyboard');
    for (let row = 0; row < 4; row++) for (let col = 0; col < 11; col++) cube(laptop, -.368 + col * .073, .039, -.16 + row * .078, .052, .008, .048, (col + row) % 4 ? 0x59616a : 0x86919a);
    cube(laptop, 0, .033, -.26, .29, .009, .08, 0x818b93);
    const lid = new THREE.Group(); lid.name = 'laptop-screen'; lid.position.set(0, .024, .318); lid.rotation.x = .12; laptop.add(lid);
    cube(lid, 0, .32, 0, 1.01, .64, .047, 0x202a33);
    box(0, .32, -.028, .916, .53, .01, 0x10232c, lid, true);
    for (let i = 0; i < 9; i++) box(-.41 + (.27 + (i % 4) * .075) / 2, .54 - i * .050, -.036, .27 + (i % 4) * .075, .012, .007, i % 3 ? 0x79baad : 0xced997, lid, true);
    terminalCursor = box(-.21, .10, -.037, .033, .024, .008, 0xc2ded4, lid, true); terminalCursor.name = 'terminal-cursor';
    // The keyboard is on the desk, at the actual endpoints of the typing hands.
    keyboard.userData.typingSurface = true;
  } else if (data.id === 'assistant') {
    cape = new THREE.Group(); cape.name = 'angular-fur-coat'; body.add(cape);
    const lining = shape(cape, new THREE.CylinderGeometry(.43, .63, 1.26, 8, 1, true, Math.PI / 4, Math.PI * 1.5), 0x58412f, 0, 1.03, -.07); lining.scale.z = .64;
    const transforms = [], colors = [];
    for (let row = 0; row < 6; row++) for (let col = 0; col < 13; col++) {
      const angle = .7 + col / 12 * (Math.PI * 2 - 1.4) + (row % 2) * .075;
      const radius = .46 + row * .028;
      const transform = new THREE.Object3D();
      transform.position.set(Math.sin(angle) * radius, 1.62 - row * .207, Math.cos(angle) * radius * .60 -.075);
      transform.rotation.set(Math.cos(angle) * .48, -angle, Math.PI - Math.sin(angle) * .52);
      transform.scale.set(1.05 + row * .07, .82 + row * .045, .59);
      transform.updateMatrix(); transforms.push(transform.matrix.clone()); colors.push(new THREE.Color([0x7e593b, 0x98724e, 0x624934, 0xad875e, 0x896144][(row * 3 + col) % 5]));
    }
    const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(.175, .55, 4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), transforms.length);
    transforms.forEach((matrix, i) => { tufts.setMatrixAt(i, matrix); tufts.setColorAt(i, colors[i]); }); tufts.castShadow = true; tufts.computeBoundingSphere(); cape.add(tufts);
    // Wider pointed collar, characteristic of the supplied fur-coat character.
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) hairLock(cape, [side * .25, 1.58, .07 - i * .09], [side * (.66 + i * .06), 1.67 - i * .055, .19 - i * .085], .14, [0xa7845c, 0x876545][i % 2]);
    const cigar = new THREE.Group(); cigar.name = 'cigar'; cigar.position.set(-.075, -.184, .257); head.add(cigar);
    bone(cigar, [0, 0, 0], [-.22, .018, .23], .026, 0x65432b);
    shape(cigar, new THREE.IcosahedronGeometry(.029, 0), 0xc07949, -.222, .018, .231);
    for (let i = 0; i < 4; i++) {
      const puff = shape(cigar, new THREE.IcosahedronGeometry(.037, 0), new THREE.MeshBasicMaterial({ color: 0xc2bcb3, transparent: true, opacity: .21, depthWrite: false }), -.24, .08 + i * .10, .24);
      puff.name = 'cigar-smoke'; smoke.push(puff);
    }
    paperwork = new THREE.Group(); paperwork.name = 'paperwork'; right.hand.add(paperwork); paperwork.position.set(.045, -.012, .13); paperwork.rotation.set(.55, 0, .08);
    cube(paperwork, 0, 0, 0, .30, .025, .40, 0x4e4240);
    cube(paperwork, 0, .016, 0, .255, .005, .35, 0xd1c3ad);
    for (let i = 0; i < 5; i++) cube(paperwork, 0, .021, -.10 + i * .045, i % 2 ? .14 : .19, .004, .009, 0x776d63);
    // Vest chain, kept close to the body.
    const chain = shape(body, new THREE.TorusGeometry(.105, .008, 3, 10, Math.PI), 0xc1a263, .17, 1.06, .237); chain.rotation.z = Math.PI;
  }

  function update(time, reducedMotion = false) {
    const t = reducedMotion ? 0 : time;
    body.position.y = reducedMotion ? 0 : Math.sin(t * 1.55) * .009;
    head.rotation.set(0, 0, 0);
    if (isHacker) {
      const activity = reducedMotion ? 0 : (Math.sin(t * .83) > -.72 ? 1 : .1);
      const leftTap = Math.sin(t * 19.4) * .021 * activity;
      const rightTap = Math.sin(t * 18.1 + Math.PI) * .021 * activity;
      head.rotation.x = .19 + Math.sin(t * 1.5) * .017;
      head.rotation.y = Math.sin(t * .48) * .023;
      left.pose([.04, -.245, .30], [-.105, -.19 + leftTap, .69], -.10);
      right.pose([-.04, -.245, .30], [.105, -.19 + rightTap, .69], -.10);
      for (const [arm, phase] of [[left, 0], [right, 2.4]]) arm.fingers.forEach((finger, i) => { finger.rotation.x = reducedMotion ? .12 : .13 + Math.max(0, Math.sin(t * 19 + phase + i * 1.6)) * .33 * activity; });
      terminalCursor.visible = reducedMotion || Math.floor(t * 2) % 2 === 0;
    } else if (isGuard) {
      const scan = Math.sin(t * .42) * .09;
      head.rotation.y = scan;
      body.rotation.y = scan * .24;
      right.pose([-.10, -.29, .17], [.26, -.34, .42], .10);
      left.pose([-.06, -.34, .18], [-.78, -.38, .39], -.07);
      rifle.rotation.z = -.12 + Math.sin(t * 1.55) * .006;
    } else if (isStrategist) {
      const gesture = Math.sin(t * 1.35), breath = Math.sin(t * .62);
      head.rotation.y = breath * .10; head.rotation.z = -.025;
      right.pose([-.12, -.24, .07], [-.25 - gesture * .055, -.04 + gesture * .075, .34], -1.35);
      right.hand.rotation.z = -.17 + gesture * .06;
      left.pose([.12, -.33, -.03], [-.055, -.57, .12], .09);
      right.fingers.forEach((finger, i) => { finger.rotation.x = .15 + i * .05; });
    } else {
      const read = .5 + .5 * Math.sin(t * .65);
      head.rotation.x = .055 + read * .07; head.rotation.y = -.07 - read * .025;
      right.pose([-.10, -.32, .17], [.09, -.23 + read * .055, .43], -.25);
      left.pose([.12, -.34, -.01], [-.025, -.58, .1], .16);
      cape.rotation.z = Math.sin(t * .8) * .004;
      smoke.forEach((puff, i) => {
        const phase = reducedMotion ? i / smoke.length : ((t * .23 + i / smoke.length) % 1);
        puff.position.set(-.24 + Math.sin(phase * 8 + i) * .033, .045 + phase * .43, .24);
        puff.scale.setScalar(.52 + phase * .8); puff.material.opacity = (1 - phase) * .22;
      });
    }
  }
  update(0, true);
  // Merge rigid pieces within each moving joint. A keyboard, hairstyle or pair
  // of glasses should not cost a draw call for every key, hair strand or frame.
  function batchRigidParts(group) {
    for (const child of [...group.children]) if (child.isGroup) batchRigidParts(child);
    const batches = new Map();
    for (const node of group.children) {
      if (!node.isMesh || node.isInstancedMesh || node.name || node.userData.animated || Array.isArray(node.material)) continue;
      if (!batches.has(node.material)) batches.set(node.material, []);
      batches.get(node.material).push(node);
    }
    for (const [mat, nodes] of batches) {
      if (nodes.length < 2) continue;
      const positions = [], normals = [], uvs = [];
      for (const node of nodes) {
        node.updateMatrix();
        const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
        geometry.applyMatrix4(node.matrix);
        if (!geometry.attributes.normal) geometry.computeVertexNormals();
        positions.push(...geometry.attributes.position.array); normals.push(...geometry.attributes.normal.array);
        uvs.push(...(geometry.attributes.uv?.array || new Float32Array(geometry.attributes.position.count * 2)));
        geometry.dispose(); group.remove(node);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      const combined = new THREE.Mesh(geometry, mat); combined.castShadow = combined.receiveShadow = true; group.add(combined);
    }
  }
  batchRigidParts(parent);
  return { head, body, left, right, update, suitMaterial: goldSuit, laptop, rifle, cape };
}
