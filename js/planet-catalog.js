// ===================================================
// おかぽるPLANTS — カテゴリーグリッド／商品一覧の描画
// （ファイル名・変数名は okapo-planet / PLANET_* のまま。表示文言のみPLANTS表記）
// ===================================================
import { PLANET_CATEGORIES, getProductsByCategory, formatPrice } from "./planet-data.js";

// ---------- カテゴリーグリッド（PLANTSトップで使用） ----------
export function renderCategoryGrid(container) {
  const frag = document.createDocumentFragment();

  PLANET_CATEGORIES.forEach((cat, i) => {
    const isOpen = cat.status === "open";

    const card = document.createElement(isOpen ? "a" : "div");
    card.className = `planet-cat-card reveal${isOpen ? "" : " planet-cat-card--soon"}`;
    if (isOpen) card.href = `${cat.slug}/index.html`;

    card.innerHTML = `
      <span class="planet-cat-index" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
      <span class="planet-cat-status">${isOpen ? "NOW OPEN" : "COMING SOON"}</span>
      <span class="planet-cat-icon" aria-hidden="true">${cat.icon}</span>
      <span class="planet-cat-en"></span>
      <span class="planet-cat-ja"></span>
      <span class="planet-cat-tagline"></span>
      ${isOpen ? '<span class="planet-cat-arrow" aria-hidden="true">→</span>' : ""}
    `;

    card.querySelector(".planet-cat-en").textContent = cat.en;
    card.querySelector(".planet-cat-ja").textContent = `｜${cat.ja}`;
    card.querySelector(".planet-cat-tagline").textContent = cat.tagline;

    frag.appendChild(card);
  });

  container.appendChild(frag);
}

// ---------- 商品一覧（各カテゴリーの一覧ページで使用） ----------
export function renderProductGrid(container, categorySlug) {
  const products = getProductsByCategory(categorySlug);

  if (products.length === 0) {
    container.innerHTML = `<p class="planet-empty">現在準備中です。近日公開予定です。</p>`;
    return;
  }

  const frag = document.createDocumentFragment();

  products.forEach((product) => {
    const card = document.createElement("a");
    card.className = "planet-product-card reveal";
    card.href = `product.html?id=${encodeURIComponent(product.id)}`;

    const tagsHtml = product.tags
      .map((t) => `<span class="planet-product-tag"></span>`)
      .join("");

    card.innerHTML = `
      <div class="planet-product-media">
        <div class="planet-product-glow" aria-hidden="true"></div>
        <span class="planet-product-icon" aria-hidden="true">${product.icon}</span>
        <div class="planet-product-tags">${tagsHtml}</div>
      </div>
      <div class="planet-product-body">
        <h3 class="planet-product-name"></h3>
        <p class="planet-product-en"></p>
        <p class="planet-product-desc"></p>
        <p class="planet-product-price"></p>
      </div>
    `;

    card.querySelectorAll(".planet-product-tag").forEach((el, i) => {
      el.textContent = product.tags[i];
    });
    card.querySelector(".planet-product-name").textContent = product.name;
    card.querySelector(".planet-product-en").textContent = product.nameEn;
    card.querySelector(".planet-product-desc").textContent = product.shortDesc;
    card.querySelector(".planet-product-price").textContent = formatPrice(product.price);

    frag.appendChild(card);
  });

  container.appendChild(frag);
}
