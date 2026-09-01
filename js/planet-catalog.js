// ===================================================
// おかぽるPLANTS — カテゴリーグリッド／商品一覧の描画
// （ファイル名・変数名は okapo-planet / PLANET_* のまま。表示文言のみPLANTS表記）
// ===================================================
import { PLANET_CATEGORIES, getProductsByCategory, formatPrice } from "./planet-data.js";

// ---------- カテゴリーグリッド（PLANTSトップで使用） ----------
export function renderCategoryGrid(container) {
  const frag = document.createDocumentFragment();

  PLANET_CATEGORIES.forEach((cat, i) => {
    // "available"（GOODS）と "open" はどちらもカテゴリーページへ遷移できる。
    // ラベルだけ status ごとに出し分ける。
    const isLive = cat.status === "available" || cat.status === "open";
    const statusLabel =
      cat.status === "available" ? "NOW AVAILABLE"
      : cat.status === "open" ? "NOW OPEN"
      : "COMING SOON";

    const card = document.createElement(isLive ? "a" : "div");
    card.className = `planet-cat-card reveal${isLive ? "" : " planet-cat-card--soon"}`;
    if (isLive) card.href = `${cat.slug}/index.html`;

    card.innerHTML = `
      <span class="planet-cat-index" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
      <span class="planet-cat-status">${statusLabel}</span>
      <span class="planet-cat-icon" aria-hidden="true">${cat.icon}</span>
      <span class="planet-cat-en"></span>
      <span class="planet-cat-ja"></span>
      <span class="planet-cat-tagline"></span>
      ${isLive ? '<span class="planet-cat-arrow" aria-hidden="true">→</span>' : ""}
    `;

    card.querySelector(".planet-cat-en").textContent = cat.en;
    card.querySelector(".planet-cat-ja").textContent = `｜${cat.ja}`;
    card.querySelector(".planet-cat-tagline").textContent = cat.tagline;

    frag.appendChild(card);
  });

  container.appendChild(frag);
}

// ---------- 商品一覧（各カテゴリーの一覧ページで使用） ----------
// options.onBuy を渡すと、カード内の「購入する」ボタンから
// その商品オブジェクトを引数にコールバックが呼ばれる（注文フォームを開く用途）。
export function renderProductGrid(container, categorySlug, options = {}) {
  const { onBuy } = options;
  const products = getProductsByCategory(categorySlug);

  if (products.length === 0) {
    container.innerHTML = `<p class="planet-empty">現在準備中です。近日公開予定です。</p>`;
    return;
  }

  const frag = document.createDocumentFragment();

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "planet-product-card reveal";

    const tagsHtml = product.tags
      .map((t) => `<span class="planet-product-tag"></span>`)
      .join("");

    // product.image がある商品のみ実写真を表示する。無い商品（既存GREEN等）は
    // 従来どおり絵文字アイコン表示のまま変わらない。alt文言はHTML文字列に
    // 埋め込まず、後段で img.alt に安全に代入する。
    const mediaHtml = product.image
      ? `<img class="planet-product-photo" loading="lazy">`
      : `<div class="planet-product-glow" aria-hidden="true"></div>
         <span class="planet-product-icon" aria-hidden="true">${product.icon}</span>`;

    card.innerHTML = `
      <a class="planet-product-link" href="product.html?id=${encodeURIComponent(product.id)}">
        <div class="planet-product-media">
          ${mediaHtml}
          <div class="planet-product-tags">${tagsHtml}</div>
        </div>
        <div class="planet-product-body">
          <h3 class="planet-product-name"></h3>
          <p class="planet-product-en"></p>
          <p class="planet-product-desc"></p>
          <p class="planet-product-price"></p>
        </div>
      </a>
      <div class="planet-product-actions">
        <button type="button" class="planet-buy-btn">
          購入する
          <span aria-hidden="true">→</span>
        </button>
      </div>
    `;

    card.querySelectorAll(".planet-product-tag").forEach((el, i) => {
      el.textContent = product.tags[i];
    });
    card.querySelector(".planet-product-name").textContent = product.name;
    card.querySelector(".planet-product-en").textContent = product.nameEn;
    card.querySelector(".planet-product-desc").textContent = product.shortDesc;
    card.querySelector(".planet-product-price").textContent = formatPrice(product.price);

    const mediaImg = card.querySelector(".planet-product-photo");
    if (mediaImg) {
      mediaImg.src = product.image;
      mediaImg.alt = product.name;
    }

    const buyBtn = card.querySelector(".planet-buy-btn");

    const categoryStatus = PLANET_CATEGORIES.find(
      (cat) => cat.slug === categorySlug
    )?.status;

    if (categoryStatus === "available") {
      // GOODS等：一覧では購入導線を詳細ページに集約する。
      // ボタンは「商品を見る」＝商品詳細ページへのリンクとして機能させる。
      buyBtn.innerHTML = '商品を見る <span aria-hidden="true">→</span>';
      buyBtn.setAttribute(
        "aria-label",
        `${product.name}の詳細を見る`
      );
      buyBtn.addEventListener("click", () => {
        location.href = `product.html?id=${encodeURIComponent(product.id)}`;
      });
    } else if (categoryStatus === "open") {
      // 従来フロー：サイト内の注文フォームを開く。
      if (onBuy) {
        buyBtn.addEventListener("click", () => onBuy(product));
      } else {
        // onBuy未指定時は購入フォームへの導線がないため、ボタンを無効化
        buyBtn.disabled = true;
      }
    } else {
      // "soon"：購入ボタンそのものを削除
      buyBtn.remove();
    }

    frag.appendChild(card);
  });

  container.appendChild(frag);
}
