// ===================================================
// おかぽ広場 — 新規投稿フォーム
// ===================================================

import {
  db,
  collection,
  addDoc,
  serverTimestamp,
  sanitizePlainText,
  validatePostInput,
  validateDeleteKey,
  sha256Hex,
  validateImageFile,
  resizeImageToDataUrl,
  isHoneypotFilled,
  canPostNow,
  recordPostNow,
  remainingWaitSeconds,
  LIMITS,
} from "./hiroba-common.js";

const form = document.getElementById("hiroba-new-form");
const nameInput = document.getElementById("field-name");
const titleInput = document.getElementById("field-title");
const bodyInput = document.getElementById("field-body");
const deleteKeyInput = document.getElementById("field-delete-key");
const imageInput = document.getElementById("field-image");
const honeypotInput = document.getElementById("field-website");
const bodyCharCount = document.getElementById("body-char-count");
const imagePreview = document.getElementById("hiroba-image-preview");
const imagePreviewImg = imagePreview?.querySelector("img");
const messageEl = document.getElementById("hiroba-form-message");
const submitBtn = document.getElementById("hiroba-submit-btn");

const RATE_LIMIT_KEY = "hiroba_last_post_at";

let pendingImageDataUrl = null;

bodyInput?.addEventListener("input", () => {
  bodyCharCount.textContent = `${bodyInput.value.length} / ${LIMITS.BODY_MAX}`;
});

imageInput?.addEventListener("change", async () => {
  const file = imageInput.files?.[0];
  pendingImageDataUrl = null;
  imagePreview.style.display = "none";

  if (!file) return;

  const err = validateImageFile(file);
  if (err) {
    showMessage(err, "error");
    imageInput.value = "";
    return;
  }

  try {
    showMessage("画像を処理しています…", "success");
    pendingImageDataUrl = await resizeImageToDataUrl(file);
    imagePreviewImg.src = pendingImageDataUrl;
    imagePreview.style.display = "block";
    hideMessage();
  } catch (e) {
    showMessage(e.message || "画像の処理に失敗しました。", "error");
    imageInput.value = "";
  }
});

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `hiroba-form-message is-visible is-${type}`;
}

function hideMessage() {
  messageEl.className = "hiroba-form-message";
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage();

  // ハニーポット：ボットが埋めていたら黙って処理を打ち切る
  if (isHoneypotFilled(honeypotInput?.value)) {
    return;
  }

  if (!canPostNow(RATE_LIMIT_KEY, LIMITS.POST_RATE_LIMIT_MS)) {
    showMessage(
      `連続投稿を防ぐため、あと${remainingWaitSeconds(RATE_LIMIT_KEY, LIMITS.POST_RATE_LIMIT_MS)}秒お待ちください。`,
      "error"
    );
    return;
  }

  const name = sanitizePlainText(nameInput.value) || "名無しさん";
  const title = sanitizePlainText(titleInput.value);
  const body = sanitizePlainText(bodyInput.value);
  const deleteKey = deleteKeyInput.value;

  const postErrors = validatePostInput({ name, title, body });
  const deleteKeyError = validateDeleteKey(deleteKey);
  const errors = [...postErrors, ...(deleteKeyError ? [deleteKeyError] : [])];

  if (errors.length > 0) {
    showMessage(errors.join(" "), "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "投稿中…";

  try {
    const deleteKeyHash = await sha256Hex(deleteKey);

    const docRef = await addDoc(collection(db, "hiroba_posts"), {
      name,
      title,
      body,
      imageBase64: pendingImageDataUrl || null,
      deleteKeyHash,
      createdAt: serverTimestamp(),
      commentCount: 0,
      viewCount: 0,
      deleted: false,
    });

    recordPostNow(RATE_LIMIT_KEY);
    window.location.href = `post.html?id=${encodeURIComponent(docRef.id)}&posted=1`;
  } catch (e) {
    console.error(e);
    showMessage(
      "投稿に失敗しました。しばらくしてから再度お試しください。（Firebaseの設定が未完了の可能性があります）",
      "error"
    );
    submitBtn.disabled = false;
    submitBtn.textContent = "投稿する";
  }
});
