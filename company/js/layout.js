// Shared by rendering, collision handling and the route tests. Units are metres.
export const PLAYER_RADIUS = 0.34;
export const SPAWN = { x: 0, z: 13 };
export const STAFF = [
  { id: 'okapo', name: 'おかぽ', role: '代表取締役社長', en: 'THE DIRECTOR', x: 0, z: -14, color: 0xc7bbae, scale: 1.3, leftArm: false, quote: 'よく来たね。ここから、次の世界をつくろう。', description: 'おかぽ会社のすべての作戦を統括する社長。サングラスとコートがトレードマーク。今日も司令室から、AIの新しい可能性を見つめている。' },
  { id: 'security', name: '警備・情報収集担当', role: '警備・情報収集部', en: 'SECURITY & INTELLIGENCE', x: -10, z: 6, color: 0x292734, leftArm: true, footprint: { w: 2.5, d: 1.4, x: -.3, z: .1 }, quote: '異常なし。君の入館も、ちゃんと把握している。', description: '黒いベレー帽とサングラスが目印。スコープ付きの装備を抱え、机の横から静かに周囲を見渡す警備・情報収集担当。' },
  { id: 'developer', name: '開発・インフラ担当', role: '開発・インフラ部', en: 'DEVELOPMENT & INFRASTRUCTURE', x: -8.6, z: -3.8, desk: { x: -8.6, z: -2.5 }, color: 0x171c23, leftArm: true, footprint: { w: 1.3, d: 2, z: .35 }, quote: 'ビルド完了。サーバールームも見ていく？', description: '黒いフード、四角い眼鏡、白いソールのスニーカー。机のノートPCでコードを書き続けるハッカー。左側のサーバールームも彼の担当。' },
  { id: 'strategy', name: '戦略・企画担当', role: '戦略・企画部', en: 'STRATEGY & PLANNING', x: 9, z: 6, color: 0x41341c, leftArm: true, footprint: { w: 1.65, d: 1.4, z: .1 }, quote: '次の一手？ それはまだ、社内機密。', description: '黒髪を撫でつけ、黒と金の柄スーツを着こなす企画担当。片手を広げて、次のプロジェクトの構想を語る。' },
  { id: 'assistant', name: '秘書・管理補佐担当', role: '秘書・管理室', en: 'ADMINISTRATION', x: 10, z: -4, color: 0x805c3e, leftArm: true, footprint: { w: 2, d: 1.75, z: .08 }, quote: 'ようこそ。資料は右の部屋にまとめてあります。', description: '金髪、葉巻、大きな茶色のファーコートが目印。黒いスーツ姿で社内の書類を確認し、社長と各部署の連携を取り仕切る。' },
];
export const WALLS = [
  { x: 0, z: -17, w: 32.5, d: 0.45, h: 8 },
  { x: 0, z: 17, w: 32.5, d: 0.45, h: 5, cutaway: true },
  ...[-1, 1].flatMap(s => [
    { x: s * 16, z: -12.4, w: 0.4, d: 9.2, h: 6 },
    { x: s * 16, z: 6.4, w: 0.4, d: 21.2, h: 6, cutaway: true },
    { x: s * 25, z: -4, w: 0.4, d: 16.4, h: 5 },
    { x: s * 20.5, z: -12, w: 9, d: 0.4, h: 5 },
    { x: s * 20.5, z: 4, w: 9, d: 0.4, h: 5, cutaway: true },
  ]),
];
export const DOORS = [
  { id: 'server', name: 'サーバールーム', x: -16, z: -6, width: 3.6 },
  { id: 'archive', name: '資料室', x: 16, z: -6, width: 3.6 },
];
export const DESKS = [
  { x: 0, z: -12.6, w: 6, d: 1.5, boss: true },
  ...STAFF.slice(1).map(s => ({ x: s.desk?.x ?? s.x + (s.x < 0 ? 1.4 : -1.4), z: s.desk?.z ?? s.z + 1.5, w: 3.3, d: 1.5, staff: s.id })),
];
export const CABINETS = [
  ...[-9, -5, -1].map(z => ({ x: -23.4, z, w: 1.8, d: 2.2, type: 'server' })),
  ...[-9, -4, 1].map(z => ({ x: 23.5, z, w: 1.5, d: 3, type: 'shelf' })),
  { x: 20, z: -10.6, w: 3, d: 1.3, type: 'shelf' },
];
export function boxCollider({ x, z, w, d, ...rest }) {
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, ...rest };
}
export function makeColliders() {
  return [
    ...WALLS.map(boxCollider), ...DESKS.map(boxCollider), ...CABINETS.map(boxCollider),
    boxCollider({ x: 0, z: 2, w: 5.6, d: 5.6 }),
    ...STAFF.map(s => boxCollider({ x: s.x + (s.footprint?.x || 0), z: s.z + (s.footprint?.z || 0), w: s.footprint?.w || .8, d: s.footprint?.d || .8, staff: s.id })),
  ];
}
export function doorCollider(door) {
  // The entire opening stays blocked until the moving panel clears the doorway.
  return boxCollider({ x: door.x, z: door.z, w: 0.4, d: door.width });
}
export function inBuilding(x, z) {
  return (Math.abs(x) < 16 && z > -17 && z < 17) ||
    (Math.abs(x) < 25 && z > -12 && z < 4);
}
export function collides(x, z, obstacles, radius = PLAYER_RADIUS) {
  if (!inBuilding(x, z)) return true;
  return obstacles.some(b => {
    const dx = x - Math.max(b.minX, Math.min(x, b.maxX));
    const dz = z - Math.max(b.minZ, Math.min(z, b.maxZ));
    return dx * dx + dz * dz < radius * radius;
  });
}
export function movePlayer(position, dx, dz, obstacles) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (PLAYER_RADIUS * 0.5)));
  for (let i = 0; i < steps; i++) {
    if (!collides(position.x + dx / steps, position.z, obstacles)) position.x += dx / steps;
    if (!collides(position.x, position.z + dz / steps, obstacles)) position.z += dz / steps;
  }
  return position;
}
export function canCloseDoor(door, player) {
  return Math.abs(player.x - door.x) > 1 || Math.abs(player.z - door.z) > door.width / 2 + 0.7;
}
export function floorHeight(x, z) {
  if (Math.abs(x) >= 8.2 || z > -8) return 0;
  const sideSlope = Math.min(1, 8.2 - Math.abs(x));
  return Math.min(0.45, (-z - 8) * 0.225) * sideSlope;
}
export function roomAt(x, z) {
  if (x < -16) return { id: 'server', name: 'サーバールーム', en: 'SERVER ROOM', number: '02' };
  if (x > 16) return { id: 'archive', name: '資料室', en: 'THE ARCHIVE', number: '03' };
  return { id: 'command', name: z < -9 ? '司令室 / 社長エリア' : '中央司令室', en: 'COMMAND CENTER', number: '01' };
}
