// ===================================================
// おかぽるPLANET — 商品詳細ページの描画
// ===================================================
// URLの ?id=商品ID を見て、該当商品を planet-data.js から探し出し、
// このテンプレート1枚に流し込む方式。商品が増えてもファイルは増えない。
import { getProductById, getProductsByCategory, formatPrice } from "./planet-data.js";

const params = new URLSearchParams(location.search);
const productId = params.get("id");
const product = productId ? getProductById(productId) : null;

const detailEl = document.getElementById("planet-detail");
const notFoundEl = document.getElementById("planet-not-found");
const relatedEl = document.getElementById("planet-related-list");
const breadcrumbCurrentEl = document.getElementById("planet-breadcrumb-current");
const cartBtn = document.getElementById("planet-cart-btn");
const toastEl = document.getElementById("planet-toast");

if (!product) {
  notFoundEl.style.display = "block";
  relatedEl.closest(".planet-related").style.display = "none";
} else {
  detailEl.style.display = "grid";
  document.title = `${product.name} | おかぽるPLANET`;

  detailEl.querySelector(".planet-detail-icon").textContent = product.icon;
  detailEl.querySelector(".planet-detail-name").textContent = product.name;
  detailEl.querySelector(".planet-detail-en").textContent = product.nameEn;
  detailEl.querySelector(".planet-detail-price").textContent = formatPrice(product.price);
  detailEl.querySelector(".planet-detail-desc").textContent = product.description;
  detailEl.querySelector(".planet-detail-size").textContent = product.size || "—";

  const tagsWrap = detailEl.querySelector(".planet-detail-tags");
  if (product.tags.length === 0) {
    tagsWrap.style.display = "none";
  } else {
    tagsWrap.innerHTML = product.tags.map(() => `<span class="planet-product-tag"></span>`).join("");
    tagsWrap.querySelectorAll(".planet-product-tag").forEach((el, i) => {
      el.textContent = product.tags[i];
    });
  }

  const careWrap = detailEl.querySelector(".planet-detail-care");
  if (product.care) {
    careWrap.querySelector(".care-light").textContent = product.care.light;
    careWrap.querySelector(".care-water").textContent = product.care.water;
    careWrap.querySelector(".care-level").textContent = product.care.level;
  } else {
    careWrap.style.display = "none";
  }

  if (breadcrumbCurrentEl) breadcrumbCurrentEl.textContent = product.name;

  // ---- 関連商品（同カテゴリー・自分自身を除く） ----
  const related = getProductsByCategory(product.category).filter((p) => p.id !== product.id);
  if (related.length === 0) {
    relatedEl.closest(".planet-related").style.display = "none";
  } else {
    related.forEach((p) => {
      const card = document.createElement("a");
      card.className = "planet-product-card reveal is-visible";
      card.href = `product.html?id=${encodeURIComponent(p.id)}`;
      card.innerHTML = `
        <div class="planet-product-media">
          <div class="planet-product-glow" aria-hidden="true"></div>
          <span class="planet-product-icon" aria-hidden="true">${p.icon}</span>
        </div>
        <div class="planet-product-body">
          <h3 class="planet-product-name"></h3>
          <p class="planet-product-en"></p>
          <p class="planet-product-price"></p>
        </div>
      `;
      card.querySelector(".planet-product-name").textContent = p.name;
      card.querySelector(".planet-product-en").textContent = p.nameEn;
      card.querySelector(".planet-product-price").textContent = formatPrice(p.price);
      relatedEl.appendChild(card);
    });
  }

  // ---- 「カートに入れる」導線 ----
  // 決済・EC機能は未実装のため、押下時は準備中トーストのみ表示する。
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      toastEl.textContent = "🌱 オンライン販売は準備中です。もうしばらくお待ちください。";
      toastEl.classList.add("is-visible");
      window.clearTimeout(cartBtn._toastTimer);
      cartBtn._toastTimer = window.setTimeout(() => {
        toastEl.classList.remove("is-visible");
      }, 3200);
    });
  }
}
