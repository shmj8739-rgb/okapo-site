import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { NODES, CATEGORIES, TOUR_ORDER, validateData } from './nodes.js';

import { motionOffset } from './motion.js';

validateData();
const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPACE = 3.5;
const container = $('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02050b);
scene.fog = new THREE.FogExp2(0x02050b, .016);
const camera = new THREE.PerspectiveCamera(54, 1, .05, 100);
const homePosition = new THREE.Vector3(9, 6.2, 12.4);
camera.position.copy(homePosition);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x02050b);
container.appendChild(renderer.domElement);
const labels = new CSS2DRenderer();
labels.domElement.className = 'space-labels';
container.appendChild(labels.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .07;
controls.minDistance = .8;
controls.maxDistance = 28;
controls.enablePan = true;
controls.autoRotateSpeed = .25;
let autoRotate = false;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1), .65, .55, .32));
composer.addPass(new OutputPass());
const brain = new THREE.Group();
scene.add(brain);
const panel = document.querySelector('.detail-panel');
const nodeMeshes = new Map();
const edges = [];
const adjacency = new Map(NODES.map(n=>[n.id,new Set()]));
let selected = null, category = 'all', mode = 'free', stop = 0, paused = false;
let flight = null, traveling = false, hovered = false, dismissed = null;

function textLabel(text, position, className) {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = text;
  const object = new CSS2DObject(element);
  object.position.copy(position);
  brain.add(object);
  return object;
}

// XYZ are real orthogonal axes; W is explicitly a diagonal 3D projection.
const axisDefs = [
  {key:'X',direction:new THREE.Vector3(1,0,0),color:0x65b8ff,ends:['論理','直感']},
  {key:'Y',direction:new THREE.Vector3(0,1,0),color:0xbedaff,ends:['静','熱']},
  {key:'Z',direction:new THREE.Vector3(0,0,1),color:0x818fff,ends:['過去','未来']},
  {key:'W',direction:new THREE.Vector3(-.65,.75,-.4).normalize(),color:0xc2a5ff,ends:['具体','抽象']}
];
for(const a of axisDefs) {
  const extent = SPACE * 1.3;
  const geometry = new THREE.BufferGeometry().setFromPoints([a.direction.clone().multiplyScalar(-extent), a.direction.clone().multiplyScalar(extent)]);
  const material = a.key==='W'
    ? new THREE.LineDashedMaterial({color:a.color,dashSize:.15,gapSize:.11,transparent:true,opacity:.8})
    : new THREE.LineBasicMaterial({color:a.color,transparent:true,opacity:.48});
  const axis = new THREE.Line(geometry,material);
  axis.computeLineDistances();
  brain.add(axis);
  [-1,1].forEach((sign,index)=>{
    textLabel(a.key+' / '+a.ends[index],a.direction.clone().multiplyScalar(sign*(extent+.22)),'axis-label axis-'+a.key.toLowerCase());
    const mark = new THREE.Mesh(new THREE.SphereGeometry(.033,8,8),new THREE.MeshBasicMaterial({color:a.color}));
    mark.position.copy(a.direction).multiplyScalar(sign*SPACE);brain.add(mark);
  });
}
textLabel('W / Concrete ←→ Abstract',new THREE.Vector3(-2.4,3.55,-1.6),'axis-label w-caption');
const origin = new THREE.Mesh(new THREE.SphereGeometry(.095,20,20),new THREE.MeshBasicMaterial({color:0xffffff}));
brain.add(origin);

const glowCanvas = document.createElement('canvas');
glowCanvas.width = glowCanvas.height = 128;
const ctx = glowCanvas.getContext('2d');
const gradient = ctx.createRadialGradient(64,64,0,64,64,64);
gradient.addColorStop(0,'rgba(255,255,255,.75)');
gradient.addColorStop(.18,'rgba(255,255,255,.35)');
gradient.addColorStop(.55,'rgba(255,255,255,.07)');
gradient.addColorStop(1,'rgba(255,255,255,0)');
ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
const glowTexture=new THREE.CanvasTexture(glowCanvas);
const originGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0xc5d6ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
originGlow.scale.setScalar(1.5);brain.add(originGlow);

