// ===================================================
// おかぽ広場 — 投稿詳細（表示・コメント・削除）
// ===================================================

import {
  db,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  increment,
  serverTimestamp,
  formatDateTime,
  sanitizePlainText,
  validateCommentInput,
  sha256Hex,
  isHoneypotFilled,
  canPostNow,
  recordPostNow,
  remainingWaitSeconds,
  hasViewedPost,
  markPostViewed,
  getQueryParam,
  LIMITS,
} from "./hiroba-common.js";

const postId = getQueryParam("id");

const containerEl = document.getElementById("hiroba-post-detail");
const loadingEl = document.getElementById("hiroba-loading-state");
const errorEl = document.getElementById("hiroba-error-state");
const titleEl = document.getElementById("detail-title");
const nameEl = document.getElementById("detail-name");
const dateEl = document.getElementById("detail-date");
const viewsEl = document.getElementById("detail-views");
const imageWrapEl = document.getElementById("detail-image-wrap");
const imageEl = document.getElementById("detail-image");
const bodyEl = document.getElementById("detail-body");
const deleteBtn = document.getElementById("hiroba-delete-btn");

const commentListEl = document.getElementById("hiroba-comment-list");
const commentEmptyEl = document.getElementById("hiroba-comment-empty");
const commentForm = document.getElementById("hiroba-comment-form");
const commentNameInput = document.getElementById("comment-field-name");
const commentBodyInput = document.getElementById("comment-field-body");
const commentHoneypotInput = document.getElementById("comment-field-website");
const commentMessageEl = document.getElementById("hiroba-comment-message");
const commentSubmitBtn = document.getElementById("hiroba-comment-submit");

const deleteModal = document.getElementById("hiroba-delete-modal");
const deleteModalOpenBtn = document.getElementById("hiroba-delete-open-btn");
const deleteModalCancelBtn = document.getElementById("hiroba-delete-cancel-btn");
const deleteModalConfirmBtn = document.getElementById("hiroba-delete-confirm-btn");
const deleteKeyInput = document.getElementById("delete-key-input");
const deleteModalMessageEl = document.getElementById("hiroba-delete-message");

const COMMENT_RATE_LIMIT_KEY = "hiroba_last_comment_at";

let currentPost = null;

function showFormMessage(el, text, type) {
  el.textContent = text;
  el.className = `hiroba-form-message is-visible is-${type}`;
}

function hideFormMessage(el) {
  el.className = "hiroba-form-message";
}

async function loadPost() {
  if (!postId) {
    showError("投稿が見つかりませんでした。");
    return;
  }

  try {
    const snap = await getDoc(doc(db, "hiroba_posts", postId));
    if (!snap.exists() || snap.data().deleted) {
      showError("この投稿は見つかりませんでした。削除された可能性があります。");
      return;
    }

    currentPost = { id: snap.id, ...snap.data() };
    renderPost(currentPost);
    containerEl.style.display = "block";

    if (!hasViewedPost(postId)) {
      markPostViewed(postId);
      // 閲覧数のインクリメントは失敗しても表示に影響させない
      updateDoc(doc(db, "hiroba_posts", postId), { viewCount: increment(1) }).catch(() => {});
    }

    await loadComments();
  } catch (e) {
    console.error(e);
    showError("投稿の読み込みに失敗しました。（Firebaseの設定が未完了の可能性があります）");
  } finally {
    loadingEl.style.display = "none";
  }
}

function showError(msg) {
  errorEl.style.display = "block";
  errorEl.textContent = msg;
  loadingEl.style.display = "none";
}

function renderPost(post) {
  document.title = `${post.title} | おかぽ広場`;

  // XSS対策: すべて textContent で挿入
  titleEl.textContent = post.title;
  nameEl.textContent = post.name || "名無しさん";
  dateEl.textContent = formatDateTime(post.createdAt);
  viewsEl.textContent = post.viewCount ?? 0;
  bodyEl.textContent = post.body;

  if (post.imageBase64) {
    imageEl.src = post.imageBase64;
    imageWrapEl.style.display = "block";
  } else {
    imageWrapEl.style.display = "none";
  }
}

