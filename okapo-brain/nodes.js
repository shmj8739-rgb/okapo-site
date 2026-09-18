// 仮データ。座標は本人の診断や測定結果ではなく、編集可能な表現用の設定です。
// x: 論理→直感 / y: 静→熱 / z: 過去→未来 / w: 具体→抽象（各 -1〜+1）
export const CATEGORIES = {
  '発想': '#7cceff', '感情': '#ad8dff', '記憶': '#767cff', '行動': '#a6c8ff',
  '仕事': '#509fff', '創作': '#bcacff', '人間関係': '#d5caff', '挑戦': '#e4efff'
};
export const NODES = [
  { id:'ai-future', category:'発想', title:'AI・未来', description:'AIと新しい技術について考えている領域。自分のアイデアを、誰かが使えるサービスへ育てたい。', keywords:['AI','未来','制作'], motion:{speed:0.56,amplitudeX:0.11,amplitudeY:0.08,amplitudeZ:0.1,phase:0.00,direction:1,pattern:'orbit'}, axes:{x:-.3,y:.7,z:.9,w:.6}, links:['creative','work'], tourText:'旅の最初はAIと未来へ。論理と熱量を、まだ見ぬ可能性につなげる星です。' },
  { id:'work', category:'仕事', title:'仕事', description:'SEとしての問題解決と、これから始める副業。身につけた技術を、自分で選べる働き方につなげたい。', keywords:['SE','問題解決','副業'], motion:{speed:0.6,amplitudeX:0.09,amplitudeY:0.07,amplitudeZ:0.1,phase:0.83,direction:-1,pattern:'orbit'}, axes:{x:-.85,y:.2,z:.25,w:-.8}, links:['money','ai-future'], tourText:'ここは仕事の領域。具体的な技術と日々の行動が、未来への足場になります。' },
  { id:'relationships', category:'人間関係', title:'人間関係', description:'理解し合える仲間や、笑って過ごせる関係について考える。「この人といると面白い」と思われる存在でいたい。', keywords:['仲間','理解','つながり'], motion:{speed:0.52,amplitudeX:0.05,amplitudeY:0.2,amplitudeZ:0.06,phase:1.66,direction:1,pattern:'vertical'}, axes:{x:.65,y:.4,z:-.15,w:-.25}, links:['ideal','anxiety','memories'], tourText:'人とのつながりの星です。理想や不安、過去の記憶とも細い光で結ばれています。' },
  { id:'money', category:'仕事', title:'お金・価値観', description:'お金を得ることの意味と、自由に選べる生活の条件。成果への願いと、自分が本当に大切にしたいものを見つめる。', keywords:['自由','価値','収入'], motion:{speed:0.58,amplitudeX:0.17,amplitudeY:0.04,amplitudeZ:0.06,phase:2.49,direction:-1,pattern:'horizontal'}, axes:{x:-.65,y:-.2,z:.55,w:.1}, links:['work','philosophy','ideal'], tourText:'ここでは、稼ぐことと大切にしたいことの関係を眺めます。' },
  { id:'philosophy', category:'発想', title:'哲学', description:'幸せとは何か、自分らしさとは何か。すぐに答えを出さず、問いを持ち続ける場所。', keywords:['幸せ','自己理解','問い'], motion:{speed:0.54,amplitudeX:0.13,amplitudeY:0.11,amplitudeZ:0.1,phase:3.32,direction:1,pattern:'diagonal'}, axes:{x:-.25,y:-.75,z:.1,w:.95}, links:['money','ideal','memories'], tourText:'静かな問いの星へ。抽象度が高いため、輪郭よりも広がるオーラが目立ちます。' },
  { id:'creative', category:'創作', title:'創作', description:'思いつきを文章やアプリ、体験に変えていく。まだ世の中にないものを作る喜びを探す。', keywords:['アイデア','note','アプリ'], motion:{speed:0.6,amplitudeX:0.14,amplitudeY:0.1,amplitudeZ:0.1,phase:4.15,direction:-1,pattern:'figure8'}, axes:{x:.8,y:.85,z:.65,w:.55}, links:['ai-future','wishes','philosophy'], tourText:'ここは創作の領域。直感と熱が重なり、アイデアが強く脈動しています。' },
  { id:'memories', category:'記憶', title:'過去の記憶', description:'うれしかった経験も悔しかった経験も、今の考え方につながっている。過去を見返して、自分の変化を知る。', keywords:['経験','日記','振り返り'], motion:{speed:0.5,amplitudeX:0.012,amplitudeY:0.012,amplitudeZ:0.01,phase:4.98,direction:1,pattern:'still'}, axes:{x:.15,y:-.3,z:-.9,w:-.7}, links:['relationships','anxiety'], tourText:'過去側に浮かぶ記憶の星です。具体的な経験が、小さく明確な核として残っています。' },
  { id:'anxiety', category:'感情', title:'不安', description:'自信や人との距離、先の見えない挑戦についての揺れ。感情を言葉にして、自分の状態を理解する。', keywords:['自信','揺れ','感情'], motion:{speed:0.57,amplitudeX:0.12,amplitudeY:0.1,amplitudeZ:0.06,phase:5.81,direction:-1,pattern:'sway'}, axes:{x:.75,y:-.6,z:-.45,w:.4}, links:['memories','ideal','relationships'], tourText:'不安も脳内宇宙の一部です。何とつながっているかを、少し距離を取って眺めます。' },
  { id:'ideal', category:'挑戦', title:'理想', description:'自分の力で選択し、新しい体験を重ね、周囲の人生も面白くできる自分でいたい。', keywords:['自由','成長','自分らしさ'], motion:{speed:0.64,amplitudeX:0.07,amplitudeY:0.22,amplitudeZ:0.05,phase:6.64,direction:1,pattern:'vertical'}, axes:{x:.4,y:.45,z:.8,w:.85}, links:['wishes','relationships','money'], tourText:'未来側の理想の星。まだ形のない願いが、周囲へ光を広げています。' },
  { id:'wishes', category:'行動', title:'やりたいこと', description:'キックボクシング、旅、ものづくり。大きな夢を、次に試せる小さな行動へ落とし込む。', keywords:['挑戦','体験','一歩'], motion:{speed:0.55,amplitudeX:0.14,amplitudeY:0.1,amplitudeZ:0.12,phase:7.47,direction:-1,pattern:'turning'}, axes:{x:.35,y:.9,z:.1,w:-.45}, links:['creative','ideal','work'], tourText:'最後は、やりたいことの星へ。ここから自由探索に戻って、気になるつながりをたどれます。' }
];