for(const [index,node] of NODES.entries()) {
  const abstract=(node.axes.w+1)/2, heat=(node.axes.y+1)/2;
  const base=new THREE.Vector3(node.axes.x,node.axes.y,node.axes.z).multiplyScalar(SPACE);
  const group=new THREE.Group();group.position.copy(base);
  const color=CATEGORIES[node.category];
  const core=new THREE.Mesh(new THREE.SphereGeometry(.06+.1*(1-abstract),24,24),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1-.65*abstract}));
  const shell=new THREE.Mesh(new THREE.SphereGeometry(.24,32,24),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.08+.17*(1-abstract),depthWrite:false}));
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.25,.004+.007*(1-abstract),8,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65-.48*abstract}));
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.35+.4*abstract,blending:THREE.AdditiveBlending,depthWrite:false}));
  const glowSize=.65+abstract*1.65;glow.scale.setScalar(glowSize);
  const hit=new THREE.Mesh(new THREE.SphereGeometry(.3,12,12),new THREE.MeshBasicMaterial({visible:false}));
  hit.userData.id=node.id;
  group.add(core,shell,rim,glow,hit);
  const label=document.createElement('button');label.className='node-label';label.textContent=node.title;
  label.addEventListener('click',()=>choose(node.id));
  const labelObject=new CSS2DObject(label);labelObject.position.set(0,.43,0);group.add(labelObject);
  const materials=[core.material,shell.material,rim.material,glow.material];
  group.userData={node,index,base,heat,abstract,core,shell,rim,glow,glowSize,hit,label,labelObject,materials,opacities:materials.map(m=>m.opacity)};
  nodeMeshes.set(node.id,group);brain.add(group);
}
const seen=new Set();
for(const n of NODES) for(const id of n.links) {
  adjacency.get(n.id).add(id);adjacency.get(id).add(n.id);
  const key=[n.id,id].sort().join('|');if(seen.has(key))continue;seen.add(key);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(6),3));
  const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0x7e9fef,transparent:true,opacity:.14}));
  line.frustumCulled=false;brain.add(line);edges.push({a:n.id,b:id,line});
}
const stars=[];
for(let i=0;i<650;i++) { const r=10+Math.random()*23,a=Math.random()*Math.PI*2,y=(Math.random()-.5)*30;stars.push(Math.cos(a)*r,y,Math.sin(a)*r); }
const starGeometry=new THREE.BufferGeometry();
starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0x8399da,size:.026,transparent:true,opacity:.55})));

