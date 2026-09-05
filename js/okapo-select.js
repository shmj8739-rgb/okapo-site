// ===================================================
// OKAPO SELECT — セレクトショップ トップページの
//                データ定義 ＋ 描画スクリプト
// ===================================================
// このファイル1つで「おかぽるLAB本体サイトのトーンを保った
// ライフスタイル・セレクトショップ」トップ（okapo-planet/index.html）の
// カテゴリー／PICK UP／OKAPO PICKS を生成します。
//
// ▼ よくある編集
//   ・BASEのURLを設定する   → 下の BASE_SHOP_URL を書き換える。
//   ・商品を1つ足す         → SELECT_PRODUCTS 配列に { ... } を1件追加する。
//                             （10件でも100件でもグリッドは自動で折り返します）
//   ・PICK UP に出す商品     → 出したい商品の pickup を true にする
//                             （true が複数あるときは配列で先に来たものを表示）。
//   ・カテゴリーの文言       → SELECT_CATEGORIES を編集する。
//
// このファイルは okapo-planet/ 配下の他ページ（green / goods / interior）の
// データソース（js/planet-data.js）とは完全に独立しています。
// ここを編集しても既存カテゴリーページには影響しません。
// ===================================================

// ---------------------------------------------------
// BASEショップのURL（★ここを後から設定するだけ）
// ・店舗トップのURLを入れておくと、商品側の url が未設定でも
//   「BASEで購入する」ボタンはこのURLへ遷移します。
// ・空文字 "" のままなら、ボタンは「販売ページ準備中」の
//   案内を表示します（リンク切れにはなりません）。
// ---------------------------------------------------
export const BASE_SHOP_URL = "https://okapolab.base.shop/";

// ---------------------------------------------------
// カテゴリー（表示専用のカード。今は遷移先を持ちません）
// ---------------------------------------------------
export const SELECT_CATEGORIES = [
  {
    en: "DESK & WORK",
    ja: "デスク & ワーク",
    icon: "🖥️",
    desc: "デスクをもっと快適に。",
  },
  {
    en: "GADGET",
    ja: "ガジェット",
    icon: "🔌",
    desc: "スマホ・PCまわりの便利なアイテム。",
  },
  {
    en: "INTERIOR",
    ja: "インテリア",
    icon: "🕯️",
    desc: "部屋をちょっとおしゃれに。",
  },
  {
    en: "LIFESTYLE",
    ja: "ライフスタイル",
    icon: "🧺",
    desc: "毎日の生活を便利にするもの。",
  },
  {
    en: "PLANTS",
    ja: "植物",
    icon: "🌿",
    desc: "植物と、植物のある暮らし。",
  },
  {
    en: "OKAPO PICKS",
    ja: "おかぽるピックス",
    icon: "✦",
    desc: "おかぽるLABが面白いと思ったアイテム。",
  },
];

// ---------------------------------------------------
// 商品データ
// ---------------------------------------------------
// フィールドの意味:
//   id        … 一意のID（内部管理用）
//   name      … 商品名
//   price     … 表示価格（文字列。"¥1,480" のようにそのまま表示）
//   shipping  … 送料（文字列。"¥1,000" などをそのまま表示。無ければ省略可）
//   category  … SELECT_CATEGORIES の en と合わせるとチップ表示が揃います
//   image     … 商品画像のパス（okapo-planet/index.html から見た相対パス）
//               ファイルが無い・読み込めない場合は emoji のプレースホルダーに
//               自動フォールバックします（ページは崩れません）。
//   emoji     … image が無い/読めないときに出す絵文字
//   badge     … カード左上の小ラベル（"NEW" など）。不要なら省略
//   desc      … カードの短い説明
//   url       … BASEの「その商品ページ」のURL。空なら BASE_SHOP_URL を使用
//   pickup    … true にすると PICK UP セクションに大きく表示されます
// ---------------------------------------------------
export const SELECT_PRODUCTS = [
  {
    id: "steel-phone-stand",
    name: "スチール スマホスタンド スマホグリップ シンプル 上品",
    price: "¥1,480",
    shipping: "¥1,000",
    category: "GADGET",
    image: "../assets/products/steel-phone-stand/steel-phone-stand.jpg",
    emoji: "📱",
    badge: "NEW",
    desc: "デスクにすっと置ける、上品でミニマルなスチール製スマホスタンド。動画視聴や作業中の確認に。",
    url: "https://okapolab.base.shop/items/156424169", // BASEの商品ページ
    pickup: true,
  },
];

// ===================================================
// ここから下は描画ロジック（通常は編集不要）
// ===================================================

function resolvePurchaseUrl(product) {
  return (product && product.url) || BASE_SHOP_URL || "";
}

function buildMedia(product, baseClass, { eager = false } = {}) {
  if (product.image) {
    const img = document.createElement("img");
    img.className = `${baseClass}-img`;
    // PICK UP のメイン画像は eager（即読み込み）、
    // OKAPO PICKS グリッドは lazy（商品数が増えても軽い）。
    img.loading = eager ? "eager" : "lazy";
    img.decoding = "async";
    img.alt = product.name;
    img.src = product.image;
    img.addEventListener("error", () => {
      img.replaceWith(buildPlaceholder(product, baseClass));
    });
    return img;
  }
  return buildPlaceholder(product, baseClass);
}

function buildPlaceholder(product, baseClass) {
  const ph = document.createElement("div");
  ph.className = `${baseClass}-placeholder`;
  ph.setAttribute("aria-hidden", "true");
  ph.textContent = product.emoji || "🛍️";
  return ph;
}

