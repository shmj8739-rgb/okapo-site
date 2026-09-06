/* ===================================================
   WORLD TRADE ROUTES — サンプルデータ（MVP）
   ---------------------------------------------------
   ここに置いているのは実在の港・地域を参考にしたサンプルデータ。
   実データ・API連携は将来のフェーズで差し替える想定（MVPでは静的JSONのみ）。
   経度・緯度は [lon, lat] の順（d3-geo の慣例に合わせている）。
=================================================== */

window.TRADE_DATA = (function () {

  // ---------- 地域（フィルタ・配色に使用） ----------
  const REGIONS = [
    { id: "japan",       label: "日本",     color: "#6a8dff" },
    { id: "usa",         label: "アメリカ", color: "#a56aff" },
    { id: "china",       label: "中国",     color: "#ff6a8d" },
    { id: "korea",       label: "韓国",     color: "#4fd4c4" },
    { id: "middleeast",  label: "中東",     color: "#ffb84f" },
    { id: "europe",      label: "ヨーロッパ", color: "#7fae86" },
  ];

  // ---------- 主要都市・港（ポイント） ----------
  const PORTS = [
    { id: "yokohama",  name: "横浜港",                    region: "japan",      lon: 139.65, lat: 35.45 },
    { id: "kobe",      name: "神戸港",                    region: "japan",      lon: 135.18, lat: 34.68 },
    { id: "hakata",    name: "博多港",                    region: "japan",      lon: 130.40, lat: 33.60 },
    { id: "chiba",     name: "千葉港",                    region: "japan",      lon: 140.10, lat: 35.60 },
    { id: "losangeles",name: "ロサンゼルス港",            region: "usa",        lon: -118.27, lat: 33.73 },
    { id: "newyork",   name: "ニューヨーク/ニュージャージー港", region: "usa",   lon: -74.05, lat: 40.67 },
    { id: "shanghai",  name: "上海港",                    region: "china",      lon: 121.80, lat: 30.63 },
    { id: "busan",     name: "釜山港",                    region: "korea",      lon: 129.08, lat: 35.10 },
    { id: "rastanura", name: "ラスタヌラ港",              region: "middleeast", lon: 50.15,  lat: 26.64 },
    { id: "rotterdam", name: "ロッテルダム港",            region: "europe",     lon: 4.47,   lat: 51.92 },
  ];

  // ---------- 代表的な貿易ルート（サンプル） ----------
  const ROUTES = [
    {
      id: "jp-us",
      name: "日本 → アメリカ",
      from: "yokohama",
      to: "losangeles",
      fromRegion: "japan",
      toRegion: "usa",
      goods: "自動車・自動車部品、電子機器、産業機械",
      ports: "横浜港 → ロサンゼルス港",
      transport: "海上コンテナ輸送（太平洋航路）",
      why: "日米間の貿易額は世界有数。自動車産業のサプライチェーンを支える基幹ルートで、完成車・部品が双方向で活発に行き来する。",
    },
    {
      id: "jp-cn",
      name: "日本 → 中国",
      from: "kobe",
      to: "shanghai",
      fromRegion: "japan",
      toRegion: "china",
      goods: "半導体製造装置、化学製品、精密部品",
      ports: "神戸港 → 上海港",
      transport: "海上コンテナ輸送（東シナ海航路）",
      why: "中国は日本にとって最大級の貿易相手。日本から高付加価値の部品・素材が渡り、中国で組み立てられた製品が世界へ再輸出されるサプライチェーンの要となっている。",
    },
    {
      id: "jp-kr",
      name: "日本 → 韓国",
      from: "hakata",
      to: "busan",
      fromRegion: "japan",
      toRegion: "korea",
      goods: "半導体材料、化学製品、精密機械部品",
      ports: "博多港 → 釜山港",
      transport: "近海コンテナ船・フェリー（対馬海峡航路）",
      why: "地理的近接性を活かした短距離・高頻度輸送が特徴。韓国の主力産業である半導体を支える中間財の重要な供給ルート。",
    },
    {
      id: "me-jp",
      name: "中東 → 日本",
      from: "rastanura",
      to: "chiba",
      fromRegion: "middleeast",
      toRegion: "japan",
      goods: "原油、液化天然ガス（LNG）",
      ports: "ラスタヌラ港 → 千葉港",
      transport: "大型タンカー輸送（ホルムズ海峡・マラッカ海峡経由）",
      why: "日本はエネルギー資源の大半を輸入に頼り、原油の9割以上を中東に依存する。ホルムズ海峡はエネルギー安全保障上の最重要チョークポイント。",
    },
    {
      id: "cn-eu",
      name: "中国 → ヨーロッパ",
      from: "shanghai",
      to: "rotterdam",
      fromRegion: "china",
      toRegion: "europe",
      goods: "電化製品、家具・日用品、太陽光パネル",
      ports: "上海港 → ロッテルダム港",
      transport: "海上コンテナ輸送（マラッカ海峡・スエズ運河経由）",
      why: "「世界の工場」から欧州市場への最大級の輸送動脈。スエズ運河の混乱時には世界の物流・物価に影響が及ぶほど重要度が高い。",
    },
    {
      id: "eu-us",
      name: "ヨーロッパ → アメリカ",
      from: "rotterdam",
      to: "newyork",
      fromRegion: "europe",
      toRegion: "usa",
      goods: "医薬品、自動車、機械部品、ワイン・食品",
      ports: "ロッテルダム港 → ニューヨーク/ニュージャージー港",
      transport: "海上コンテナ輸送（北大西洋航路）",
      why: "大西洋を挟む先進国同士の成熟した貿易関係。医薬品や高付加価値工業製品が中心で、世界最大級の二国間貿易を支えている。",
    },
  ];

  const portById = Object.fromEntries(PORTS.map((p) => [p.id, p]));
  const regionById = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

  return { REGIONS, PORTS, ROUTES, portById, regionById };
})();
