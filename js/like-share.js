import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const SELECTOR = "[data-okapo-reactions]";
const STORAGE_PREFIX = "okapoReactionLiked:";

const app = getApps().find((item) => item.name === "okapoReactions")
  || initializeApp(firebaseConfig, "okapoReactions");
const db = getFirestore(app);

function normalizeUrl(value) {
  const url = new URL(value || window.location.href, window.location.href);
  url.hash = "";
  return url.href;
}

function pageTitle(mount) {
  const explicit = mount.dataset.shareTitle?.trim();
  if (explicit) return explicit;

  const scope = mount.closest("article, main") || document;
  const heading = scope.querySelector("h1, h2");
  return heading?.textContent.replace(/\s+/g, " ").trim() || document.title;
}

function hashKey(value) {
  let first = 2166136261;
  let second = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ (code + index), 2246822519);
  }

  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

function readLiked(key) {
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${key}`) === "1";
  } catch {
    return false;
  }
}

function writeLiked(key, liked) {
  try {
    if (liked) {
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, "1");
    } else {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    }
  } catch {
    // プライベートブラウズ等で保存できなくても、共有機能は継続する。
  }
}

function createButton(className, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `okapo-reactions__button ${className}`;
  button.textContent = label;
  return button;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // 権限やブラウザ設定でClipboard APIが拒否された場合は旧方式へ切り替える。
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy failed");
}

function createShareLink(label, href, ariaLabel) {
  const link = document.createElement("a");
  link.className = "okapo-reactions__button";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  link.setAttribute("aria-label", ariaLabel);
  return link;
}

function prepareGameCards() {
  document.querySelectorAll("[data-okapo-reactions-list] .work-card--game").forEach((card) => {
    const body = card.querySelector(".work-card-body");
    const titleElement = card.querySelector(".work-card-title");
    const link = card.querySelector(".work-card-cta[href]");
    if (!body || !titleElement || !link || body.querySelector(SELECTOR)) return;

    const titleCopy = titleElement.cloneNode(true);
    titleCopy.querySelectorAll(".work-card-title-en").forEach((element) => element.remove());

    const mount = document.createElement("div");
    mount.dataset.okapoReactions = "";
    mount.dataset.shareTitle = titleCopy.textContent.replace(/\s+/g, " ").trim();
    mount.dataset.shareUrl = link.href;
    body.appendChild(mount);
  });
}

function initializeMount(mount) {
  const title = pageTitle(mount);
  const url = normalizeUrl(mount.dataset.shareUrl);
  const key = hashKey(url);
  const reactionRef = doc(db, "page_reactions", key);
  let liked = readLiked(key);

  mount.classList.add("okapo-reactions");
  mount.setAttribute("aria-label", `${title}のいいねと共有`);

  const bar = document.createElement("div");
  bar.className = "okapo-reactions__bar";

  const likeButton = createButton("okapo-reactions__like", "");
  likeButton.setAttribute("aria-pressed", String(liked));
  likeButton.setAttribute("aria-label", liked ? "いいねを取り消す" : "いいねする");
  likeButton.innerHTML = `
    <svg class="okapo-reactions__flame" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12.3 2.8c.5 3.5-2.4 4.8-3.6 7.3-.8 1.7-.4 3.1.8 4.2-.1-2.1 1.1-3.3 2.6-4.7.2 2.4 3.2 3.5 3.2 6.4 0 1.9-1.5 3.4-3.4 3.4-3.6 0-6.2-2.5-6.2-6 0-4.1 3.1-6.2 6.6-10.6Z" stroke-linejoin="round"/>
    </svg>
    <span>いいね</span>
    <span class="okapo-reactions__count" aria-live="polite">0</span>`;

  const shareWrap = document.createElement("div");
  shareWrap.className = "okapo-reactions__share-wrap";
  const shareToggle = createButton("okapo-reactions__share-toggle", "共有する");
  const menuId = `okapo-share-${key}-${Math.random().toString(36).slice(2, 7)}`;
  shareToggle.setAttribute("aria-expanded", "false");
  shareToggle.setAttribute("aria-controls", menuId);

  const menu = document.createElement("div");
  menu.className = "okapo-reactions__menu";
  menu.id = menuId;
  menu.hidden = true;

  const shareText = `${title}\n${url}`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const xLink = createShareLink("Xで共有", xUrl, `${title}をXで共有`);
  const lineLink = createShareLink("LINEで共有", lineUrl, `${title}をLINEで共有`);
  const copyButton = createButton("okapo-reactions__copy", "リンクをコピー");

  const status = document.createElement("p");
  status.className = "okapo-reactions__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const closeMenu = () => {
    menu.hidden = true;
    shareToggle.setAttribute("aria-expanded", "false");
  };

  shareToggle.addEventListener("click", () => {
    const willOpen = menu.hidden;
    document.querySelectorAll(".okapo-reactions__menu:not([hidden])").forEach((openMenu) => {
      openMenu.hidden = true;
      openMenu.previousElementSibling?.setAttribute("aria-expanded", "false");
    });
    menu.hidden = !willOpen;
    shareToggle.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("click", (event) => {
    if (!shareWrap.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      closeMenu();
      shareToggle.focus();
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await copyText(url);
      status.textContent = "リンクをコピーしました。";
      copyButton.textContent = "コピーしました";
      window.setTimeout(() => {
        copyButton.textContent = "リンクをコピー";
        status.textContent = "";
      }, 2200);
    } catch {
      status.textContent = "コピーできませんでした。URLを選択してコピーしてください。";
    }
  });

  const countElement = likeButton.querySelector(".okapo-reactions__count");
  const renderLiked = () => {
    likeButton.setAttribute("aria-pressed", String(liked));
    likeButton.setAttribute("aria-label", liked ? "いいねを取り消す" : "いいねする");
  };
  renderLiked();

  likeButton.addEventListener("click", async () => {
    likeButton.disabled = true;
    status.textContent = "";
    liked = readLiked(key);
    const nextLiked = !liked;

    try {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(reactionRef);
        const current = snapshot.exists() && Number.isInteger(snapshot.data().count)
          ? Math.max(0, snapshot.data().count)
          : 0;
        const nextCount = nextLiked ? current + 1 : Math.max(0, current - 1);

        if (snapshot.exists()) {
          transaction.update(reactionRef, { count: nextCount });
        } else if (nextLiked) {
          transaction.set(reactionRef, { count: 1 });
        }
      });

      liked = nextLiked;
      writeLiked(key, liked);
      renderLiked();
      status.textContent = liked ? "いいねしました。" : "いいねを取り消しました。";
    } catch (error) {
      console.error("Failed to update reaction", error);
      status.textContent = "いいねを更新できませんでした。時間をおいて再度お試しください。";
    } finally {
      likeButton.disabled = false;
    }
  });

  onSnapshot(
    reactionRef,
    (snapshot) => {
      const count = snapshot.exists() && Number.isInteger(snapshot.data().count)
        ? Math.max(0, snapshot.data().count)
        : 0;
      countElement.textContent = String(count);
    },
    (error) => {
      console.error("Failed to load reaction count", error);
      status.textContent = "いいね数を読み込めませんでした。";
    },
  );

  menu.append(xLink, lineLink, copyButton);
  shareWrap.append(shareToggle, menu);
  bar.append(likeButton, shareWrap);
  mount.append(bar, status);
}

prepareGameCards();
document.querySelectorAll(SELECTOR).forEach(initializeMount);