function buildBuyControl(product, { large = false } = {}) {
  const url = resolvePurchaseUrl(product);
  const cls = large ? "sel-btn sel-btn--primary" : "sel-btn sel-btn--sm";

  if (url) {
    const a = document.createElement("a");
    a.className = cls;
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = `BASEで購入する <span aria-hidden="true">→</span>`;
    return a;
  }

  // URL未設定：押すと準備中の案内を出す（エラーにはしない）
  const wrap = document.createElement("div");
  wrap.className = "sel-buy-pending";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = cls;
  btn.innerHTML = `BASEで購入する <span aria-hidden="true">→</span>`;
  const note = document.createElement("p");
  note.className = "sel-buy-note";
  note.hidden = true;
  note.textContent = "販売ページは現在準備中です。公開までもうしばらくお待ちください。";
  btn.addEventListener("click", () => {
    note.hidden = false;
  });
  wrap.append(btn, note);
  return wrap;
}

// ---------- カテゴリーグリッド ----------
export function renderCategoryGrid(container) {
  if (!container) return;
  const frag = document.createDocumentFragment();

  SELECT_CATEGORIES.forEach((cat, i) => {
    const card = document.createElement("article");
    card.className = "sel-cat-card reveal";
    card.innerHTML = `
      <span class="sel-cat-index" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
      <span class="sel-cat-icon" aria-hidden="true"></span>
      <h3 class="sel-cat-en"></h3>
      <p class="sel-cat-ja"></p>
      <p class="sel-cat-desc"></p>
    `;
    card.querySelector(".sel-cat-icon").textContent = cat.icon;
    card.querySelector(".sel-cat-en").textContent = cat.en;
    card.querySelector(".sel-cat-ja").textContent = cat.ja;
    card.querySelector(".sel-cat-desc").textContent = cat.desc;
    frag.appendChild(card);
  });

  container.appendChild(frag);
}

// ---------- PICK UP（1商品を大きく） ----------
export function renderPickup(container) {
  if (!container) return;
  const product =
    SELECT_PRODUCTS.find((p) => p.pickup) || SELECT_PRODUCTS[0];
  if (!product) {
    container.innerHTML = `<p class="sel-empty">現在ご紹介できる商品はありません。</p>`;
    return;
  }

  const card = document.createElement("div");
  card.className = "sel-pickup-card reveal";

  const media = document.createElement("div");
  media.className = "sel-pickup-media";
  media.appendChild(buildMedia(product, "sel-pickup", { eager: true }));

  const body = document.createElement("div");
  body.className = "sel-pickup-body";
  body.innerHTML = `
    <p class="sel-chip"></p>
    <h3 class="sel-pickup-name"></h3>
    <p class="sel-pickup-desc"></p>
    <div class="sel-pickup-meta">
      <div class="sel-pickup-price"></div>
      <div class="sel-pickup-shipping"></div>
    </div>
  `;
  body.querySelector(".sel-chip").textContent = product.category || "OKAPO PICKS";
  body.querySelector(".sel-pickup-name").textContent = product.name;
  body.querySelector(".sel-pickup-desc").textContent = product.desc || "";
  body.querySelector(".sel-pickup-price").textContent = product.price || "";
  body.querySelector(".sel-pickup-shipping").textContent = product.shipping
    ? `送料 ${product.shipping}`
    : "";
  body.appendChild(buildBuyControl(product, { large: true }));

  card.append(media, body);
  container.appendChild(card);
}

// ---------- OKAPO PICKS（商品グリッド） ----------
export function renderPicksGrid(container) {
  if (!container) return;

  if (SELECT_PRODUCTS.length === 0) {
    container.innerHTML = `<p class="sel-empty">商品を準備中です。もうしばらくお待ちください。</p>`;
    return;
  }

  const frag = document.createDocumentFragment();

  SELECT_PRODUCTS.forEach((product) => {
    const card = document.createElement("article");
    card.className = "sel-pick-card reveal";

    const media = document.createElement("div");
    media.className = "sel-pick-media";
    media.appendChild(buildMedia(product, "sel-pick"));
    if (product.badge) {
      const badge = document.createElement("span");
      badge.className = "sel-pick-badge";
      badge.textContent = product.badge;
      media.appendChild(badge);
    }

    const body = document.createElement("div");
    body.className = "sel-pick-body";
    body.innerHTML = `
      <p class="sel-chip sel-chip--sm"></p>
      <h3 class="sel-pick-name"></h3>
      <p class="sel-pick-desc"></p>
      <div class="sel-pick-meta">
        <span class="sel-pick-price"></span>
        <span class="sel-pick-shipping"></span>
      </div>
    `;
    body.querySelector(".sel-chip").textContent = product.category || "OKAPO PICKS";
    body.querySelector(".sel-pick-name").textContent = product.name;
    body.querySelector(".sel-pick-desc").textContent = product.desc || "";
    body.querySelector(".sel-pick-price").textContent = product.price || "";
    body.querySelector(".sel-pick-shipping").textContent = product.shipping
      ? `送料 ${product.shipping}`
      : "";
    body.appendChild(buildBuyControl(product));

    card.append(media, body);
    frag.appendChild(card);
  });

  container.appendChild(frag);
}

// ---------- まとめて初期化 ----------
export function initOkapoSelect() {
  renderCategoryGrid(document.getElementById("sel-cat-grid"));
  renderPickup(document.getElementById("sel-pickup"));
  renderPicksGrid(document.getElementById("sel-picks-grid"));
}