async function loadComments() {
  const q = query(collection(db, "hiroba_posts", postId, "comments"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);

  commentListEl.innerHTML = "";

  if (snap.empty) {
    commentEmptyEl.style.display = "block";
    return;
  }
  commentEmptyEl.style.display = "none";

  const frag = document.createDocumentFragment();
  snap.forEach((d) => {
    const c = d.data();
    const item = document.createElement("div");
    item.className = "hiroba-comment-item";
    item.innerHTML = `
      <div class="hiroba-comment-item-head">
        <strong class="comment-name"></strong>
        <span class="comment-date"></span>
      </div>
      <div class="hiroba-comment-item-body"></div>
    `;
    item.querySelector(".comment-name").textContent = c.name || "名無しさん";
    item.querySelector(".comment-date").textContent = formatDateTime(c.createdAt);
    item.querySelector(".hiroba-comment-item-body").textContent = c.body;
    frag.appendChild(item);
  });
  commentListEl.appendChild(frag);
}

commentForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideFormMessage(commentMessageEl);

  if (isHoneypotFilled(commentHoneypotInput?.value)) {
    return;
  }

  if (!canPostNow(COMMENT_RATE_LIMIT_KEY, LIMITS.COMMENT_RATE_LIMIT_MS)) {
    showFormMessage(
      commentMessageEl,
      `連続投稿を防ぐため、あと${remainingWaitSeconds(COMMENT_RATE_LIMIT_KEY, LIMITS.COMMENT_RATE_LIMIT_MS)}秒お待ちください。`,
      "error"
    );
    return;
  }

  const name = sanitizePlainText(commentNameInput.value) || "名無しさん";
  const body = sanitizePlainText(commentBodyInput.value);
  const errors = validateCommentInput({ name, body });

  if (errors.length > 0) {
    showFormMessage(commentMessageEl, errors.join(" "), "error");
    return;
  }

  commentSubmitBtn.disabled = true;
  commentSubmitBtn.textContent = "送信中…";

  try {
    await addDoc(collection(db, "hiroba_posts", postId, "comments"), {
      name,
      body,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "hiroba_posts", postId), { commentCount: increment(1) });

    commentForm.reset();
    await loadComments();
    showFormMessage(commentMessageEl, "コメントを投稿しました。", "success");
  } catch (e) {
    console.error(e);
    showFormMessage(commentMessageEl, "コメントの投稿に失敗しました。", "error");
  } finally {
    commentSubmitBtn.disabled = false;
    commentSubmitBtn.textContent = "コメントする";
    recordPostNow(COMMENT_RATE_LIMIT_KEY);
  }
});

// ---------------------------------------------------
// 削除機能（削除キー照合 → 論理削除）
// ---------------------------------------------------
deleteModalOpenBtn?.addEventListener("click", () => {
  deleteKeyInput.value = "";
  hideFormMessage(deleteModalMessageEl);
  deleteModal.classList.add("is-open");
});

deleteModalCancelBtn?.addEventListener("click", () => {
  deleteModal.classList.remove("is-open");
});

deleteModal?.addEventListener("click", (e) => {
  if (e.target === deleteModal) {
    deleteModal.classList.remove("is-open");
  }
});

deleteModalConfirmBtn?.addEventListener("click", async () => {
  hideFormMessage(deleteModalMessageEl);
  const key = deleteKeyInput.value;

  if (!key) {
    showFormMessage(deleteModalMessageEl, "削除キーを入力してください。", "error");
    return;
  }

  deleteModalConfirmBtn.disabled = true;
  deleteModalConfirmBtn.textContent = "削除中…";

  try {
    const inputHash = await sha256Hex(key);

    if (inputHash !== currentPost.deleteKeyHash) {
      showFormMessage(deleteModalMessageEl, "削除キーが一致しません。", "error");
      deleteModalConfirmBtn.disabled = false;
      deleteModalConfirmBtn.textContent = "削除する";
      return;
    }

    // Firestore セキュリティルールが deleteKeyHash の一致を再検証する
    await updateDoc(doc(db, "hiroba_posts", postId), {
      deleted: true,
      deleteKeyHash: currentPost.deleteKeyHash,
    });

    window.location.href = "index.html?deleted=1";
  } catch (e) {
    console.error(e);
    showFormMessage(deleteModalMessageEl, "削除に失敗しました。削除キーをご確認ください。", "error");
    deleteModalConfirmBtn.disabled = false;
    deleteModalConfirmBtn.textContent = "削除する";
  }
});

loadPost();
