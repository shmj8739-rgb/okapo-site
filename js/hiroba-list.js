// ===================================================
// おかぽ広場 — 投稿一覧・検索
// ===================================================

import {
  db,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  formatDateTime,
  LIMITS,
} from "./hiroba-common.js";

const listEl = document.getElementById("hiroba-post-list");
const emptyEl = document.getElementById("hiroba-empty-state");
const loadingEl = document.getElementById("hiroba-loading-state");
const errorEl = document.getElementById("hiroba-error-state");
const searchForm = document.getElementById("hiroba-search-form");
const searchInput = document.getElementById("hiroba-search-input");

let allPosts = [];

function excerpt(body, len = 80) {
  const clean = body.replace(/\s+/g, " ").trim();
  return clean.length > len ? clean.slice(0, len) + "…" : clean;
}

function renderPosts(posts, isSearchResult = false) {
  listEl.innerHTML = "";

  if (posts.length === 0) {
    emptyEl.textContent = isSearchResult
      ? "該当する投稿が見つかりませんでした。"
      : "まだ投稿がありません。最初の投稿をしてみませんか？";
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";

  const frag = document.createDocumentFragment();

  posts.forEach((post) => {
    const card = document.createElement("a");
    card.className = "hiroba-post-card reveal is-visible";
    card.href = `post.html?id=${encodeURIComponent(post.id)}`;

    const thumbHtml = post.imageBase64
      ? `<div class="hiroba-post-thumb"><img src="${post.imageBase64}" alt="" loading="lazy"></div>`
      : "";

    card.innerHTML = `
      ${thumbHtml}
      <div class="hiroba-post-body">
        <h3 class="hiroba-post-title"></h3>
        <p class="hiroba-post-excerpt"></p>
        <div class="hiroba-post-meta">
          <span><span class="meta-icon">👤</span><strong class="meta-name"></strong></span>
          <span><span class="meta-icon">🕒</span><span class="meta-date"></span></span>
          <span><span class="meta-icon">💬</span><span class="meta-comments"></span> コメント</span>
          <span><span class="meta-icon">👁</span><span class="meta-views"></span> 閲覧</span>
        </div>
      </div>
    `;

    // XSS対策: すべて textContent で挿入（HTML として解釈させない）
    card.querySelector(".hiroba-post-title").textContent = post.title;
    card.querySelector(".hiroba-post-excerpt").textContent = excerpt(post.body);
    card.querySelector(".meta-name").textContent = post.name || "名無しさん";
    card.querySelector(".meta-date").textContent = formatDateTime(post.createdAt);
    card.querySelector(".meta-comments").textContent = post.commentCount ?? 0;
    card.querySelector(".meta-views").textContent = post.viewCount ?? 0;

    frag.appendChild(card);
  });

  listEl.appendChild(frag);
}

function applySearch(keyword) {
  if (!keyword) {
    renderPosts(allPosts);
    return;
  }
  const kw = keyword.toLowerCase();
  const filtered = allPosts.filter((post) => {
    return (
      post.title.toLowerCase().includes(kw) ||
      post.body.toLowerCase().includes(kw) ||
      (post.name || "").toLowerCase().includes(kw)
    );
  });
  renderPosts(filtered, true);
}

async function loadPosts() {
  loadingEl.style.display = "block";
  errorEl.style.display = "none";
  try {
    const q = query(
      collection(db, "hiroba_posts"),
      where("deleted", "==", false),
      orderBy("createdAt", "desc"),
      limit(LIMITS.POST_LIST_FETCH)
    );
    const snap = await getDocs(q);
    allPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderPosts(allPosts);
  } catch (e) {
    console.error(e);
    errorEl.style.display = "block";
    errorEl.textContent =
      "投稿の読み込みに失敗しました。しばらくしてから再度お試しください。（Firebaseの設定が未完了の可能性があります）";
  } finally {
    loadingEl.style.display = "none";
  }
}

searchForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  applySearch(searchInput.value.trim());
});

searchInput?.addEventListener("input", () => {
  if (searchInput.value.trim() === "") {
    applySearch("");
  }
});

loadPosts();