// 中心は0番目の停留所。ノード追加時は以下のIDリストにも追加するとツアーに参加します。
export const TOUR_ORDER = ['ai-future','work','relationships','philosophy','creative','money','memories','anxiety','ideal','wishes'];

export function validateData(nodes=NODES, order=TOUR_ORDER) {
  const ids = new Set(nodes.map(n=>n.id));
  if (!nodes.length || ids.size !== nodes.length) throw new Error('ノードIDは空でない一覧内で一意にしてください。');
  for (const n of nodes) {
    if (!n.id || !n.title || !n.description || !n.tourText || !CATEGORIES[n.category]) throw new Error('ノードの必須項目を確認してください。');
    if(n.motion) {
      const m=n.motion;
      if(!['orbit','vertical','horizontal','diagonal','figure8','still','sway','turning'].includes(m.pattern) || !Number.isFinite(m.speed) || m.speed<=0 || !Number.isFinite(m.phase) || ![1,-1].includes(m.direction) || ['amplitudeX','amplitudeY','amplitudeZ'].some(k=>!Number.isFinite(m[k])||m[k]<0||m[k]>.25)) throw new Error(n.id+': motionの設定を確認してください。');
    }
    for (const key of ['x','y','z','w']) if (!Number.isFinite(n.axes?.[key]) || Math.abs(n.axes[key])>1) throw new Error(n.id+': 軸は -1〜+1 にしてください。');
    if (!Array.isArray(n.keywords) || !n.keywords.every(k=>typeof k==='string') || !Array.isArray(n.links) || n.links.some(id=>!ids.has(id)||id===n.id)) throw new Error(n.id+': キーワード・関連IDを確認してください。');
  }
  if (!order.length || new Set(order).size!==order.length || order.some(id=>!ids.has(id))) throw new Error('ツアーIDを確認してください。');
}
