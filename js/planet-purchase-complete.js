// ===================================================
// おかぽるPLANTS — 購入完了ページ（Stripeテスト決済）の描画
// ---------------------------------------------------
// Stripe Checkout の success_url からのリダイレクトを受け取り、
// URLの ?session_id= を Netlify Functions 経由でStripeに照会して、
// 決済が実際に完了している（payment_status === "paid"）ことを
// 確認したうえで購入完了メッセージを表示する。
//
// ※ session_id をそのままURLに載せているだけでは、URLを手入力・共有
//   しただけで「購入完了」と表示できてしまうため、必ずサーバー側
//   （get-checkout-session）でStripeに問い合わせて検証している。
// ===================================================
import { getProductById, formatPrice } from "./planet-data.js";

const params = new URLSearchParams(location.search);
const sessionId = params.get("session_id");

const loadingEl = document.getElementById("purchase-loading");
const successEl = document.getElementById("purchase-success");
const errorEl = document.getElementById("purchase-error");

const productRowEl = document.getElementById("purchase-product-row");
const productNameEl = document.getElementById("purchase-product-name");
const amountRowEl = document.getElementById("purchase-amount-row");
const amountEl = document.getElementById("purchase-amount");

function show(target) {
  [loadingEl, successEl, errorEl].forEach((el) => {
    if (el) el.hidden = el !== target;
  });
}

async function verify() {
  if (!sessionId) {
    show(errorEl);
    return;
  }

  let res;
  let data;
  try {
    res = await fetch(`/.netlify/functions/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`);
    data = await res.json();
  } catch (err) {
    console.error(err);
    show(errorEl);
    return;
  }

  if (!res.ok || data.paymentStatus !== "paid") {
    show(errorEl);
    return;
  }

  const product = data.productId ? getProductById(data.productId) : null;
  if (product && productNameEl) {
    productNameEl.textContent = product.name;
  } else if (productRowEl) {
    productRowEl.hidden = true;
  }

  if (typeof data.amountTotal === "number" && amountEl) {
    // JPYはゼロ小数通貨のため amount_total は「円」の値そのもの。
    amountEl.textContent = formatPrice(data.amountTotal);
  } else if (amountRowEl) {
    amountRowEl.hidden = true;
  }

  show(successEl);
}

verify();
