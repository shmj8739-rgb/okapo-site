(function(root){
 'use strict';
 const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
 const valid=r=>Number.isInteger(r.finish)&&Number.isInteger(r.field)&&r.field>1&&r.finish>=1&&r.finish<=r.field;
 const point=r=>100*(r.field-r.finish)/(r.field-1);
 function evaluate(race,horse){
  const runs=(horse.recent||[]).filter(valid).filter(r=>r.date<root.WIN5_DATA.date).slice(0,5);
  if(!runs.length)return {...horse,score:null,reason:'近走データ未取得'};
  const weights=[.5,.3,.2],recent=runs.slice(0,3);
  const form=recent.reduce((sum,r,i)=>sum+point(r)*weights[i],0)/weights.slice(0,recent.length).reduce((a,b)=>a+b,0);
  const distance=runs.filter(r=>r.distance===race.distance&&r.surface===race.surface);
  const course=distance.filter(r=>r.venue===race.venue);
  const score=form*.6+(mean(distance.map(point))??50)*.3+(mean(course.map(point))??50)*.1;
  const reason=`直近${recent.length}走は${recent.map(r=>r.finish+'着').join('・')}。${race.surface}${race.distance}mの成績${distance.length}走を評価。${course.length?'同コース'+course.length+'走あり。':'同コース成績なし（50点補完）。'}`;
  return {...horse,score,reason};
 }
 function candidates(race,sprint=[]){
  if(race.status==='unavailable'||race.status==='unconfirmed')return [];
  const horses=race.useSprint?sprint.map(h=>({...h,reason:`前走${h.lastRace} ${h.recent[0][0]}着。既存の実績・近走・距離適性などの総合評価。データ充足${h.coverage}%。`})):(race.horses||[]).filter(h=>!h.withdrawn).map(h=>evaluate(race,h));
  return horses.filter(h=>!h.withdrawn&&Number.isFinite(h.score)).sort((a,b)=>b.score-a.score);
 }
 function count(races,selections){
  if(races.length!==5||races.some(r=>!r.options?.length))return null;
  const sizes=races.map(r=>new Set((selections[r.id]||[]).filter(id=>r.options.some(h=>h.id===id))).size);
  if(sizes.some(n=>n>3))return null;
  return {sizes,total:sizes.reduce((a,b)=>a*b,1)};
 }
 root.Win5={evaluate,candidates,count};
 if(typeof module!=='undefined')module.exports=root.Win5;
})(globalThis);

function initWin5(sprint){
 const data=globalThis.WIN5_DATA;
 if(!data||!Array.isArray(data.races)){
  document.getElementById('win5-updated').textContent='データ未取得';
  document.getElementById('win5-count').textContent='算出できません（データ未取得）';return;
 }
 const races=data.races.map(r=>({...r,all:Win5.candidates(r,sprint),options:Win5.candidates(r,sprint).slice(0,3)}));
 const selections=Object.fromEntries(races.map(r=>[r.id,r.options.slice(0,2).map(h=>h.id)]));
 const $=id=>document.getElementById(id);
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'short',timeStyle:'short'}).format(new Date(data.checkedAt));
 $('win5-updated').textContent='情報確認：'+date+' JST ／ 自動更新なし。第5レースの成績は9/24 18:08 JST保存分。';
 $('win5-races').innerHTML=races.map((r,i)=>`<article class="win5-race"><div class="win5-heading"><span class="win5-number">0${i+1}</span><div><h3>${escape(r.name||'未確定')}</h3><p class="win5-meta">${escape(r.venue||'未確定')} ${r.number?r.number+'R':''} · 発走 ${escape(r.time||'未確定')}予定</p></div></div><p class="win5-selection">1着候補 ／ <span id="selected-${r.id}"></span></p>${r.options.length?`<div class="win5-options">${r.options.map(h=>`<label class="win5-option"><input type="checkbox" data-win5-race="${r.id}" value="${h.id}" ${selections[r.id].includes(h.id)?'checked':''} aria-label="${escape(r.name+'：'+h.name)}"><span><b>${escape(h.name)}</b><strong>総合点 ${h.score.toFixed(1)}<small> / 100</small></strong><small>${escape(h.reason)}</small></span></label>`).join('')}</div><details><summary>全${r.all.length}頭の評価・同点候補を確認</summary><ul>${r.all.map(h=>`<li>${escape(h.name)}：${h.score.toFixed(1)}点</li>`).join('')}</ul></details>`:`<p class="empty">${r.status==='unconfirmed'?'未確定':'データ未取得'}：1着候補馬・総合点・選定理由は、評価データ確認後に表示します。</p>`}<p class="muted">${r.useSprint?'JRA出馬表の保存情報':'netkeiba出馬表・直近最大5走の保存情報'}に基づく暫定候補。枠順・馬番・最新オッズは未取得。</p>${r.source?`<a href="${escape(r.source)}" target="_blank" rel="noopener noreferrer">出馬表・成績の出典 ↗</a>`:''}</article>`).join('');
 function update(){
  for(const r of races)$('selected-'+r.id).textContent=r.options.length?selections[r.id].length+'頭選択中（1〜3頭）':'データ未取得';
  const result=Win5.count(races,selections);
  $('win5-count').innerHTML=result?`${result.sizes.join(' × ')} ＝ ${result.total}通り<small>${result.total?'選択した5レースの候補頭数を掛け合わせた点数です。':'未選択のレースがあります。各レースで1〜3頭選択してください。'}</small>`:'算出できません<small>データ未取得または未確定のレースがあります。</small>';
 }
 $('win5-races').addEventListener('change',e=>{
  const input=e.target.closest('[data-win5-race]');if(!input)return;
  const id=input.dataset.win5Race;
  selections[id]=[...document.querySelectorAll('[data-win5-race="'+id+'"]:checked')].map(x=>x.value);
  update();
 });
 update();
}
