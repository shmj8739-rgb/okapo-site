// ===================================================
// おかぽるPLANTS — 商品詳細ページの描画
// （ファイル名・変数名は okapo-planet / PLANET_* のまま。表示文言のみPLANTS表記）
// ===================================================
// URLの ?id=商品ID を見て、該当商品を planet-data.js から探し出し、
// このテンプレート1枚に流し込む方式。商品が増えてもファイルは増えない。
import {
  getProductById,
  getProductsByCategory,
  getCategoryBySlug,
  formatPrice
} from "./planet-data.js";
import { initOrderModal, openOrderModal } from "./planet-order.js";

const params = new URLSearchParams(location.search);
const productId = params.get("id");
const product = productId ? getProductById(productId) : null;

const detailEl = document.getElementById("planet-detail");
const notFoundEl = document.getElementById("planet-not-found");
const relatedEl = document.getElementById("planet-related-list");
const breadcrumbCurrentEl = document.getElementById("planet-breadcrumb-current");
const cartBtn = document.getElementById("planet-cart-btn");
const stripeBtn = document.getElementById("planet-stripe-btn");

initOrderModal();

if (!product) {
  notFoundEl.style.display = "block";
  relatedEl.closest(".planet-related").style.display = "none";
} else {
  detailEl.style.display = "grid";
  document.title = `${product.name} | おかぽるPLANTS`;

  // ---- メイン画像 ----
  // product.image を持つ商品のみ絵文字アイコンを実写真に置き換える。
  // 持たない商品（既存GREEN等）は従来どおり .planet-detail-icon に
  // 絵文字を描画するだけで、挙動は一切変わらない。
  const detailIconEl = detailEl.querySelector(".planet-detail-icon");
  if (product.image) {
    const mainPhoto = document.createElement("img");
    mainPhoto.className = "planet-detail-photo";
    mainPhoto.id = "planet-detail-main-photo";
    mainPhoto.src = product.image;
    mainPhoto.alt = product.name;
    detailIconEl.replaceWith(mainPhoto);
  } else {
    detailIconEl.textContent = product.icon;
  }

  // ---- サムネイル ----
  // product.thumbnails を持ち、かつページ側に #planet-detail-thumbs が
  // 用意されている場合のみ描画する（現状はINTERIORのテンプレートのみに存在）。
  // GREENのテンプレートにはこのコンテナが無いため、既存ページには一切影響しない。
  const thumbsWrap = document.getElementById("planet-detail-thumbs");
  if (thumbsWrap && Array.isArray(product.thumbnails) && product.thumbnails.length > 0) {
    product.thumbnails.forEach((src, i) => {
      const thumbBtn = document.createElement("button");
      thumbBtn.type = "button";
      thumbBtn.className = "planet-detail-thumb";
      thumbBtn.setAttribute("aria-label", `${product.name} の画像 ${i + 1}`);

      const thumbImg = document.createElement("img");
      thumbImg.src = src;
      thumbImg.alt = "";
      thumbBtn.appendChild(thumbImg);

      thumbBtn.addEventListener("click", () => {
        const mainPhoto = document.getElementById("planet-detail-main-photo");
        if (mainPhoto) mainPhoto.src = src;
        thumbsWrap.querySelectorAll(".planet-detail-thumb").forEach((b) => b.classList.remove("is-active"));
        thumbBtn.classList.add("is-active");
      });

      thumbsWrap.appendChild(thumbBtn);
    });
  }

  detailEl.querySelector(".planet-detail-name").textContent = product.name;
  detailEl.querySelector(".planet-detail-en").textContent = product.nameEn;
  detailEl.querySelector(".planet-detail-price").textContent = formatPrice(product.price);
  detailEl.querySelector(".planet-detail-desc").textContent = product.description;
  detailEl.querySelector(".planet-detail-size").textContent = product.size || "—";

  // ---- キャッチコピー ----
  // catchCopy フィールドを持つ商品（GOODS等）のみ、商品名の直後に表示。
  // 持たない既存商品には何も追加されない。
  if (product.catchCopy) {
    const catchEl = document.createElement("p");
    catchEl.className = "planet-detail-catch";
    catchEl.textContent = product.catchCopy;
    detailEl.querySelector(".planet-detail-name").insertAdjacentElement("afterend", catchEl);
  }

  // ---- 在庫表示 ----
  // stockLabel フィールドを持つ商品のみ、スペック欄に「在庫」の行を追加する。
  if (product.stockLabel) {
    const specs = detailEl.querySelector(".planet-detail-specs");
    if (specs) {
      const row = document.createElement("div");
      row.className = "spec-row";
      const label = document.createElement("span");
      label.textContent = "在庫";
      const value = document.createElement("strong");
      value.textContent = product.stockLabel;
      row.append(label, value);
      specs.appendChild(row);
    }
  }

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
    // care を持たない商品（例: 人工観葉植物）は「育て方ガイド」を出さない
    careWrap.style.display = "none";
  }

  // ---- 人工観葉植物（造花）の明示 ----
  // type:"artificial" の商品のみ。生植物と誤認させないための注記を
  // 商品説明の直後に差し込む。フィールドが無い既存商品では何もしない。
  if (product.type === "artificial") {
    const note = document.createElement("p");
    note.className = "planet-detail-artificial";
    note.textContent =
      "※本商品は光触媒加工をほどこした人工観葉植物（造花）です。生きた植物ではなく、水やり等のお手入れは不要です。";
    detailEl.querySelector(".planet-detail-desc").insertAdjacentElement("afterend", note);
  }

  // ---- 商品ごとの配送条件 ----
  // shipping フィールドを持つ商品のみ、スペック欄の直後に配送ボックスを表示。
  // 既存商品は shipping を持たないため表示されず、共通の販売条件表記に従う。
  if (product.shipping) {
    const box = document.createElement("div");
    box.className = "planet-detail-shipping";
    const title = document.createElement("p");
    title.className = "planet-detail-shipping-title";
    title.textContent = "配送について";
    const body = document.createElement("p");
    body.textContent = product.shipping;
    box.append(title, body);
    detailEl.querySelector(".planet-detail-specs").insertAdjacentElement("afterend", box);
  }

  // ---- 注意事項 ----
  // caution フィールドを持つ商品のみ、配送ボックス（無ければスペック欄）の
  // 直後に「ご注意」ボックスを表示する。見た目は配送ボックスと共通。
  if (product.caution) {
    const box = document.createElement("div");
    box.className = "planet-detail-shipping";
    const title = document.createElement("p");
    title.className = "planet-detail-shipping-title";
    title.textContent = "ご注意";
    const body = document.createElement("p");
    body.textContent = product.caution;
    box.append(title, body);
    const anchor =
      detailEl.querySelector(".planet-detail-shipping") ||
      detailEl.querySelector(".planet-detail-specs");
    if (anchor) anchor.insertAdjacentElement("afterend", box);
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

  // ---- 販売状態による購入導線の制御 ----
  //   "available" … GOODS等。外部の購入先URL（purchaseUrl）へ遷移する方式。
  //                  このサイト内では決済しない。Stripeボタンは出さない。
  //   "open"      … サイト内の注文フォーム＋Stripeテスト決済（従来フロー）。
  //   "soon" 他   … 購入導線をすべて非表示（直接URLで開かれた場合の保険）。
  const category = getCategoryBySlug(product.category);
  const status = category ? category.status : "soon";

  const hideNoteAfter = (btn) => {
    const note = btn && btn.nextElementSibling;
    if (note && note.classList.contains("planet-cart-note")) {
      note.style.display = "none";
    }
  };

  if (status === "available") {
    // Stripeボタンは使わない（テンプレートに残っていても隠す）
    if (stripeBtn) {
      stripeBtn.style.display = "none";
      hideNoteAfter(stripeBtn);
    }

    if (cartBtn) {
      const purchaseUrl =
        typeof product.purchaseUrl === "string" ? product.purchaseUrl.trim() : "";
      const cartNote =
        cartBtn.nextElementSibling &&
        cartBtn.nextElementSibling.classList.contains("planet-cart-note")
          ? cartBtn.nextElementSibling
          : null;

      if (purchaseUrl) {
        // 購入先URLが設定済み → そのページ（外部の販売ページ）を別タブで開く
        cartBtn.addEventListener("click", () => {
          window.open(purchaseUrl, "_blank", "noopener");
        });
        if (cartNote) {
          cartNote.textContent =
            "※ 購入手続きは、提携先の販売ページ（別タブ）で行います。";
        }
      } else {
        // 購入先URL未設定 → 押下時に準備中の案内を表示（エラーにはしない）
        if (cartNote) {
          cartNote.textContent = "※ ただいま販売の準備を進めています。";
        }
        cartBtn.addEventListener("click", () => {
          let msg = document.getElementById("planet-prep-msg");
          if (!msg) {
            msg = document.createElement("p");
            msg.id = "planet-prep-msg";
            msg.className = "planet-cart-note planet-prep-msg";
            msg.setAttribute("role", "status");
            msg.innerHTML =
              '販売準備中です。お手数ですが、<a href="mailto:okapoplants@gmail.com">お問い合わせ</a>からご連絡ください。';
            (cartNote || cartBtn).insertAdjacentElement("afterend", msg);
          }
        });
      }
    }
  } else if (status !== "open") {
    // 購入ボタンを非表示
    if (cartBtn) {
      cartBtn.style.display = "none";

      // 「購入する」ボタン直下の注意書きも非表示
      const cartNote = cartBtn.nextElementSibling;
      if (cartNote && cartNote.classList.contains("planet-cart-note")) {
        cartNote.style.display = "none";
      }
    }

    // Stripeテスト決済ボタンを非表示
    if (stripeBtn) {
      stripeBtn.style.display = "none";

      // Stripeボタン直下の注意書きも非表示
      const stripeNote = stripeBtn.nextElementSibling;
      if (stripeNote && stripeNote.classList.contains("planet-cart-note")) {
        stripeNote.style.display = "none";
      }
    }
  } else {
    // ---- 「購入する」導線 ----
    if (cartBtn) {
      cartBtn.addEventListener("click", () => {
        openOrderModal(product);
      });
    }

    // ---- 「クレジットカードで購入する（テスト決済）」導線 ----
    if (stripeBtn) {
      const stripeBtnDefaultHTML = stripeBtn.innerHTML;

      stripeBtn.addEventListener("click", async () => {
        stripeBtn.disabled = true;
        stripeBtn.textContent = "決済ページに移動しています…";

        try {
          const res = await fetch("/.netlify/functions/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id }),
          });

          const data = await res.json();

          if (!res.ok || !data.url) {
            throw new Error(data.error || "決済ページの作成に失敗しました。");
          }

          location.href = data.url;
        } catch (err) {
          console.error(err);
          alert("決済ページへの移動に失敗しました。時間をおいて再度お試しください。");
          stripeBtn.disabled = false;
          stripeBtn.innerHTML = stripeBtnDefaultHTML;
        }
      });
    }
  }
}
