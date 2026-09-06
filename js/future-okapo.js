// ===================================================
// FUTURE OKAPO — 挑戦の管理ボード
// ---------------------------------------------------
// index.html の #future セクションで動く。
//
//  ・訪問者   … NEXT / COMPLETED をリアルタイム閲覧（読み取りのみ）
//  ・管理者   … Firebase Authentication（メール＋パスワード）で
//               ログイン中だけ「＋ 新しい挑戦」「✓ 完了する」「↩ 戻す」
//               が使える
//
// 【認証方式について】
//  合言葉のハッシュをクライアントに持たせてルールで照合する方式は、
//  「保存済みハッシュを読めば誰でも書き込みリクエストを偽装できる」
//  ため管理者認証には使えない（hiroba の削除キーは“投稿の論理削除”
//  という低リスク操作に限定して許容しているもの）。
//  ここでは Firestore ルールが唯一まともに検証できる本人確認手段
//  である request.auth を使う。UI 上は「合言葉」と表示しているが、
//  中身は管理者アカウントのパスワード。メールアドレスは下の
//  ADMIN_EMAIL に固定で埋め込み、入力欄はパスワードだけにしている。
//
// 【Firestore】
//  コレクション: future_challenges/{autoId}
//    title:       string  1〜60字
//    note:        string  0〜120字
//    emoji:       string  0〜8字
//    plannedDate: string  0〜20字（"2026.12.01" や "未定" など自由入力）
//    status:      "next" | "completed"
//    createdAt:   timestamp
//    completedAt: timestamp | null
//
//  既存の hiroba_posts / orders / site_meta には一切アクセスしない。
//  Firebase アプリも別名（"okapoFuture"）で初期化している。
// ===================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { INITIAL_CHALLENGES } from "./future-initial-data.js";

// ---------------------------------------------------
// 管理者アカウントの識別情報。
//
//  ・ADMIN_EMAIL … signInWithEmailAndPassword に渡すメールアドレス。
//    Firebase コンソールで作成したアカウントと**必ず一致**させること。
//    画面には出さない（入力欄はパスワード＝「合言葉」だけ）。
//  ・ADMIN_UID   … ログイン後に「本当にこの管理者か」を確認するための UID。
//    firestore.rules の isFutureAdmin() と同じ値。
//
//  どちらも秘密情報ではない。UID は推測不能なランダム文字列で、
//  知られても本人としてログイン（パスワード認証）できなければ
//  Firestore への書き込みはルール側で拒否される。クライアント JS に
//  そのまま書いてよい種類の値。
// ---------------------------------------------------
const ADMIN_EMAIL = "shmj8739@gmail.com";
const ADMIN_UID = "B97DtiPqoiRuB1IJ2NuxaEPoVzq2";

const COLLECTION = "future_challenges";
const EMOJI_CHOICES = [
  "🔥", "🥊", "🏃", "🚴", "🎯", "💪", "📚", "✈️",
  "🎸", "🏔️", "🧗", "🏊", "🥋", "🎤", "🧠", "💻",
];

const prefersReducedMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------
// Firebase 初期化（別名アプリ）
// ---------------------------------------------------
const app = initializeApp(firebaseConfig, "okapoFuture");
const db = getFirestore(app);
const auth = getAuth(app);
// ログイン状態をこのブラウザに保持する（リロードしても管理モードのまま）。
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn("[future-okapo] setPersistence:", e)
);

// ---------------------------------------------------
// DOM 参照
// ---------------------------------------------------
const board = document.getElementById("future-board");
if (board) init();

