'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n==null?'未算出':n.toFixed(1);
let ranked=[],selected='',assumptions={};
const horseImg=()=>'<img src="horse-art.png" alt="" width="90" height="90" loading="lazy">';
function showDetail(id){
 selected=id;const h=ranked.find(x=>x.id===id);if(!h)return;
 $('detail').innerHTML=`<h2>${h.mark} ${esc(h.name)}｜評価の根拠</h2><div class="total"><span>総合点 / データ充足 ${h.coverage}%</span><strong>${fmt(h.score)}<small> / 100</small></strong></div><div class="metrics">`+h.parts.map(p=>`<div class="metric"><div class="metric-header"><b>${p.label} ${p.weight}%</b><span>${p.value==null?'補完50':fmt(p.value)} → ${fmt(p.contribution)}点</span></div><div class="track ${p.value==null?'missing':''}"><i style="width:${p.value??50}%"></i></div><p>${esc(p.reason)}</p></div>`).join('')+`</div><div class="facts"><p>前走：${esc(h.lastDate)} ${esc(h.lastRace)} ${h.recent[0][0]}着 ／ 直近3走：${h.recent.map(r=>r[0]+'着/'+r[1]+'頭').join(' → ')}</p><p>脚質の参考：${h.corner==null?'通過順未取得':'前走最終コーナー '+h.corner+'番手'}。騎手：${esc(h.jockey)}（成績による加点なし）。</p><p>枠順・馬番・実際の人気・オッズ・当日馬場：未取得。想定人気は最新人気と異なります。</p></div>`;
 document.querySelectorAll('#horse-list tr').forEach(tr=>tr.classList.toggle('selected',tr.dataset.id===id));
}
function renderList(){
 const list=$('sort').value==='name'?[...ranked].sort((a,b)=>a.name.localeCompare(b.name,'ja')):ranked;
 $('horse-list').innerHTML=list.map(h=>`<tr data-id="${h.id}"><td><button class="plain-button" data-horse="${h.id}" type="button">${h.mark} ${esc(h.name)}</button><span class="sub">${esc(h.sexAge)} / ${esc(h.jockey)}</span></td><td><span class="score">${fmt(h.score)}</span></td><td><input aria-label="${esc(h.name)}の想定人気" data-popularity="${h.id}" type="number" inputmode="numeric" min="1" max="${ranked.length}" step="1" placeholder="—" value="${assumptions[h.id]??''}"></td></tr>`).join('');
 showDetail(selected);
}
function renderHunt(){
 const top=ranked[0],support=ranked[1];
 const outs=RaceScoring.outsiders(ranked,assumptions);const hasScenario=Object.keys(assumptions).length>0;
 $('scenario-state').textContent=hasScenario?'手動の想定人気を使った試算です。実際の人気・オッズには連動していません。':'人気データなし：以下は能力から選んだ調査対象です。人気薄の判定はまだできません。';
 $('outsider-cards').innerHTML=outs.length?outs.map(h=>`<article class="outsider"><div class="outsider-top">${horseImg()}<span class="tag">暫定穴馬 / LONGSHOT</span></div><div class="outsider-body"><h3>${esc(h.name)}</h3><p>想定人気：<strong>${h.assumedRank==null?'未取得（人気薄か未判定）':h.assumedRank+'番人気（手動の仮定）'}</strong></p><div class="stats"><div><span>総合点</span><b>${fmt(h.score)}</b></div></div><p><strong>なぜ暫定穴馬？</strong><br>${h.assumedRank==null?`総合点${fmt(h.score)}で能力の条件を満たすため調査対象に選出。実際に人気薄なら狙いを検討できます。`:`総合点${fmt(h.score)}に対し、想定${h.assumedRank}番人気という仮定とのギャップを評価。`}<br>前走${esc(h.lastRace)} ${h.recent[0][0]}着。データ充足${h.coverage}%。</p><button type="button" class="plain-button" data-horse="${h.id}">評価の内訳を見る ↗</button></div></article>`).join(''):'<p class="empty">条件を満たす暫定穴馬がいません。総合点65点以上・想定6番人気以下の馬が対象です。条件を満たす馬がなければ買い目は出しません。</p>';
 const tickets=RaceScoring.tickets(ranked,outs);
 $('tickets').innerHTML=['3連単','3連複'].map(type=>{
  const i=type==='3連単';
  const rows=tickets.filter(t=>t.type===type);
  return `<article class="bet ${i?'red':''}"><div class="bet-header"><h3>${type}</h3><span>${rows.length}点 · 暫定</span></div><p>${i?'さらに高配当を狙う':'当てやすさを残しながら万馬券を狙う'}</p><p class="muted">${i?'着順通りに3頭を選ぶ。':'3連単より的中条件が広い、順不同の3頭。'}配当は未確認。</p>${rows.length?rows.map(t=>`<div class="combo">${t.horses.map((h,j)=>`${j?`<span>${i?'→':'×'}</span>`:''}<div class="runner"><i aria-hidden="true">♞</i><small>${i?(j+1)+'着 · ':''}${h.id===top.id?'本命':h.id===support.id?'有力馬':'暫定穴馬'}</small><b>${esc(h.name)}</b></div>`).join('')}</div>`).join(''):'<p class="empty">条件を満たす3頭が揃わないか、本命が同点のため生成を保留しています。</p>'}<p class="muted">${hasScenario?'手動の仮定':'人気不明の調査対象'}を含む試案。馬番・取消・組合せオッズを購入前に確認してください。</p></article>`;
 }).join('');
}
async function init(){
 try{
 const data=await RaceProvider.load();ranked=RaceScoring.rank(data.horses);if(!ranked.length)throw Error('出走馬なし');selected=ranked[0].id;
 $('updated').textContent='情報確認：'+new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'short',timeStyle:'short'}).format(new Date(data.checkedAt))+' JST ／ 自動更新なし';
 if(Date.now()-Date.parse(data.checkedAt)>86400000){$('stale').hidden=false;$('stale').textContent='保存データの確認から24時間以上経過。出馬表・取消・馬場・オッズを再確認してください。';}
 $('sources').innerHTML=data.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('');
 renderHunt();renderList();initWin5(ranked);
 $('sort').addEventListener('change',renderList);
 document.addEventListener('click',e=>{const b=e.target.closest('[data-horse]');if(b){showDetail(b.dataset.horse);$('detail-panel').scrollIntoView({block:'start'});}});
 $('apply').addEventListener('click',()=>{
 const next={},used=new Set();
 for(const input of document.querySelectorAll('[data-popularity]')){
 const raw=input.value.trim(),value=raw===''?null:Number(raw);
 if(input.validity.badInput||(value!==null&&(!Number.isInteger(value)||value<1||value>ranked.length))){$('input-error').textContent='人気は1〜'+ranked.length+'の整数で入力してください。';input.focus();return;}
 if(value!==null&&used.has(value)){$('input-error').textContent='同じ人気順位が入力されています。別の順位にしてください。';input.focus();return;}
 if(value!==null){used.add(value);next[input.dataset.popularity]=value;}
 }
 assumptions=next;$('input-error').textContent='';renderHunt();renderList();$('outsiders').scrollIntoView({block:'start'});
 });
 $('reset').addEventListener('click',()=>{assumptions={};$('input-error').textContent='';renderHunt();renderList();});
 }catch(error){$('updated').textContent='読み込みに失敗しました。ファイル一式を同じフォルダーに置いて開き直してください。';console.error(error);}
}
init();
