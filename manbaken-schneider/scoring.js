(function(root){
  'use strict';
  const clamp = n => Math.max(0,Math.min(100,n));
  const performance = r => clamp(100*(r[1]-r[0])/(r[1]-1));
  const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : null;
  function evaluate(h){
    const recent=h.recent.slice(0,3), weights=[.5,.3,.2];
    const distance=recent.filter(r=>r[2]===1200 && r[3]==='芝');
    const parts=[
      {key:'ability',label:'実績',weight:30,value:h.rating==null?null:clamp((h.rating-90)/30*100),reason:h.rating==null?'JRA年度最高値の掲載なし':`JRA年度最高レーティング ${h.rating}。距離区分・斤量の補正なし`},
      {key:'recent',label:'近走',weight:30,value:recent.length?recent.reduce((s,r,i)=>s+performance(r)*weights[i],0)/weights.slice(0,recent.length).reduce((s,x)=>s+x,0):null,reason:`直近${recent.length}走の着順を頭数で補正。新しい順に50：30：20`},
      {key:'distance',label:'距離適性',weight:20,value:mean(distance.map(performance)),reason:distance.length?`直近3走中、芝1,200mの${distance.length}走の平均`:'直近3走に芝1,200mなし。全キャリアで未経験という意味ではありません'},
      {key:'course',label:'コース適性',weight:10,value:mean(h.courseResults.map(performance)),reason:h.courseResults.length?`直近4走中、中山・芝1,200mの${h.courseResults.length}走の平均（${h.courseResults.map(r=>r[0]+'着/'+r[1]+'頭').join('、')}）`:'直近4走に中山・芝1,200mなし。過去の勝ち鞍も範囲外なら未反映'},
      {key:'gate',label:'枠順',weight:5,value:null,reason:'枠順未取得・枠順効果の係数も未検証'},
      {key:'going',label:'馬場',weight:5,value:null,reason:'当日馬場未取得・馬場別成績未集計'}
    ];
    for(const p of parts) p.contribution=(p.value??50)*p.weight/100;
    const coverage=parts.reduce((s,p)=>s+(p.value==null?0:p.weight),0);
    return {...h,parts,coverage,score:parts.reduce((s,p)=>s+p.contribution,0)};
  }
  function rank(horses){
    return horses.filter(h=>!h.withdrawn).map(evaluate).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ja')).map((h,i,all)=>{
      const place=all.findIndex(x=>Math.abs(x.score-h.score)<1e-8)+1;
      return {...h,place,mark:({1:'◎',2:'○',3:'▲',4:'△',5:'△'})[place]||'—'};
    });
  }
  function outsiderIndex(score,popularity,n){
    return Number.isInteger(popularity)&&popularity>=1&&popularity<=n&&n>1 ? score*(popularity-1)/(n-1):null;
  }
  function outsiders(ranked,assumptions={}){
    const hasScenario=Object.values(assumptions).some(v=>Number.isInteger(v));
    const pool=ranked.slice(2).map(h=>({...h,assumedRank:assumptions[h.id]??null,outsiderIndex:outsiderIndex(h.score,assumptions[h.id],ranked.length)}));
    return pool.filter(h=>h.score>=65&&(!hasScenario||(h.assumedRank>=6&&h.outsiderIndex!=null)))
      .sort((a,b)=>(b.outsiderIndex??b.score)-(a.outsiderIndex??a.score)).slice(0,3);
  }
  function tickets(ranked,outs=[]){
    if(ranked.length<3||ranked[0].place===ranked[1].place)return [];
    const [a,b]=ranked;const seen=new Set();const result=[];
    for(const c of outs){
      if(!ranked.some(h=>h.id===c.id)||new Set([a.id,b.id,c.id]).size!==3||seen.has(c.id))continue;
      seen.add(c.id);
      result.push({type:'3連複',horses:[a,b,c]});
      result.push({type:'3連単',horses:[a,b,c]},{type:'3連単',horses:[b,a,c]});
    }
    return result;
  }
  root.RaceScoring={evaluate,rank,tickets,performance,outsiderIndex,outsiders};
  if(typeof module!=='undefined')module.exports=root.RaceScoring;
})(globalThis);
