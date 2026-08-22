// ===================================================
// おかぽるPLANTS — カテゴリー・商品データ
// （ファイル名・変数名は okapo-planet / PLANET_* のまま。表示文言のみPLANTS表記）
// ===================================================
// このファイルはPLANTS配下の全ページ（カテゴリー一覧・商品一覧・商品詳細）が
// 参照する「唯一のデータソース」です。
//
// ・カテゴリーを解禁する   → PLANET_CATEGORIES の該当行の status を
//                             "soon" → "open" に変更するだけ。
// ・商品を追加する         → PLANET_PRODUCTS 配列にオブジェクトを1件追加するだけ。
//                             （並び順 = 配列の並び順。先頭に足すと一覧の先頭に出ます）
//
// 将来的にサーバー/CMS化する場合も、このファイルの形（配列 → JSON）を
// そのまま踏襲すれば差し替えが容易です。

// ---------- カテゴリー一覧 ----------
// status: "open"（購入導線あり・一覧に表示） / "soon"（COMING SOON表示のみ）
export const PLANET_CATEGORIES = [
  {
    slug: "green",
    en: "GREEN",
    ja: "観葉植物",
    icon: "🌿",
    status: "open",
    tagline: "緑のある暮らしを、あなたの部屋に。",
  },
  {
    slug: "flower",
    en: "FLOWER",
    ja: "花",
    icon: "🌸",
    status: "soon",
    tagline: "季節を、お部屋に飾る。",
  },
  {
    slug: "interior",
    en: "INTERIOR",
    ja: "インテリア",
    icon: "🕯️",
    status: "soon",
    tagline: "暮らしの余白を、デザインする。",
  },
  {
    slug: "goods",
    en: "GOODS",
    ja: "雑貨",
    icon: "🧺",
    status: "soon",
    tagline: "毎日をちょっと楽しくする道具。",
  },
  {
    slug: "pet",
    en: "PET",
    ja: "ペット用品",
    icon: "🐾",
    status: "soon",
    tagline: "大切な家族と、心地よい時間を。",
  },
];

// ---------- 商品一覧 ----------
// care は観葉植物カテゴリー向けの補足情報（他カテゴリーでは省略可）。
export const PLANET_PRODUCTS = [
  {
    id: "green-001",
    category: "green",
    name: "モンステラ デリシオーサ",
    nameEn: "Monstera Deliciosa",
    icon: "🌿",
    price: 6800,
    tags: ["新入荷", "人気"],
    shortDesc: "大きく切れ込んだ葉が印象的な、観葉植物の定番種。",
    description:
      "存在感のある大きな葉が空間を一気に引き立てる、観葉植物の代表格。成長とともに葉に切れ込みが入り、育てる楽しみも味わえます。耐陰性があり初心者にも扱いやすい一鉢です。",
    size: "高さ約60〜80cm／4号鉢",
    care: { light: "明るい日陰を好む", water: "土の表面が乾いたらたっぷりと", level: "育てやすい" },
  },
  {
    id: "green-002",
    category: "green",
    name: "パキラ",
    nameEn: "Pachira",
    icon: "🌱",
    price: 4500,
    tags: ["人気"],
    shortDesc: "編み込まれた幹が可愛らしい、風水でも人気の観葉植物。",
    description:
      "「発財樹」とも呼ばれ、丈夫で育てやすいことから贈り物としても人気の高い観葉植物。編み込まれた幹のフォルムがインテリアのアクセントになります。",
    size: "高さ約50〜70cm／4号鉢",
    care: { light: "日当たりの良い場所を好む", water: "土が乾いてからたっぷりと", level: "とても育てやすい" },
  },
  {
    id: "green-003",
    category: "green",
    name: "ガジュマル",
    nameEn: "Ficus microcarpa",
    icon: "🌳",
    price: 5200,
    tags: [],
    shortDesc: "「多幸の木」とも呼ばれる、ぽってりとした幹が特徴の一鉢。",
    description:
      "太く盛り上がった気根がユニークな表情を生む、生命力あふれる観葉植物。「精霊が宿る木」として親しまれ、贈り物にも選ばれています。",
    size: "高さ約35〜45cm／4号鉢",
    care: { light: "明るい室内を好む", water: "土が乾いたらたっぷりと", level: "育てやすい" },
  },
  {
    id: "green-004",
    category: "green",
    name: "サンスベリア",
    nameEn: "Sansevieria",
    icon: "🪴",
    price: 3980,
    tags: ["空気清浄"],
    shortDesc: "すっと伸びる葉が凛とした表情をつくる、乾燥に強い一鉢。",
    description:
      "空気清浄効果が高いことでも知られる、乾燥に強く手間のかからない観葉植物。シャープな葉のフォルムが、モダンな部屋にもよく馴染みます。",
    size: "高さ約40〜50cm／3.5号鉢",
    care: { light: "明るい場所〜半日陰まで対応", water: "土が完全に乾いてから少なめに", level: "とても育てやすい" },
  },
  {
    id: "green-005",
    category: "green",
    name: "ポトス",
    nameEn: "Epipremnum aureum",
    icon: "🍃",
    price: 2980,
    tags: ["新入荷"],
    shortDesc: "つる状に伸びる葉が涼しげな、初心者向けの定番グリーン。",
    description:
      "成長が早く丈夫なため、観葉植物を初めて育てる方にもおすすめの一鉢。ハンギングにして垂らしたり、棚に這わせたりと飾り方の自由度も魅力です。",
    size: "高さ約20〜30cm／3号鉢",
    care: { light: "明るい日陰を好む", water: "土の表面が乾いたらたっぷりと", level: "とても育てやすい" },
  },
  {
    id: "green-006",
    category: "green",
    name: "フィカス ウンベラータ",
    nameEn: "Ficus umbellata",
    icon: "🌲",
    price: 8900,
    tags: ["人気"],
    shortDesc: "ハート型の大きな葉が優雅に揺れる、シンボルツリーの人気種。",
    description:
      "ハート形の柔らかな葉を大きく茂らせる、存在感抜群のシンボルツリー。すらりと伸びる樹形がリビングや玄関先を上質な空間に変えてくれます。",
    size: "高さ約120〜150cm／7号鉢",
    care: { light: "明るい室内を好む", water: "土が乾いたらたっぷりと", level: "やや手間がかかる" },
  },
];

// ---------- ヘルパー ----------
export function getCategoryBySlug(slug) {
  return PLANET_CATEGORIES.find((c) => c.slug === slug);
}

export function getProductsByCategory(slug) {
  return PLANET_PRODUCTS.filter((p) => p.category === slug);
}

export function getProductById(id) {
  return PLANET_PRODUCTS.find((p) => p.id === id);
}

export function formatPrice(yen) {
  return `¥${yen.toLocaleString("ja-JP")}`;
}
