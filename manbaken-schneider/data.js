/* JRA public facts, checked 2026-09-24 JST. No network request at startup. */
globalThis.RACE_DATA = {
  schemaVersion: 1,
  checkedAt: '2026-09-24T18:08:00+09:00',
  race: { name: 'スプリンターズステークス', date: '2026-09-27', time: '15:40', course: '中山 芝1,200m・右外', going: null },
  sources: [
    {label:'JRA 出馬表・近走・騎手',url:'https://www.jra.go.jp/JRADB/accessD.html?CNAME=pw01dde0106202604091120260927/5A'},
    {label:'JRA プレレーティング（9/21）',url:'https://jra.jp/datafile/ranking/g1/2026/sprint.html'},
    {label:'JRA レース概要',url:'https://www.jra.go.jp/keiba/g1/sprint.html'}
  ],
  excluded: ['クラスペディア','タマモイカロス','フロムダスク','ヨシノイースター','リリージョワ'],
  // Recent rows: [finish, fieldSize, distance, surface]. Newest first, latest 3 only.
  // courseResults: Nakayama turf 1200m rows within latest 4, [finish, fieldSize].
  horses: [
    {id:'aisansan',name:'アイサンサン',sexAge:'牝4',jockey:'幸英明',rating:106,recent:[[13,18,1600,'芝'],[1,18,1400,'芝'],[1,8,1400,'芝']],lastDate:'2026-05-17',lastRace:'ヴィクトリアマイル',courseResults:[],corner:15},
    {id:'win',name:'ウインカーネリアン',sexAge:'牡9',jockey:'三浦皇成',rating:113,recent:[[3,16,1200,'芝'],[3,18,1200,'芝'],[11,13,1200,'芝']],lastDate:'2026-08-23',lastRace:'キーンランドC',courseResults:[[1,16]],corner:1},
    {id:'at',name:'エーティーマクフィ',sexAge:'牡7',jockey:'富田暁',rating:109,recent:[[4,16,1200,'芝'],[2,12,1200,'芝'],[8,18,1200,'芝']],lastDate:'2026-08-23',lastRace:'キーンランドC',courseResults:[],corner:6},
    {id:'sound',name:'サウンドモリアーナ',sexAge:'牝4',jockey:'吉田隼人',rating:110,recent:[[1,16,1200,'芝'],[6,13,1200,'芝'],[1,16,1200,'芝']],lastDate:'2026-08-23',lastRace:'キーンランドC',courseResults:[[1,15]],corner:2},
    {id:'june',name:'ジューンブレア',sexAge:'牝5',jockey:'坂井瑠星',rating:null,recent:[[17,18,1200,'芝'],[11,16,1400,'芝'],[2,16,1200,'芝']],lastDate:'2026-03-29',lastRace:'高松宮記念',courseResults:[[2,16]],corner:2},
    {id:'star',name:'スターアニス',sexAge:'牝3',jockey:'C.ルメール',rating:116,recent:[[12,18,2400,'芝'],[1,18,1600,'芝'],[1,18,1600,'芝']],lastDate:'2026-05-24',lastRace:'優駿牝馬',courseResults:[],corner:10},
    {id:'panja',name:'パンジャタワー',sexAge:'牡4',jockey:'松山弘平',rating:116,recent:[[2,16,1200,'芝'],[5,17,1600,'芝'],[4,18,1200,'芝']],lastDate:'2026-08-23',lastRace:'キーンランドC',courseResults:[],corner:6},
    {id:'puro',name:'ピューロマジック',sexAge:'牝5',jockey:'岩田望来',rating:109,recent:[[2,16,1200,'芝'],[1,17,1000,'芝'],[1,12,1200,'芝']],lastDate:'2026-09-06',lastRace:'セントウルS',courseResults:[],corner:1},
    {id:'black',name:'ブラックチャリス',sexAge:'牝3',jockey:'浜中俊',rating:105,recent:[[6,16,1200,'芝'],[1,14,1200,'芝'],[15,18,1600,'芝']],lastDate:'2026-08-09',lastRace:'UHB賞',courseResults:[],corner:1},
    {id:'flicker',name:'フリッカージャブ',sexAge:'牡4',jockey:'西村淳也',rating:114,recent:[[1,16,1200,'芝'],[1,13,1200,'芝'],[1,16,1200,'芝']],lastDate:'2026-09-06',lastRace:'セントウルS',courseResults:[[6,16]],corner:2},
    {id:'pair',name:'ペアポルックス',sexAge:'牡5',jockey:'岩田康誠',rating:112,recent:[[10,18,1200,'芝'],[1,16,1200,'芝'],[12,18,1200,'芝']],lastDate:'2026-03-29',lastRace:'高松宮記念',courseResults:[[1,16],[13,16]],corner:13},
    {id:'mama',name:'ママコチャ',sexAge:'牝7',jockey:'武豊',rating:108,recent:[[3,16,1200,'芝'],[5,12,1400,'ダ'],[5,14,1200,'ダ']],lastDate:'2026-09-06',lastRace:'セントウルS',courseResults:[],corner:6},
    {id:'lugal',name:'ルガル',sexAge:'牡6',jockey:'鮫島克駿',rating:114,recent:[[8,18,1200,'芝'],[2,11,1200,'芝'],[3,16,1200,'芝']],lastDate:'2026-06-20',lastRace:'QE2世JS',courseResults:[[3,16]],corner:null},
    {id:'rapier',name:'レイピア',sexAge:'牡4',jockey:'横山武史',rating:111,recent:[[2,18,1200,'芝'],[3,12,1200,'芝'],[5,18,1200,'芝']],lastDate:'2026-08-09',lastRace:'CBC賞',courseResults:[[2,16]],corner:8},
    {id:'red',name:'レッドモンレーヴ',sexAge:'牡7',jockey:'酒井学',rating:114,recent:[[16,16,1200,'芝'],[2,18,1200,'芝'],[8,16,1600,'芝']],lastDate:'2026-09-06',lastRace:'セントウルS',courseResults:[],corner:16},
    {id:'world',name:'ワールズエンド',sexAge:'牡5',jockey:'津村明秀',rating:117,recent:[[2,17,1600,'芝'],[1,18,1400,'芝'],[2,13,1600,'芝']],lastDate:'2026-06-07',lastRace:'安田記念',courseResults:[],corner:1}
  ].map(h=>({...h,number:null,gate:null,odds:null,popularity:null,withdrawn:false}))
};