function isActive(group) { return category==='all'||group.userData.node.category===category; }
function showPanel(id) {
  selected=id;dismissed=null;
  const g=nodeMeshes.get(id), n=g.userData.node;
  panel.classList.remove('hidden');panel.inert=false;
  panel.style.setProperty('--active',CATEGORIES[n.category]);
  $('nodeIndex').textContent=String(g.userData.index+1).padStart(2,'0');
  $('nodeTotal').textContent=NODES.length;
  $('detailCategory').textContent=n.category;
  $('detailTitle').textContent=n.title;
  $('detailDescription').textContent=n.description;
  $('keywords').replaceChildren(...n.keywords.map(k=>{const s=document.createElement('span');s.textContent=k;return s;}));
  const meanings={x:'論理 ↔ 直感',y:'静 ↔ 熱',z:'過去 ↔ 未来',w:'具体 ↔ 抽象'};
  $('axisValues').replaceChildren(...Object.entries(n.axes).map(([k,v])=>{
    const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=k.toUpperCase()+' / '+meanings[k];dd.textContent=v < -.2 ? meanings[k].split(' ↔ ')[0]+'寄り' : v > .2 ? meanings[k].split(' ↔ ')[1]+'寄り' : '中間';
    row.append(dt,dd);return row;
  }));
  $('relatedNodes').replaceChildren(...[...adjacency.get(id)].map(other=>{
    const b=document.createElement('button');b.textContent=nodeMeshes.get(other).userData.node.title;
    b.addEventListener('click',()=>choose(other));return b;
  }));
  document.querySelectorAll('[data-node-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.nodeId===id)));
}
function closePanel() {
  dismissed=selected;selected=null;panel.classList.add('hidden');panel.inert=true;
  document.querySelectorAll('[data-node-id]').forEach(b=>b.setAttribute('aria-pressed','false'));
}
function moveCamera(target, destination, onComplete) {
  // Clear OrbitControls inertia before interpolating camera AND orbit target.
  controls.autoRotate=false;controls.enableDamping=false;controls.update();controls.enableDamping=true;
  controls.enabled=false;traveling=true;
  flight={from:camera.position.clone(),to:destination.clone(),fromTarget:controls.target.clone(),toTarget:target.clone(),elapsed:0,duration:reducedMotion?.05:2.2,onComplete};
}
function focusNode(id) {
  const target=nodeMeshes.get(id).position.clone();
  const direction=camera.position.clone().sub(controls.target).normalize();
  if(direction.lengthSq()===0)direction.set(0,.25,1).normalize();
  moveCamera(target,target.clone().addScaledVector(direction,2.5),()=>{ traveling=false;syncMode(); });
}
function choose(id) {
  if(mode==='tour') exitTour(false);
  if(category!=='all' && !isActive(nodeMeshes.get(id)))setCategory('all');
  paused=false;showPanel(id);focusNode(id);
}
function goHome() {
  if(mode==='tour')exitTour(false);
  closePanel();dismissed=null;
  moveCamera(new THREE.Vector3(),homePosition,()=>{traveling=false;syncMode();});
}
function setCategory(value) {
  category=value;
  $('categories').querySelectorAll('button').forEach(b=>{const active=b.dataset.category===value;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  for(const group of nodeMeshes.values()) {
    const active=isActive(group);group.userData.labelObject.visible=active;
    const button=$('nodeList').querySelector('[data-node-id="'+group.userData.node.id+'"]');button.hidden=!active;
  }
  if(selected&&!isActive(nodeMeshes.get(selected)))closePanel();
}
function syncMode() {
  const touring=mode==='tour';
  $('tourBar').hidden=!touring;
  $('freeMode').setAttribute('aria-pressed',String(!touring));
  $('tourMode').setAttribute('aria-pressed',String(touring));
  $('categories').hidden=touring;$('nodeList').hidden=touring;
  $('rotateToggle').disabled=touring;
  $('rotateToggle').textContent='自動回転 '+(autoRotate?'ON':'OFF');
  $('rotateToggle').setAttribute('aria-pressed',String(autoRotate));
  $('pauseTour').textContent=paused?'RESUME':'PAUSE';
  $('pauseTour').setAttribute('aria-pressed',String(paused));
  $('prevStop').disabled=stop===0;
  $('nextStop').disabled=stop===TOUR_ORDER.length;
  $('tourCount').textContent=String(stop).padStart(2,'0')+' / '+TOUR_ORDER.length;
  $('tourStatus').textContent=paused?'一時停止中 · RESUMEで再開':traveling?'移動中…':stop===TOUR_ORDER.length?'旅の終点 · PREVで戻る / EXIT TOURで自由探索': '到着 · NEXTで次の星へ';
  controls.enabled=!flight&&!touring;
  document.body.classList.toggle('touring',touring);
}
function visit(index) {
  stop=THREE.MathUtils.clamp(index,0,TOUR_ORDER.length);paused=false;
  if(stop===0) {
    closePanel();
    $('tourNarration').textContent='おかぽブレインの中心。4本の軸を道しるべに、10個の思考の星を巡ります。NEXTで出発しましょう。';
    moveCamera(new THREE.Vector3(),homePosition,()=>{traveling=false;syncMode();});
  } else {
    const id=TOUR_ORDER[stop-1];showPanel(id);$('tourNarration').textContent=nodeMeshes.get(id).userData.node.tourText;
    focusNode(id);
  }
  syncMode();
}
function startTour() { mode='tour';setCategory('all');visit(0); }
function exitTour(returnHome=true) {mode='free';paused=false;flight=null;traveling=false;syncMode();if(returnHome)goHome();}
$('freeMode').addEventListener('click',()=>exitTour());
$('tourMode').addEventListener('click',startTour);
$('prevStop').addEventListener('click',()=>visit(stop-1));
$('nextStop').addEventListener('click',()=>visit(stop+1));
$('pauseTour').addEventListener('click',()=>{paused=!paused;syncMode();});
$('exitTour').addEventListener('click',()=>exitTour());
$('closePanel').addEventListener('click',closePanel);
$('homeView').addEventListener('click',goHome);
$('rotateToggle').addEventListener('click',()=>{autoRotate=!autoRotate;syncMode();});
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();goHome();});
const categories=['all',...Object.keys(CATEGORIES).filter(c=>NODES.some(n=>n.category===c))];
for(const c of categories) {
  const b=document.createElement('button');b.className='category';b.dataset.category=c;
  const dot=document.createElement('span');dot.style.setProperty('--c',CATEGORIES[c]||'#eafcff');
  b.append(dot,document.createTextNode(c==='all'?'すべて '+NODES.length:c));
  b.addEventListener('click',()=>setCategory(c));$('categories').append(b);
}
for(const n of NODES) {
  const b=document.createElement('button');b.dataset.nodeId=n.id;b.setAttribute('aria-pressed','false');b.textContent=n.title;
  b.addEventListener('click',()=>choose(n.id));$('nodeList').append(b);
}
setCategory('all');syncMode();

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)down=null;});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||mode!=='free'||flight)return;down=null;
  const r=renderer.domElement.getBoundingClientRect();
  pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([...nodeMeshes.values()].filter(isActive).map(g=>g.userData.hit),false);
  if(hits.length)choose(hits[0].object.userData.id);
});
renderer.domElement.addEventListener('pointercancel',()=>down=null);
container.addEventListener('pointerenter',()=>hovered=true);
container.addEventListener('pointerleave',()=>hovered=false);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loadStatus').hidden=false;$('loadStatus').textContent='3D描画が中断しました。ページを再読み込みしてください。';});
const clock=new THREE.Clock();let elapsed=0;
function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  if(!paused)elapsed+=dt;
  for(const g of nodeMeshes.values()) {
    const d=g.userData;
    const t=reducedMotion?0:elapsed;
    const offset=reducedMotion?[0,0,0]:motionOffset(d.node.motion,t);
    g.position.copy(d.base).add(new THREE.Vector3(...offset));
    const wave=reducedMotion?0:Math.sin(t*(.65+d.heat*.85)*1.7+(d.node.motion?.phase??0));
    const pulse=1+wave*(.02+d.heat*.08);
    d.glow.scale.setScalar(d.glowSize*pulse);
    d.rim.rotation.set(t*.153*(d.node.motion?.direction??1)+d.node.motion.phase,.5,0);
    const active=isActive(g)?1:.09;
    d.materials.forEach((m,i)=>m.opacity=d.opacities[i]*active*(i===3?(1+d.heat*.35+wave*d.heat*.18):1));
    d.core.scale.setScalar(pulse*(selected===d.node.id?1.15:1));
  }
  for(const edge of edges) {
    const a=nodeMeshes.get(edge.a),b=nodeMeshes.get(edge.b);
    const positions=edge.line.geometry.attributes.position;
    positions.setXYZ(0,a.position.x,a.position.y,a.position.z);positions.setXYZ(1,b.position.x,b.position.y,b.position.z);positions.needsUpdate=true;
    edge.line.material.opacity=!isActive(a)||!isActive(b)?.025: selected===edge.a||selected===edge.b?.45:.12;
  }
  if(flight) {
    if(!paused)flight.elapsed+=dt;
    const s=Math.min(1,flight.elapsed/flight.duration), ease=s*s*(3-2*s);
    camera.position.lerpVectors(flight.from,flight.to,ease);
    controls.target.lerpVectors(flight.fromTarget,flight.toTarget,ease);
    camera.lookAt(controls.target);
    if(s===1){const complete=flight.onComplete;flight=null;complete?.();}
  } else {
    controls.autoRotate=mode==='free'&&autoRotate&&!hovered&&!selected;
    controls.update(dt);
    if(mode==='free') {
      const forward=camera.getWorldDirection(new THREE.Vector3());
      const nearest=[...nodeMeshes.values()].filter(isActive).filter(g=>g.position.clone().sub(camera.position).normalize().dot(forward)>.65).sort((a,b)=>camera.position.distanceToSquared(a.position)-camera.position.distanceToSquared(b.position))[0];
      if(nearest && camera.position.distanceTo(nearest.position)<2 && nearest.userData.node.id!==selected && nearest.userData.node.id!==dismissed)showPanel(nearest.userData.node.id);
      if(dismissed && camera.position.distanceTo(nodeMeshes.get(dismissed).position)>3)dismissed=null;
    }
  }
  composer.render();labels.render(scene,camera);declutterLabels();
}
// Labels remain inside the 3D viewport; lower-priority collisions are hidden.
function declutterLabels() {
  const bounds=container.getBoundingClientRect(), occupied=[];
  const elements=[...container.querySelectorAll('.node-label'),...container.querySelectorAll('.axis-label')];
  elements.sort((a,b)=>Number(b.textContent===nodeMeshes.get(selected)?.userData.node.title)-Number(a.textContent===nodeMeshes.get(selected)?.userData.node.title));
  for(const el of elements) {
    el.style.visibility='';
    if(!el.getClientRects().length || el.parentElement.style.display==='none')continue;
    const r=el.getBoundingClientRect();
    const outside=r.left<bounds.left+4||r.right>bounds.right-4||r.top<bounds.top+4||r.bottom>bounds.bottom-4;
    const overlaps=occupied.some(o=>r.left<o.right+5&&r.right>o.left-5&&r.top<o.bottom+5&&r.bottom>o.top-5);
    if(outside||overlaps)el.style.visibility='hidden';else occupied.push(r);
  }
}
function resize() {
  const width=container.clientWidth,height=container.clientHeight;
  camera.aspect=width/height;camera.updateProjectionMatrix();
  renderer.setSize(width,height);composer.setSize(width,height);labels.setSize(width,height);
}
new ResizeObserver(resize).observe(container);resize();
$('loadStatus').hidden=true;animate();