function init() {
  const el = {
    board,
    addBtn: document.getElementById("future-add-btn"),
    adminBar: document.getElementById("future-admin-bar"),
    adminEntry: document.getElementById("future-admin-entry"),
    logoutBtn: document.getElementById("future-logout-btn"),

    nextList: document.getElementById("future-next-list"),
    nextEmpty: document.getElementById("future-next-empty"),
    nextCount: document.getElementById("future-next-count"),
    doneList: document.getElementById("future-done-list"),
    doneEmpty: document.getElementById("future-done-empty"),
    doneCount: document.getElementById("future-done-count"),
    state: document.getElementById("future-state"),

    loginOverlay: document.getElementById("future-login-overlay"),
    loginForm: document.getElementById("future-login-form"),
    loginPass: document.getElementById("future-login-pass"),
    loginMsg: document.getElementById("future-login-msg"),
    loginCancel: document.getElementById("future-login-cancel"),
    loginSubmit: document.getElementById("future-login-submit"),

    addOverlay: document.getElementById("future-add-overlay"),
    addForm: document.getElementById("future-add-form"),
    addTitle: document.getElementById("future-add-title-input"),
    addNote: document.getElementById("future-add-note-input"),
    addDate: document.getElementById("future-add-date-input"),
    addMsg: document.getElementById("future-add-msg"),
    addCancel: document.getElementById("future-add-cancel"),
    addSubmit: document.getElementById("future-add-submit"),
    emojiPicker: document.getElementById("future-emoji-picker"),
  };

  let isAdmin = false;
  let challenges = []; // { id, title, note, emoji, plannedDate, status, createdAt, completedAt }
  let selectedEmoji = EMOJI_CHOICES[0];
  const completing = new Set(); // 完了アニメ中の id（再描画で消さないため）

  buildEmojiPicker(el, () => selectedEmoji, (v) => { selectedEmoji = v; });
  wireModals(el);
  wireAdmin(el);

  // -------------------------------------------------
  // 認証状態
  // -------------------------------------------------
  onAuthStateChanged(auth, (user) => {
    // UI を管理モードに切り替える条件。書き込みの可否はこれとは別に
    // firestore.rules（同じ UID）が最終判定する。
    isAdmin = !!user && user.uid === ADMIN_UID;
    el.board.dataset.admin = String(isAdmin);
    el.adminBar.hidden = !isAdmin;
    if (isAdmin) closeOverlay(el.loginOverlay);
    render();
  });

  // -------------------------------------------------
  // Firestore リアルタイム購読
  // -------------------------------------------------
  onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      challenges = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      hideState(el);
      render();
    },
    (err) => {
      console.error("[future-okapo] snapshot error:", err);
      showState(el, "挑戦リストを読み込めませんでした。時間をおいて再度お試しください。");
    }
  );

  // -------------------------------------------------
  // 描画
  // -------------------------------------------------
  function render() {
    const toMs = (t) => (t && typeof t.toMillis === "function" ? t.toMillis() : 0);

    const next = challenges
      .filter((c) => c.status !== "completed")
      .sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt));
    const done = challenges
      .filter((c) => c.status === "completed")
      .sort((a, b) => toMs(b.completedAt) - toMs(a.completedAt));

    renderList(el.nextList, el.nextEmpty, next, "next");
    renderList(el.doneList, el.doneEmpty, done, "done");

    el.nextCount.textContent = next.length ? String(next.length) : "";
    el.doneCount.textContent = done.length ? String(done.length) : "";

    // 初期データ取り込みボタン（管理者・かつコレクションが空のときだけ）
    renderSeedPrompt(next.length + done.length === 0);
  }

  function renderList(listEl, emptyEl, items, kind) {
    listEl.textContent = "";
    if (items.length === 0) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    const frag = document.createDocumentFragment();
    items.forEach((c) => frag.appendChild(buildCard(c, kind)));
    listEl.appendChild(frag);
  }

  function buildCard(c, kind) {
    const card = document.createElement("article");
    card.className = `future-item future-item--${kind}`;
    card.setAttribute("role", "listitem");
    card.dataset.id = c.id;
    if (completing.has(c.id)) card.classList.add("is-completing");

    const emoji = document.createElement("span");
    emoji.className = "future-item-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = c.emoji || (kind === "done" ? "✓" : "🔥");

    const body = document.createElement("div");
    body.className = "future-item-body";

    const title = document.createElement("p");
    title.className = "future-item-title";
    title.textContent = c.title || "(無題の挑戦)";

    body.appendChild(title);

    if (c.note) {
      const note = document.createElement("p");
      note.className = "future-item-note";
      note.textContent = c.note;
      body.appendChild(note);
    }

    const meta = document.createElement("p");
    meta.className = "future-item-date";
    if (kind === "done") {
      meta.textContent = formatDoneDate(c.completedAt);
    } else if (c.plannedDate) {
      meta.textContent = c.plannedDate;
    }
    if (meta.textContent) body.appendChild(meta);

    card.appendChild(emoji);
    card.appendChild(body);

    // 管理者操作
    if (isAdmin) {
      const actions = document.createElement("div");
      actions.className = "future-item-actions";

      if (kind === "next") {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "future-complete-btn";
        btn.innerHTML = '<span aria-hidden="true">✓</span> 完了する';
        btn.addEventListener("click", () => completeChallenge(c.id, card));
        actions.appendChild(btn);
      } else {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "future-linkbtn future-undo-btn";
        btn.textContent = "↩ NEXTに戻す";
        btn.addEventListener("click", () => undoChallenge(c.id));
        actions.appendChild(btn);
      }
      card.appendChild(actions);
    }

    return card;
  }

  function renderSeedPrompt(show) {
    const existing = document.getElementById("future-seed-prompt");
    if (!(show && isAdmin)) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const box = document.createElement("div");
    box.id = "future-seed-prompt";
    box.className = "future-seed-prompt";
    const p = document.createElement("p");
    p.textContent = "以前トップページに載せていた3つの挑戦は、まだ取り込まれていません。";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "future-btn future-btn--primary";
    btn.textContent = "既存の3つの挑戦を取り込む";
    btn.addEventListener("click", () => seedInitial(btn));
    box.appendChild(p);
    box.appendChild(btn);
    el.nextList.parentElement.insertBefore(box, el.nextList);
  }

  // -------------------------------------------------
  // 書き込み系（管理者のみ。ルール側でも request.auth を再検証）
  // -------------------------------------------------
  async function addChallenge(data) {
    return addDoc(collection(db, COLLECTION), {
      title: data.title,
      note: data.note,
      emoji: data.emoji,
      plannedDate: data.plannedDate,
      status: "next",
      createdAt: serverTimestamp(),
      completedAt: null,
    });
  }

  async function completeChallenge(id, cardEl) {
    if (completing.has(id)) return;
    completing.add(id);
    if (cardEl) cardEl.classList.add("is-completing");

    const delay = prefersReducedMotion ? 0 : 460;
    await new Promise((r) => setTimeout(r, delay));

    try {
      await updateDoc(doc(db, COLLECTION, id), {
        status: "completed",
        completedAt: serverTimestamp(),
      });
      flash(el, "また一つ、挑戦を終えた。");
    } catch (err) {
      console.error("[future-okapo] complete failed:", err);
      showState(el, "完了できませんでした。ログイン状態をご確認ください。");
      if (cardEl) cardEl.classList.remove("is-completing");
    } finally {
      completing.delete(id);
    }
  }

  async function undoChallenge(id) {
    try {
      await updateDoc(doc(db, COLLECTION, id), {
        status: "next",
        completedAt: null,
      });
    } catch (err) {
      console.error("[future-okapo] undo failed:", err);
      showState(el, "戻せませんでした。ログイン状態をご確認ください。");
    }
  }

  async function seedInitial(btn) {
    btn.disabled = true;
    btn.textContent = "取り込み中…";
    try {
      for (const item of INITIAL_CHALLENGES) {
        const isDone = item.status === "completed";
        await addDoc(collection(db, COLLECTION), {
          title: String(item.title || "").slice(0, 60),
          note: String(item.note || "").slice(0, 120),
          emoji: String(item.emoji || "🔥").slice(0, 8),
          plannedDate: String(item.plannedDate || "").slice(0, 20),
          status: isDone ? "completed" : "next",
          createdAt: serverTimestamp(),
          completedAt: isDone ? serverTimestamp() : null,
        });
      }
      flash(el, "既存の挑戦を取り込みました。");
    } catch (err) {
      console.error("[future-okapo] seed failed:", err);
      showState(el, "取り込みに失敗しました。ログイン状態をご確認ください。");
      btn.disabled = false;
      btn.textContent = "既存の3つの挑戦を取り込む";
    }
  }

  // -------------------------------------------------
  // モーダル配線
  // -------------------------------------------------
  function wireModals(el) {
    // 「＋ 新しい挑戦」
    el.addBtn.addEventListener("click", () => {
      if (isAdmin) {
        openAdd(el);
      } else {
        openOverlay(el.loginOverlay);
        el.loginPass.focus();
      }
    });

    // 管理者エントリ（◈）
    el.adminEntry.addEventListener("click", () => {
      if (isAdmin) return;
      openOverlay(el.loginOverlay);
      el.loginPass.focus();
    });

    // ログイン
    el.loginCancel.addEventListener("click", () => closeOverlay(el.loginOverlay));
    el.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg(el.loginMsg);
      const pass = el.loginPass.value;
      if (!pass) return;
      el.loginSubmit.disabled = true;
      el.loginSubmit.textContent = "確認中…";
      try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, pass);
        el.loginForm.reset();
        closeOverlay(el.loginOverlay);
      } catch (err) {
        console.error("[future-okapo] login failed:", err.code);
        showMsg(el.loginMsg, "合言葉が違うようです。");
      } finally {
        el.loginSubmit.disabled = false;
        el.loginSubmit.textContent = "ログイン";
      }
    });

    // 追加
    el.addCancel.addEventListener("click", () => closeOverlay(el.addOverlay));
    el.addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg(el.addMsg);
      const title = el.addTitle.value.trim();
      if (!title) {
        showMsg(el.addMsg, "タイトルを入力してください。");
        return;
      }
      el.addSubmit.disabled = true;
      el.addSubmit.textContent = "追加中…";
      try {
        await addChallenge({
          title: title.slice(0, 60),
          note: el.addNote.value.trim().slice(0, 120),
          emoji: selectedEmoji,
          plannedDate: el.addDate.value.trim().slice(0, 20),
        });
        el.addForm.reset();
        selectedEmoji = EMOJI_CHOICES[0];
        syncEmojiPicker(el, selectedEmoji);
        closeOverlay(el.addOverlay);
        flash(el, "NEXT に追加しました。");
      } catch (err) {
        console.error("[future-okapo] add failed:", err);
        showMsg(el.addMsg, "追加できませんでした。ログイン状態をご確認ください。");
      } finally {
        el.addSubmit.disabled = false;
        el.addSubmit.textContent = "追加する";
      }
    });

    // オーバーレイの背景クリック / Esc で閉じる
    [el.loginOverlay, el.addOverlay].forEach((ov) => {
      ov.addEventListener("click", (e) => {
        if (e.target === ov) closeOverlay(ov);
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeOverlay(el.loginOverlay);
        closeOverlay(el.addOverlay);
      }
    });
  }

  function wireAdmin(el) {
    el.logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        flash(el, "ログアウトしました。");
      } catch (err) {
        console.error("[future-okapo] signOut failed:", err);
      }
    });
  }

  function openAdd(el) {
    hideMsg(el.addMsg);
    openOverlay(el.addOverlay);
    el.addTitle.focus();
  }
}

