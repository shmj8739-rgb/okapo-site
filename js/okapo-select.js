// ===================================================
// OKAPO SHOP — 物販・デジタル商品のショップトップページの
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
//   ・デジタル商品を足す     → kind: "digital", url, ctaLabel を指定する。
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
// 通常の defer スクリプトとして読み込み、file:// でのローカル確認にも対応。
// ページ外へ変数を公開しない。
(() => {
"use strict";

const BASE_SHOP_URL = "https://okapolab.base.shop/";

// ---------------------------------------------------
// カテゴリー（表示専用のカード。今は遷移先を持ちません）
// ---------------------------------------------------
const SELECT_CATEGORIES = [
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
    en: "DIGITAL GOODS",
    ja: "デジタル商品",
    icon: "◇",
    desc: "NFT・LINEスタンプなど、オリジナルのデジタル商品。",
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
//   kind      … "physical"（物販、省略時の既定値）/ "digital"（デジタル）
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
//   url       … 販売ページのURL。物販のみ、空なら BASE_SHOP_URL を使用
//   ctaLabel  … 販売先に合わせたボタン文言（物販の既定値: BASEで購入する）
//   pickup    … true にすると PICK UP セクションに大きく表示されます
// ---------------------------------------------------
const SELECT_PRODUCTS = [
  {
    id: "steel-phone-stand",
    kind: "physical",
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
  {
    id: "okapo-luxe-fantasy-wallpaper",
    kind: "digital",
    name: "OKAPO LUXE FANTASY WALLPAPER",
    category: "WALLPAPER / FREE",
    price: "FREE",
    image: "../assets/wallpapers/okapo-iphone-luxe-fantasy-thumb.webp?v=123f2f4b5369",
    desc: "青紫の光と立体的な浮遊感をまとった、おかぽのiPhone向け高級幻想壁紙。スマートフォンのロック画面・ホーム画面で無料で使用できます。",
    url: "../assets/wallpapers/okapo-iphone-luxe-fantasy.png?v=123f2f4b5369",
    downloadFilename: "OKAPO_LUXE_FANTASY_WALLPAPER.png",
    ctaLabel: "無料ダウンロード",
  },
  {
    id: "okapomaru-001",
    kind: "digital",
    name: "OKAPOMARU #001",
    category: "DIGITAL ART / ETHEREUM",
    image: "../assets/works/okapomaru-001.png",
    desc: "OKAPOMARUのデジタルコレクション",
    url: "https://opensea.io/ja/collection/okapomaru",
    ctaLabel: "OpenSeaで見る",
  },
  {
    id: "fluffy-muscle-routine",
    kind: "digital",
    name: "Fluffy Muscle Routine",
    category: "LINE STICKERS",
    image: "../assets/works/fluffy-muscle-routine.png",
    desc: "筋肉キャラクターのオリジナルLINEスタンプ",
    url: "https://line.me/S/sticker/35304260",
    ctaLabel: "LINE STOREで見る",
  },
];

// ===================================================
// ここから下は描画ロジック（通常は編集不要）
// ===================================================

function resolvePurchaseUrl(product) {
  if (product?.kind === "digital") return product.url || "";
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
  const label = product.ctaLabel || (product.kind === "digital" ? "販売ページを見る" : "BASEで購入する");
  const cls = large ? "sel-btn sel-btn--primary" : "sel-btn sel-btn--sm";
  const setLabel = (element) => {
    element.textContent = label + " ";
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    element.appendChild(arrow);
  };

  if (url) {
    const a = document.createElement("a");
    a.className = cls;
    a.href = url;
    if (product.downloadFilename) {
      a.download = product.downloadFilename;
    } else {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    setLabel(a);
    return a;
  }

  // URL未設定：押すと準備中の案内を出す（エラーにはしない）
  const wrap = document.createElement("div");
  wrap.className = "sel-buy-pending";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = cls;
  setLabel(btn);
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

// 元PNGはプレビューを開くまで読み込まない。通常の一覧はWebPのみ。
function buildWallpaperHelp(product) {
  const help = document.createElement("div");
  help.className = "sel-wallpaper-help";
  const link = document.createElement("a");
  link.href = product.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "画像を開く ↗";
  const note = document.createElement("p");
  note.textContent = "iPhoneで保存できない場合：画像を開く → 長押し → 写真に保存";
  help.append(link, note);
  return help;
}

function enhanceWallpaperCard(card, media, body, product) {
  card.classList.add("sel-wallpaper-card");
  const previewButton = document.createElement("button");
  previewButton.type = "button";
  previewButton.className = "sel-wallpaper-preview";
  previewButton.setAttribute("aria-label", `${product.name}を拡大表示`);
  previewButton.setAttribute("aria-haspopup", "dialog");
  const thumbnail = media.querySelector("img");
  if (thumbnail) {
    thumbnail.width = 426;
    thumbnail.height = 922;
  }
  previewButton.append(...media.childNodes);
  const previewLabel = document.createElement("span");
  previewLabel.className = "sel-wallpaper-preview-label";
  previewLabel.textContent = "タップして拡大 ↗";
  previewButton.append(previewLabel);
  media.append(previewButton);

  const eyebrow = document.createElement("p");
  eyebrow.className = "sel-wallpaper-eyebrow";
  eyebrow.textContent = "WALLPAPER / FREE DOWNLOAD";
  body.prepend(eyebrow);
  const specs = document.createElement("p");
  specs.className = "sel-wallpaper-specs";
  specs.textContent = "853 × 1844 px · iPhone Wallpaper";
  body.querySelector(".sel-pick-meta").before(specs);
  body.append(buildWallpaperHelp(product));

  previewButton.addEventListener("click", () => {
    const dialog = document.createElement("dialog");
    dialog.className = "sel-wallpaper-dialog";
    dialog.setAttribute("aria-labelledby", `${product.id}-title`);
    dialog.innerHTML = `
      <form method="dialog" class="sel-wallpaper-close-row">
        <button class="sel-wallpaper-close" autofocus aria-label="壁紙プレビューを閉じる">閉じる ×</button>
      </form>
      <div class="sel-wallpaper-dialog-grid">
        <div class="sel-wallpaper-full-media"></div>
        <div class="sel-wallpaper-dialog-body">
          <p class="sel-wallpaper-eyebrow">WALLPAPER / FREE DOWNLOAD</p>
          <h2></h2>
          <p class="sel-wallpaper-dialog-desc"></p>
          <p class="sel-wallpaper-specs">853 × 1844 px · iPhone Wallpaper</p>
          <p class="sel-wallpaper-free">FREE</p>
        </div>
      </div>
    `;
    const heading = dialog.querySelector("h2");
    heading.id = `${product.id}-title`;
    heading.textContent = product.name;
    dialog.querySelector(".sel-wallpaper-dialog-desc").textContent = product.desc;
    const image = document.createElement("img");
    image.width = 853;
    image.height = 1844;
    image.alt = product.name;
    image.decoding = "async";
    image.src = product.url;
    image.addEventListener("error", () => {
      const message = document.createElement("p");
      message.textContent = "プレビューを読み込めませんでした。「画像を開く」からもう一度お試しください。";
      image.replaceWith(message);
    });
    dialog.querySelector(".sel-wallpaper-full-media").append(image);
    dialog.querySelector(".sel-wallpaper-dialog-body").append(
      buildBuyControl(product, { large: true }), buildWallpaperHelp(product)
    );
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("sel-wallpaper-modal-open");
      dialog.remove();
      previewButton.focus({ preventScroll: true });
    }, { once: true });
    document.body.append(dialog);
    dialog.showModal();
    document.documentElement.classList.add("sel-wallpaper-modal-open");
  });
}

// ---------- カテゴリーグリッド ----------
function renderCategoryGrid(container) {
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
function renderPickup(container) {
  if (!container) return;
  const physicalProducts = SELECT_PRODUCTS.filter((p) => p.kind !== "digital");
  const product = physicalProducts.find((p) => p.pickup) || physicalProducts[0];
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
function renderPicksGrid(container, { kind = "physical" } = {}) {
  if (!container) return;

  const products = SELECT_PRODUCTS.filter((p) => (p.kind || "physical") === kind);
  if (products.length === 0) {
    container.innerHTML = `<p class="sel-empty">商品を準備中です。もうしばらくお待ちください。</p>`;
    return;
  }

  const frag = document.createDocumentFragment();

  products.forEach((product) => {
    const card = document.createElement("article");
    // 商品は描画直後から表示。スクロール演出の監視開始時刻に依存させない。
    card.className = "sel-pick-card";
    card.dataset.productId = product.id;

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
    body.querySelector(".sel-pick-meta").hidden = !product.price && !product.shipping;
    body.appendChild(buildBuyControl(product));

    if (product.downloadFilename) enhanceWallpaperCard(card, media, body, product);

    card.append(media, body);
    frag.appendChild(card);
  });

  container.appendChild(frag);
}

// ---------- まとめて初期化 ----------
function initOkapoSelect() {
  renderPicksGrid(document.getElementById("sel-digital-grid"), { kind: "digital" });
  renderCategoryGrid(document.getElementById("sel-cat-grid"));
  renderPickup(document.getElementById("sel-pickup"));
  renderPicksGrid(document.getElementById("sel-picks-grid"));
}

initOkapoSelect();
})();
