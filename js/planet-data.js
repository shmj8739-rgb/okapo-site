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
// status の意味:
//   "soon"      … COMING SOON表示のみ。カテゴリーページへのリンクなし。
//   "available" … 「NOW AVAILABLE（販売中）」表示。商品一覧・商品詳細ページを公開。
//                 購入は各商品の purchaseUrl（外部の販売ページ）へ遷移する方式で、
//                 このサイト内では決済処理を行わない。← GOODS で使用中。
//   "open"      … サイト内の注文フォーム＋Stripeテスト決済を使う従来フロー。
//                 （現在このステータスのカテゴリーはありません）
export const PLANET_CATEGORIES = [
  {
    slug: "green",
    en: "GREEN",
    ja: "観葉植物",
    icon: "🌿",
    status: "soon",
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
    status: "available", // ← GOODSのみ販売中。他カテゴリーは "soon" のまま。
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
  {
    // 光触媒加工の人工観葉植物（造花）。生きた植物ではないため care は持たせない。
    // type: "artificial" と shipping は green-007 で導入した新フィールド。
    // 既存 green-001〜green-006 には無く、描画側（planet-detail.js）も
    // フィールドが存在する場合のみ表示するため、既存商品に影響しない。
    id: "green-007",
    category: "green",
    name: "Nature 光触媒人工観葉植物 パキラ",
    nameEn: "Nature Pachira",
    icon: "🪴",
    price: 13800,
    type: "artificial",
    tags: ["人工観葉", "光触媒"],
    shortDesc: "光触媒加工をほどこした、高さ約120cmの人工観葉植物のパキラ。",
    description:
      "光触媒加工をほどこした人工観葉植物（造花）のパキラです。高さ約120cm・4号鉢の大きめサイズで、空間のシンボルとして映えます。土や水を使わないため、日当たりの少ない室内やオフィス、店舗、玄関まわりにも設置できます。光触媒により、光が当たることで消臭・抗菌などの効果が期待できます。生きた植物ではありません。",
    size: "高さ約120cm／4号鉢",
    shipping:
      "送料込み（北海道・沖縄・離島は配送不可）。1〜4営業日以内の発送予定です。",
  },
  // ===================================================
  //  GOODS｜雑貨  ―― ここを編集すると各ページに反映されます
  // ---------------------------------------------------
  //  ★ 現在は「仮」の掲載内容です（画像・価格・購入先URLが未確定）。
  //     本販売の前に、下記コメントの ★ が付いた項目を差し替えてください。
  //
  //  ・商品を追加する      → このコメントの下に { ... } を1件コピーして追記。
  //  ・商品名/説明/価格    → name / description / price を書き換え。
  //  ・商品画像            → image（メイン）と thumbnails（サブ・複数可）に
  //                          画像ファイルのパスを設定。未設定の間は icon の
  //                          絵文字がプレースホルダーとして表示されます。
  //  ・在庫の切り替え      → stockLabel を「在庫あり」「在庫なし」等に変更。
  //  ・購入先の設定        → purchaseUrl に BASE / STORES / 注文フォーム等の
  //                          URLを入れると「購入する」ボタンがそこへ遷移します。
  //                          空文字 "" のままだと、ボタン押下時に
  //                          「販売準備中です」の案内が表示されます（エラーにはなりません）。
  // ===================================================
  {
    id: "steel-phone-stand", // 商品ID 兼 URLスラッグ。詳細ページ: goods/product.html?id=steel-phone-stand
    category: "goods",
    name: "スチール製 スマホスタンド",
    nameEn: "Steel Phone Stand",
    icon: "📱", // ★画像未設定時のプレースホルダー絵文字
    catchCopy: "スマホを置くだけで、デスクがもっと快適に。", // キャッチコピー（詳細ページの商品名の下に表示）
    price: 1280, // ★仮価格（税込・円）。確定価格に差し替えてください
    tags: [], // カード左上に出す短いラベル（例: ["新入荷", "人気"]）。不要なら空配列
    shortDesc: "デスクにすっきり置ける、シンプルなスチール製スタンド。", // 一覧カードの短い説明
    description:
      "デスクの上にすっきり置ける、シンプルなスチール製スマホスタンド。スマートフォンを立てて置けるため、動画視聴や作業中の確認にも便利です。上品でミニマルなデザインが、デスクやお部屋に自然になじみます。",
    stockLabel: "在庫あり", // 在庫表示。売り切れ時は「在庫なし」などに変更
    shipping:
      "発送方法・送料・お届け時期は、購入先の販売ページに記載の内容をご確認ください。", // 送料・発送に関する案内欄
    caution:
      "カラー・仕様・発送時期は仕入先の在庫状況により変更となる場合があります。", // 注意事項
    image: "", // ★メイン画像のパス（例: "../../assets/products/steel-phone-stand-main.jpg"）。空の間は絵文字表示
    thumbnails: [], // ★サブ画像のパス配列（複数可）。例: ["../../assets/products/steel-phone-stand-1.jpg", ...]
    purchaseUrl: "", // ★購入先URL（未設定）。BASE / STORES / 注文フォーム等のURLを入れると購入ボタンがそこへ遷移
  },
  {
    id: "cable-storage-case", // 商品ID 兼 URLスラッグ。詳細ページ: goods/product.html?id=cable-storage-case
    category: "goods",
    name: "ケーブル収納ケース",
    nameEn: "Cable Storage Case",
    icon: "🧳", // ★画像未設定時のプレースホルダー絵文字
    catchCopy: "散らかるケーブルを、すっきり整える。", // キャッチコピー
    price: 1280, // ★仮価格（税込・円）
    tags: [],
    shortDesc: "充電ケーブルや小物をまとめて整理できる収納ケース。",
    description:
      "充電ケーブルや小物をまとめて整理できる収納ケースです。デスクまわりや持ち運び時のごちゃつきを抑え、毎日の小さなストレスを減らします。",
    stockLabel: "在庫あり",
    shipping:
      "発送方法・送料・お届け時期は、購入先の販売ページに記載の内容をご確認ください。",
    caution:
      "カラー・仕様・発送時期は仕入先の在庫状況により変更となる場合があります。",
    image: "",
    thumbnails: [],
    purchaseUrl: "",
  },
  // ---------- INTERIOR ----------
  {
    // image / thumbnails は image・product.image が存在する商品でのみ描画側
    // （planet-catalog.js／planet-detail.js）が画像表示に切り替える設計。
    // フィールドを持たない既存GREEN商品は従来どおり icon（絵文字）表示のまま。
    id: "interior-001",
    category: "interior",
    name: "タッチ充電式LEDデスクライト 目に優しいベッドライト",
    nameEn: "Touch LED Desk Light",
    icon: "",
    image: "../../assets/products/interior-001-9.jpg",
    thumbnails: [
      "../../assets/products/interior-001-0.jpg",
      "../../assets/products/interior-001-1.jpg",
      "../../assets/products/interior-001-2.jpg",
      "../../assets/products/interior-001-3.jpg",
      "../../assets/products/interior-001-4.jpg",
      "../../assets/products/interior-001-5.jpg",
      "../../assets/products/interior-001-6.jpg",
      "../../assets/products/interior-001-7.jpg",
      "../../assets/products/interior-001-8.jpg",
    ],
    price: 5980,
    tags: [],
    shortDesc: "タッチ操作で点灯できる充電式LEDデスクライト。目に優しい光で寝室やリビングにも。",
    description:
      "タッチ操作でオン・オフや明るさ調整ができる、充電式のLEDデスクライトです。目に優しい光で、デスクワークはもちろん、寝室のベッドライトやリビング、バーカウンターなど、さまざまなシーンでご使用いただけます。コード不要の充電式なので、置き場所を選ばずお使いいただけます。",
    shipping:
      "送料990円（全国一律）。沖縄県など一部地域は送料が異なる場合があります。詳しくはご注文前にお問い合わせください。",
    // shippingFee: Stripe Checkoutの請求額に加算する送料（円・数値）。
    // shipping（上記の表示用テキスト）とは別に持たせることで、文言を
    // 変えても課金額に影響しない設計にしている。
    // このフィールドを持たない商品（GREEN・送料込み商品など）は
    // create-checkout-session.mjs 側で送料明細を一切追加しないため、
    // 既存の決済額には影響しない。
    shippingFee: 990,
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

// 表示価格は税込。legal.html「特定商取引法に基づく表記」の
// 販売価格欄（各商品ページに表示された価格（税込））と表記を一致させるため、
// ここで一括して「（税込）」を付与する。金額そのものは変更しない。
export function formatPrice(yen) {
  return `¥${yen.toLocaleString("ja-JP")}（税込）`;
}