// ===================================================
// 小さなヘルパー（init 外でも使える純粋関数）
// ===================================================
function buildEmojiPicker(el, getVal, setVal) {
  el.emojiPicker.textContent = "";
  EMOJI_CHOICES.forEach((emo, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "future-emoji-opt";
    b.textContent = emo;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", emo);
    b.setAttribute("aria-checked", String(i === 0));
    if (i === 0) b.classList.add("is-selected");
    b.addEventListener("click", () => {
      setVal(emo);
      syncEmojiPicker(el, emo);
    });
    el.emojiPicker.appendChild(b);
  });
}

function syncEmojiPicker(el, value) {
  el.emojiPicker.querySelectorAll(".future-emoji-opt").forEach((b) => {
    const on = b.textContent === value;
    b.classList.toggle("is-selected", on);
    b.setAttribute("aria-checked", String(on));
  });
}

function openOverlay(ov) {
  ov.hidden = false;
  requestAnimationFrame(() => ov.classList.add("is-open"));
}

function closeOverlay(ov) {
  if (!ov) return;
  ov.classList.remove("is-open");
  ov.hidden = true;
}

function showMsg(elp, text) {
  elp.textContent = text;
  elp.hidden = false;
}
function hideMsg(elp) {
  elp.textContent = "";
  elp.hidden = true;
}

function showState(el, text) {
  el.state.textContent = text;
  el.state.hidden = false;
}
function hideState(el) {
  el.state.hidden = true;
}

// 一時的なトースト風メッセージ（状態表示を数秒だけ出す）
let flashTimer = null;
function flash(el, text) {
  showState(el, text);
  el.state.classList.add("is-flash");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    el.state.classList.remove("is-flash");
    hideState(el);
  }, 2600);
}

function formatDoneDate(ts) {
  if (!ts || typeof ts.toDate !== "function") return "";
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
