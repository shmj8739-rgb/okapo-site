import * as THREE from '../vendor/three.module.min.js';
import { WALLS, STAFF, DESKS, CABINETS, DOORS, floorHeight } from './layout.js?v=2';
import { createEmployee } from './employees.js?v=2';

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x131923);
  scene.fog = new THREE.FogExp2(0x131923, 0.007);
  const materials = new Map(), batches = new Map(), cutaway = [];
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const textures = [];
  function material(color, glow = false) {
    const key = `${color}:${glow}`;
    if (!materials.has(key)) materials.set(key, glow
      ? new THREE.MeshBasicMaterial({ color })
      : new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.23, flatShading: true }));
    return materials.get(key);
  }
  function box(x, y, z, w, h, d, color, parent = null, glow = false, angle = 0) {
    const mat = material(color, glow);
    if (!parent) {
      if (!batches.has(mat)) batches.set(mat, []);
      const transform = new THREE.Object3D();
      transform.position.set(x, y, z); transform.scale.set(w, h, d); transform.rotation.y = angle; transform.updateMatrix();
      batches.get(mat).push(transform.matrix.clone());
      return null;
    }
    const m = new THREE.Mesh(boxGeometry, mat);
    m.position.set(x, y, z); m.scale.set(w, h, d); m.rotation.y = angle;
    m.castShadow = !glow; m.receiveShadow = !glow; parent.add(m);
    return m;
  }
  function mesh(geometry, color, x, y, z, parent = scene, glow = false) {
    const m = new THREE.Mesh(geometry, material(color, glow));
    m.position.set(x, y, z); m.castShadow = !glow; m.receiveShadow = !glow; parent.add(m); return m;
  }
  function textPlane(text, width, height, x, y, z, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = options.resolution || 1024; canvas.height = Math.round(canvas.width * height / width);
    const ctx = canvas.getContext('2d');
    if (options.background) { ctx.fillStyle = options.background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${options.weight || 700} ${Math.floor(canvas.height * (options.fontSize || 0.58))}px "Noto Sans JP", sans-serif`;
    ctx.fillStyle = options.color || '#e5e4e1'; ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width * .94);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: !options.background, side: THREE.DoubleSide, depthWrite: !!options.background });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    p.position.set(x, y, z); p.rotation.y = options.rotation || 0; (options.parent || scene).add(p); return p;
  }
  // One face, no tentacles: the same faceted silhouette is used for the wall insignia.
  function face(parent, scale = 1, skin = 0xdbd4c7) {
    const head = new THREE.Group(); parent.add(head); head.scale.setScalar(scale);
    const skull = mesh(new THREE.IcosahedronGeometry(.36, 1), skin, 0, 0, 0, head); skull.scale.set(.86, 1.15, .83); skull.name = 'face';
    for (const x of [-.145, .145]) {
      const lens = mesh(new THREE.CylinderGeometry(.145, .145, .045, 6), 0x07090c, x, .05, .255, head);
      lens.rotation.x = Math.PI / 2; lens.scale.y = 1; lens.name = 'sunglasses';
    }
    box(0, .06, .279, .12, .028, .04, 0x111113, head);
    box(0, -.2, .247, .16, .018, .024, 0x766e66, head);
    const nose = mesh(new THREE.ConeGeometry(.067, .17, 3), 0xb5aca0, 0, -.067, .294, head);
    nose.rotation.x = -.2;
    return head;
  }
  scene.add(new THREE.HemisphereLight(0xc4d8ed, 0x41404b, 2.2));
  const key = new THREE.DirectionalLight(0xffeddd, 3.3);
  key.position.set(5, 22, 14); key.castShadow = true;
  Object.assign(key.shadow.camera, { left: -29, right: 29, top: 29, bottom: -29, near: .5, far: 80 });
  key.shadow.mapSize.set(1024, 1024); key.shadow.normalBias = .06; key.shadow.bias = -.0003; scene.add(key);
  const fill = new THREE.DirectionalLight(0x8797cc, 1.2); fill.position.set(-12, 8, -8); scene.add(fill);
  for (const x of [-12, 12]) {
    const light = new THREE.PointLight(0xff253d, 28, 23, 2); light.position.set(x, 3.3, -13); scene.add(light);
  }
  const hologramLight = new THREE.PointLight(0xff5e66, 12, 11, 2); hologramLight.position.set(0, 3, 2); scene.add(hologramLight);

  // Raised architectural model, with no roof so the overview remains legible.
  box(0, -.48, 0, 32.4, .9, 34.4, 0x161c24);
  for (const x of [-20.5, 20.5]) box(x, -.48, -4, 9.1, .9, 16.4, 0x161c24);
  box(0, -.016, 0, 32, .04, 34, 0x303741);
  for (const x of [-20.5, 20.5]) box(x, -.016, -4, 9, .04, 16, 0x282f39);
  // Floor joints are instanced, without a large texture or postprocessing pass.
  for (let x = -15; x <= 15; x += 2) box(x, .009, 0, .022, .008, 34, 0x414853);
  for (let z = -16; z <= 16; z += 2) box(0, .009, z, 32, .008, .022, 0x414853);
  for (const x of [-4.8, 4.8]) {
    box(x, .018, 3, .065, .018, 27, 0xbe3947, null, true);
    for (let z = 7; z < 15; z += 1.8) box(x + (x < 0 ? -.17 : .17), .02, z, .12, .012, .6, 0xb4444e);
  }
  box(0, .025, 14.5, 9.6, .025, .075, 0xf34e5c, null, true);
  for (const wall of WALLS) {
    const group = new THREE.Group(); scene.add(group);
    box(wall.x, wall.h / 2, wall.z, wall.w, wall.h, wall.d, 0x21252e, group);
    box(wall.x, .12, wall.z, wall.w + .035, .11, wall.d + .035, 0xb63443, group, true);
    box(wall.x, wall.h - .08, wall.z, wall.w + .07, .13, wall.d + .07, 0x424651, group);
    if (wall.cutaway) cutaway.push(group);
  }
  // Back wall: red architectural fins, a face-only crest and readable company name.
  for (const x of [-14.5, -10.2, -6, 6, 10.2, 14.5]) {
    box(x, 3.9, -16.63, .22, 7.8, .5, 0x722f3b);
    box(x - .16, 3.9, -16.29, .045, 7.8, .04, 0xf34755, null, true);
  }
  box(0, 4.1, -16.65, 10.8, 7.6, .45, 0x151922);
  const logo = new THREE.Group(); logo.name = 'face-only-logo'; logo.position.set(0, 5.75, -16.11); scene.add(logo); face(logo, 3.65);
  textPlane('おかぽ会社', 8.2, 1.2, 0, 3.8, -16.36);
  textPlane('O K A P O   C O M P A N Y', 7.2, .48, 0, 2.85, -16.35, { color: '#afa8aa', weight: 400 });
  for (const [x, label, sub] of [[-12, 'AUTOMATE', 'すべての可能性を、動かす。'], [12, 'BEYOND', '次の世界は、この部屋から。']]) {
    textPlane(label, 5.6, .7, x, 6.45, -16.36, { color: '#e86a72' });
    textPlane(sub, 5.2, .44, x, 5.8, -16.35, { color: '#b3b5bf' });
    box(x, 3.42, -16.27, 5.5, 3.1, .22, 0x0c131d);
    for (let j = 0; j < 10; j++) {
      box(x - 2.25 + j * .49, 2.35 + (j % 4) * .13, -16.12, .27, .6 + (j * 7 % 6) * .27, .025, j % 3 ? 0x536776 : 0xd65b65, null, true);
    }
    textPlane(x < 0 ? 'SYSTEM / ALL NODES ACTIVE' : 'OPERATIONS / SECTOR 01', 4.7, .38, x, 4.65, -16.11, { color: '#b5c8d6' });
  }
  // Shallow, continuous ramp: no invisible step barrier in front of the director.
  box(0, .215, -13.5, 14.4, .45, 7, 0x272b34);
  const rampGeometry = new THREE.BufferGeometry();
  const rampVertices = [], xs = [-8.2, -7.2, 7.2, 8.2], zs = [-17, -10, -8];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    for (const [x, z] of [[xs[i], zs[j]], [xs[i], zs[j+1]], [xs[i+1], zs[j]], [xs[i+1], zs[j]], [xs[i], zs[j+1]], [xs[i+1], zs[j+1]]]) {
      rampVertices.push(x, floorHeight(x, z), z);
    }
  }
  rampGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rampVertices, 3));
  rampGeometry.computeVertexNormals(); mesh(rampGeometry, 0x323541, 0, 0, 0);
  box(0, .014, -8, 14.4, .024, .07, 0xeb414e, null, true);
  for (const x of [-7.17, 7.17]) box(x, .48, -13.5, .065, .04, 7, 0xe34351, null, true);

  function monitor(x, y, z, index = 0, scale = 1) {
    box(x, y + .18 * scale, z, .12 * scale, .36 * scale, .12 * scale, 0x202633);
    box(x, y + .015, z, .56 * scale, .055, .4 * scale, 0x111821);
    box(x, y + .63 * scale, z, 1.14 * scale, .7 * scale, .095, 0x0a0f18);
    box(x, y + .64 * scale, z + .056, 1.04 * scale, .57 * scale, .01, 0x172c3c, null, true);
    box(x, y + .83 * scale, z + .07, .88 * scale, .025, .01, 0x72afbd, null, true);
    for (let j = 0; j < 5; j++) {
      const w = (.23 + ((j + index * 2) % 4) * .13) * scale;
      box(x - .43 * scale + w / 2, y + (.73 - j * .069) * scale, z + .07, w, .013 * scale, .01, j === 2 ? 0xe96c7b : 0x577e98, null, true);
    }
  }
  for (const [index, desk] of DESKS.entries()) {
    const base = floorHeight(desk.x, desk.z);
    box(desk.x, base + 1, desk.z, desk.w, .14, desk.d, desk.boss ? 0x4c4547 : 0x414752);
    for (const s of [-1, 1]) box(desk.x + s * (desk.w / 2 - .2), base + .48, desk.z, .22, .96, desk.d - .16, 0x161c26);
    box(desk.x, base + .91, desk.z + desk.d / 2 + .006, desk.w - .18, .035, .024, 0xdf4a57, null, true);
    if (desk.staff !== 'developer') monitor(desk.x - .56, base + 1.09, desk.z -.19, index, desk.boss ? 1.15 : .95);
    if (desk.boss) monitor(desk.x + .92, base + 1.09, desk.z -.19, 1);
    if (desk.staff !== 'developer') box(desk.x - .5, base + 1.088, desk.z + .37, .81, .04, .26, 0x111825);
    box(desk.x + 1, base + 1.09, desk.z + .3, .47, .025, .34, 0xd0c4b6, null, false, -.15);
    mesh(new THREE.CylinderGeometry(.095, .083, .19, 8), 0xa63746, desk.x + .76, base + 1.17, desk.z + .05);
    // Chairs are behind desks, away from the public circulation route.
    if (!desk.boss) {
      box(desk.x, base + .53, desk.z - 1.17, .66, .14, .62, 0x141922);
      box(desk.x, base + .97, desk.z - 1.48, .68, .9, .13, 0x1f2530);
      box(desk.x, base + .26, desk.z - 1.17, .12, .52, .12, 0x161c26);
    }
    const title = desk.boss ? '代表取締役社長  おかぽ' : STAFF.find(s => s.id === desk.staff).role;
    textPlane(title, desk.boss ? 3.1 : 2.6, .32, desk.x, base + .65, desk.z + desk.d / 2 + .015, { color: '#e8dedd', resolution: 768 });
  }

  const people = [];
  for (const data of STAFF) {
    const p = new THREE.Group(); p.name = data.id; p.position.set(data.x, floorHeight(data.x, data.z), data.z);
    p.scale.setScalar(data.scale || 1); scene.add(p);
    let rig = null, head;
    if (data.id !== 'okapo') {
      rig = createEmployee(data, p, { box, mesh, material });
      head = rig.head;
    } else {
    const torso = mesh(new THREE.CylinderGeometry(.28, .39, 1.02, 6), data.color, 0, 1.07, 0, p); torso.name = 'coat'; torso.scale.z = .72;
    for (const s of [-1, 1]) {
      box(s * .15, .33, 0, .2, .65, .23, 0x1a1d25, p).name = s > 0 ? 'left-leg' : 'right-leg';
      box(s * .15, .06, .07, .24, .12, .39, 0x0c1017, p);
    }
    box(0, 1.34, .195, .2, .49, .04, data.id === 'okapo' ? 0x383332 : 0xaaa59e, p);
    box(0, 1.37, .23, .062, .33, .025, 0x8b2b3c, p);
    for (const s of [-1, 1]) {
      // A character facing +Z has its anatomical left on local +X.
      // No left arm, hand OR sleeve is created for the director.
      if (s === 1 && data.leftArm === false) continue;
      const sleeve = box(s * .39, 1.05, 0, .19, .67, .23, data.color, p);
      sleeve.name = s === 1 ? 'left-arm' : 'right-arm'; sleeve.rotation.z = s * .11;
      const hand = mesh(new THREE.IcosahedronGeometry(.12, 0), 0xc8b39d, s * .43, .66, .035, p);
      hand.name = s === 1 ? 'left-hand' : 'right-hand';
    }
    box(0, .95, .239, .61, .07, .04, 0x262328, p);
    box(.02, .95, .27, .11, .1, .04, 0x95856c, p);
    head = new THREE.Group(); head.position.y = 1.92; p.add(head); face(head, data.id === 'okapo' ? 1.09 : .96, data.id === 'okapo' ? 0xe0d8c8 : 0xc6ad96);
    if (data.id !== 'okapo') {
      const hair = mesh(new THREE.IcosahedronGeometry(.34, 0), data.id === 'strategy' ? 0x27202a : 0x212329, 0, .18, -.04, head); hair.scale.set(1, .57, 1);
    }
    if (data.id === 'security') box(0, .27, .06, .64, .14, .53, 0x222b3d, head);
    if (data.id === 'developer') {
      const hood = mesh(new THREE.IcosahedronGeometry(.41, 1), data.color, 0, -.03, -.13, head); hood.scale.set(1.04, 1.2, .62);
    }
    if (data.id === 'assistant') box(-.45, .88, .18, .3, .37, .05, 0x718996, p);
    }
    const ring = mesh(new THREE.RingGeometry(.63, .66, 28), data.id === 'okapo' ? 0xf35760 : 0x98606e, data.x, floorHeight(data.x, data.z) + .013, data.z, scene, true);
    ring.rotation.x = -Math.PI / 2;
    textPlane(data.id === 'okapo' ? '01 / DIRECTOR' : `0${people.length + 1} / ${data.en.split(' & ')[0]}`, 2.6, .3, data.x, floorHeight(data.x, data.z) + 2.8 * (data.scale || 1), data.z, { color: data.id === 'okapo' ? '#ffb4b1' : '#bfcbd4', resolution: 512 });
    people.push({ data, group: p, head, rig });
  }

  // Central, walk-around command table and animated low-poly hologram.
  mesh(new THREE.CylinderGeometry(2.85, 2.6, .24, 8), 0x242a36, 0, 1.05, 2);
  mesh(new THREE.CylinderGeometry(1.75, 2.1, .95, 8), 0x191e29, 0, .5, 2);
  mesh(new THREE.CylinderGeometry(2.66, 2.66, .015, 8), 0x1a202d, 0, 1.18, 2);
  const edge = mesh(new THREE.TorusGeometry(2.72, .027, 4, 8), 0xfa5768, 0, 1.18, 2, scene, true); edge.rotation.x = Math.PI / 2;
  const hologram = new THREE.Group(); hologram.position.set(0, 2.85, 2); scene.add(hologram);
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(1.26, 1), new THREE.MeshBasicMaterial({ color: 0xff5d73, wireframe: true, transparent: true, opacity: .7 })); hologram.add(globe);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.21, 0), new THREE.MeshBasicMaterial({ color: 0xe93355, transparent: true, opacity: .12, depthWrite: false })); hologram.add(core);
  for (let i = 0; i < 3; i++) {
    const ring = mesh(new THREE.TorusGeometry(1.52 + i * .19, .009, 3, 48), 0xd85871, 0, 0, 0, hologram, true);
    ring.rotation.set(Math.PI / 2 + i * .45, i * .5, .25);
  }
  textPlane('O K A P O   /   N E T W O R K', 3.65, .32, 0, .82, 4.64, { color: '#eaa0a5', resolution: 768 });
  for (const s of [-1, 1]) for (let j = 0; j < 4; j++) box(s * 1.1 + j * .1, 1.21, 3.9, .06, .018, .14, 0xea7986, null, true);

  const doors = DOORS.map(data => {
    const group = new THREE.Group(); group.position.set(data.x, 0, data.z); scene.add(group);
    // Sliding along Z into the adjacent wall; no swinging leaf in the aisle.
    const panel = new THREE.Group(); group.add(panel);
    box(0, 1.8, 0, .3, 3.6, data.width, 0x4f2736, panel);
    box(-.16, 1.8, 0, .035, 3.55, .075, 0xff6470, panel, true);
    box(.16, 1.8, 0, .035, 3.55, .075, 0xff6470, panel, true);
    for (const s of [-1, 1]) box(0, 1.95, s * (data.width / 2 + .12), .65, 3.9, .24, 0x101820, group);
    box(0, 3.82, 0, .65, .26, data.width + .5, 0x111722, group);
    const inward = data.x < 0 ? 1 : -1;
    textPlane(data.name, 3.15, .48, data.x + inward * .36, 4.38, data.z, { rotation: inward * Math.PI / 2, color: '#f2a1a7', resolution: 512 });
    for (const side of [-1, 1]) textPlane('E  /  ACCESS', 1.7, .3, side * .18, 2.3, 0, { rotation: side * Math.PI / 2, color: '#f5b9bd', parent: panel, resolution: 512 });
    return { ...data, group, panel, progress: 0, target: 0 };
  });
  for (const c of CABINETS) {
    box(c.x, 1.45, c.z, c.w, 2.9, c.d, 0x171d28);
    if (c.type === 'server') {
      for (let j = 0; j < 7; j++) {
        box(c.x + c.w / 2 + .018, .28 + j * .36, c.z, .035, .29, c.d - .18, 0x323b49);
        box(c.x + c.w / 2 + .043, .3 + j * .36, c.z - .7, .015, .055, .06, 0x78d7c0, null, true);
        for (let k = 0; k < 4; k++) box(c.x + c.w / 2 + .042, .3 + j * .36, c.z -.2 + k * .26, .012, .025, .14, 0x0c131d);
      }
    } else {
      for (let j = 0; j < 4; j++) {
        box(c.x - c.w / 2 - .025, .19 + j * .65, c.z, .04, .065, c.d - .14, 0x8b7974);
        for (let k = 0; k < 6; k++) box(c.x - c.w / 2 - .015, .45 + j * .65, c.z - c.d / 2 + .3 + k * (c.d - .4) / 6, .1, .46, .19, [0x7f424d, 0x717885, 0x9d9388][(j + k) % 3]);
      }
    }
  }
  textPlane('02 / SERVER ROOM', 6.5, .65, -20.5, 3.65, -11.75, { color: '#91b9ca' });
  textPlane('03 / THE ARCHIVE', 6.5, .65, 20.5, 3.65, -11.75, { color: '#c69ca1' });
  for (const x of [-20, 20]) {
    box(x, .85, .3, 2.4, .12, 1.2, 0x454450);
    for (const s of [-1, 1]) box(x + s * 1, .4, .3, .16, .8, .85, 0x202732);
    monitor(x, .93, .16, 3);
  }
  // Fins and suspended lights suggest the ceiling without covering the model.
  for (const x of [-13.7, 13.7]) for (const z of [-10, 0, 10]) {
    box(x, 3.1, z, .32, 6.2, .45, 0x333744);
    box(x + (x < 0 ? .2 : -.2), 2.9, z, .04, 5.4, .065, 0xe34d60, null, true);
    box(x * .73, 6.08, z, 7.7, .19, .24, 0x303746);
    box(x * .73, 5.96, z, 5.3, .035, .14, 0xe0d8cd, null, true);
  }
  // A few warm pools of light and plants add scale to the otherwise hard geometry.
  for (const x of [-13.1, 13.1]) {
    mesh(new THREE.CylinderGeometry(.48, .33, .66, 6), 0x292d37, x, .33, -13.6);
    for (let j = 0; j < 5; j++) {
      const leaf = mesh(new THREE.ConeGeometry(.37, 1.25, 4), j % 2 ? 0x344c46 : 0x496157, x + Math.sin(j * 2) * .3, 1.17 + (j % 2) * .4, -13.6 + Math.cos(j * 2) * .27);
      leaf.rotation.z = Math.sin(j * 2) * .4;
    }
  }
  // Decorative objects that sit at walking height use explicit collision boxes too.
  const extraColliders = [
    ...DESKS.filter(d => !d.boss).map(d => ({ minX: d.x - .4, maxX: d.x + .4, minZ: d.z - 1.65, maxZ: d.z -.83 })),
    ...[-20, 20].map(x => ({ minX: x - 1.2, maxX: x + 1.2, minZ: -.3, maxZ: .9 })),
    ...[-13.1, 13.1].map(x => ({ minX: x - .5, maxX: x + .5, minZ: -14.1, maxZ: -13.1 })),
    ...[-13.7, 13.7].flatMap(x => [-10, 0, 10].map(z => ({ minX: x -.2, maxX: x + .2, minZ: z -.25, maxZ: z + .25 }))),
  ];
  // Static architecture and furniture are batched by material to reduce draw calls.
  for (const [mat, transforms] of batches) {
    const instances = new THREE.InstancedMesh(boxGeometry, mat, transforms.length);
    transforms.forEach((matrix, i) => instances.setMatrixAt(i, matrix));
    instances.castShadow = !mat.isMeshBasicMaterial; instances.receiveShadow = true;
    instances.computeBoundingSphere(); scene.add(instances);
  }
  function setOverview(value) { for (const wall of cutaway) wall.visible = !value; }
  function update(time, dt, reducedMotion) {
    if (!reducedMotion) {
      hologram.rotation.y = time * .13;
      hologram.position.y = 2.85 + Math.sin(time * .6) * .055;
      people.filter(p => !p.rig).forEach((p, i) => { p.head.rotation.y = Math.sin(time * .35 + i * 1.7) * .09; });
    }
    people.forEach(p => p.rig?.update(time, reducedMotion));
    for (const door of doors) {
      door.progress = THREE.MathUtils.damp(door.progress, door.target, 5.5, dt);
      if (Math.abs(door.progress - door.target) < .002) door.progress = door.target;
      door.panel.position.z = -door.progress * (door.width + .22);
    }
  }
  function setSuitTexture(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1.2);
    textures.push(texture);
    people.forEach(p => {
      if (!p.rig?.suitMaterial) return;
      p.rig.suitMaterial.map = texture;
      p.rig.suitMaterial.color.setHex(0xffffff);
      p.rig.suitMaterial.needsUpdate = true;
    });
  }
  return { scene, doors, people, extraColliders, setOverview, update, setSuitTexture, key, textures };
}
