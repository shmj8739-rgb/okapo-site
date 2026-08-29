// ===================================================
// おかぽるPLANTS — 注文受付フォーム（モーダル）の制御
// ---------------------------------------------------
// ※ クレジットカード等のオンライン決済は行わない（銀行振込のみ）。
//    このフォームは「注文受付フォーム」であり、送信された内容は
//    Firestore の orders コレクションに書き込み専用で保存される
//    （一般ユーザーは読み取り・更新・削除できない。詳細は
//    firestore.rules を参照）。金額の計算・振込案内は、保存された
//    注文をFirebaseコンソールで確認したうえで、担当者が手動でメール
//    連絡する運用とする。
//
// 呼び出し側は、HTML内に #planet-order-modal を1つ用意したうえで、
//   import { initOrderModal, openOrderModal } from "./planet-order.js";
//   initOrderModal();
//   // 「購入する」ボタン押下時に:
//   openOrderModal(product); // product は planet-data.js の商品オブジェクト
// とする。
// ===================================================
import { formatPrice } from "./planet-data.js";
import { db, collection, addDoc, serverTimestamp } from "./planet-firebase.js";

// ---------------------------------------------------
// スパム対策（おかぽ広場のコメント機能と同じ考え方）
// - ハニーポット：画面に見えない入力欄。埋まっていればボットとみなす
// - localStorage を使ったクライアント側の連続送信抑止
//   （厳密なサーバー側レート制限ではない簡易的な抑止）
// ---------------------------------------------------
const ORDER_RATE_LIMIT_KEY = "okapo_plants_last_order_at";
const ORDER_RATE_LIMIT_MS = 20 * 1000;

function isHoneypotFilled(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function canSendNow() {
  const last = Number(localStorage.getItem(ORDER_RATE_LIMIT_KEY) || 0);
  return Date.now() - last >= ORDER_RATE_LIMIT_MS;
}

function recordSendNow() {
  localStorage.setItem(ORDER_RATE_LIMIT_KEY, String(Date.now()));
}

function remainingWaitSeconds() {
  const last = Number(localStorage.getItem(ORDER_RATE_LIMIT_KEY) || 0);
  const remain = ORDER_RATE_LIMIT_MS - (Date.now() - last);
  return Math.max(0, Math.ceil(remain / 1000));
}

let modalEl = null;
let formEl = null;
let viewForm = null;
let viewConfirm = null;
let viewDone = null;
let messageEl = null;
let honeypotEl = null;
let sendBtn = null;
let currentProduct = null;
let lastFormData = null;

function setView(view) {
  [viewForm, viewConfirm, viewDone].forEach((el) => {
    if (el) el.hidden = el !== view;
  });
}

function openModal() {
  if (!modalEl) return;
  modalEl.classList.add("is-open");
  modalEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove("is-open");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function showMessage(text, type) {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `planet-order-message is-visible is-${type}`;
}

function hideMessage() {
  if (!messageEl) return;
  messageEl.className = "planet-order-message";
}

function buildConfirmRows(data) {
  const rows = [
    ["商品名", currentProduct ? currentProduct.name : "—"],
    ["数量", `${data.qty} 点`],
    ["氏名", data.name],
    ["メールアドレス", data.email],
    ["電話番号", data.tel],
    ["郵便番号", data.zip],
    ["住所", data.address],
    ["備考", data.note || "（記入なし）"],
  ];

  const listEl = viewConfirm.querySelector(".planet-order-confirm-list");
  listEl.innerHTML = "";
  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "planet-order-confirm-row";
    row.innerHTML = `<span></span><strong></strong>`;
    row.querySelector("span").textContent = label;
    row.querySelector("strong").textContent = value;
    listEl.appendChild(row);
  });
}

function readFormData() {
  return {
    qty: formEl.querySelector("#order-qty").value || "1",
    name: formEl.querySelector("#order-name").value.trim(),
    email: formEl.querySelector("#order-email").value.trim(),
    tel: formEl.querySelector("#order-tel").value.trim(),
    zip: formEl.querySelector("#order-zip").value.trim(),
    address: formEl.querySelector("#order-address").value.trim(),
    note: formEl.querySelector("#order-note").value.trim(),
  };
}

// Firestore の orders コレクションへ書き込み専用で保存する。
// 単価は入力値ではなく currentProduct（商品データ）から取得することで、
// フォーム側の改ざんによる金額の不整合を防ぐ。
async function saveOrder(data) {
  const quantity = Math.max(1, Math.floor(Number(data.qty)) || 1);
  const unitPrice = currentProduct.price;
  const totalPrice = unitPrice * quantity;

  await addDoc(collection(db, "orders"), {
    productId: currentProduct.id,
    productName: currentProduct.name,
    quantity,
    unitPrice,
    totalPrice,
    customerName: data.name,
    email: data.email,
    tel: data.tel,
    zip: data.zip,
    address: data.address,
    note: data.note,
    status: "new",
    createdAt: serverTimestamp(),
  });
}

// ---------- 初期化（ページごとに1回呼び出す） ----------
export function initOrderModal() {
  modalEl = document.getElementById("planet-order-modal");
  if (!modalEl) return;

  formEl = document.getElementById("planet-order-form");
  viewForm = modalEl.querySelector(".planet-order-view--form");
  viewConfirm = modalEl.querySelector(".planet-order-view--confirm");
  viewDone = modalEl.querySelector(".planet-order-view--done");
  messageEl = modalEl.querySelector(".planet-order-message");
  honeypotEl = formEl.querySelector("#order-field-website");
  sendBtn = viewConfirm.querySelector("[data-order-send]");

  modalEl.querySelectorAll("[data-order-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.classList.contains("is-open")) closeModal();
  });

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!formEl.reportValidity()) return;
    hideMessage();
    lastFormData = readFormData();
    buildConfirmRows(lastFormData);
    setView(viewConfirm);
  });

  const backBtn = viewConfirm.querySelector("[data-order-back]");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      hideMessage();
      setView(viewForm);
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
      hideMessage();

      // ハニーポットが埋まっている＝ボットと判定し、何もしない
      // （検知したことを悟らせないよう、エラー表示も出さない）
      if (isHoneypotFilled(honeypotEl?.value)) {
        return;
      }

      if (!canSendNow()) {
        showMessage(`連続送信を防ぐため、あと${remainingWaitSeconds()}秒お待ちください。`, "error");
        return;
      }

      if (!lastFormData) return;

      sendBtn.disabled = true;
      sendBtn.textContent = "送信中…";

      try {
        await saveOrder(lastFormData);
        recordSendNow();
        setView(viewDone);
      } catch (err) {
        console.error(err);
        showMessage("送信に失敗しました。通信環境をご確認のうえ、もう一度お試しください。", "error");
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "この内容で注文する";
      }
    });
  }
}

// ---------- 「購入する」ボタンなどから呼び出す ----------
export function openOrderModal(product) {
  if (!modalEl) return;
  currentProduct = product;
  lastFormData = null;
  hideMessage();

  formEl.reset();
  formEl.querySelector("#order-product-name").value = product.name;
  formEl.querySelector("#order-product-price").value = formatPrice(product.price);
  formEl.querySelector("#order-qty").value = "1";

  setView(viewForm);
  openModal();
}
