// ===================================================
// おかぽ広場 — 共通ユーティリティ / Firebase 初期化
// ===================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
};

// ---------------------------------------------------
// 定数（Firestore セキュリティルールの制限値と揃えること）
// ---------------------------------------------------
export const LIMITS = {
  NAME_MAX: 30,
  TITLE_MAX: 100,
  BODY_MAX: 2000,
  COMMENT_MAX: 500,
  DELETE_KEY_MIN: 4,
  DELETE_KEY_MAX: 50,
  IMAGE_MAX_SOURCE_BYTES: 8 * 1024 * 1024, // アップロード元ファイルの上限（8MB）
  IMAGE_MAX_ENCODED_BYTES: 700 * 1000, // 圧縮後 Base64 文字列の上限（Firestore の 1MB/フィールド制限に収める）
  IMAGE_MAX_DIMENSION: 1280,
  POST_LIST_FETCH: 200, // 一覧取得の最大件数（検索はこの範囲内で行う）
  POST_RATE_LIMIT_MS: 20 * 1000, // 連続投稿の抑止間隔
  COMMENT_RATE_LIMIT_MS: 8 * 1000,
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ---------------------------------------------------
// XSS 対策：ユーザー入力は必ず textContent 等の安全な方法で
// DOM に挿入する。innerHTML を使う場合は必ずこの関数を通す。
// ---------------------------------------------------
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 改行を保持したまま安全に HTML へ変換（本文表示用）
export function escapeHtmlWithBreaks(str) {
  return escapeHtml(str).replace(/\n/g, "<br>");
}

// ---------------------------------------------------
// 入力バリデーション
// ---------------------------------------------------
export function sanitizePlainText(str) {
  // 制御文字（改行・タブ以外）を除去し、前後の空白をトリム
  return String(str ?? "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim();
}

export function validatePostInput({ name, title, body }) {
  const errors = [];
  if (!title || title.length === 0) errors.push("タイトルを入力してください。");
  if (title && title.length > LIMITS.TITLE_MAX) errors.push(`タイトルは${LIMITS.TITLE_MAX}文字以内で入力してください。`);
  if (!body || body.length === 0) errors.push("本文を入力してください。");
  if (body && body.length > LIMITS.BODY_MAX) errors.push(`本文は${LIMITS.BODY_MAX}文字以内で入力してください。`);
  if (name && name.length > LIMITS.NAME_MAX) errors.push(`名前は${LIMITS.NAME_MAX}文字以内で入力してください。`);
  return errors;
}

export function validateDeleteKey(key) {
  if (!key || key.length < LIMITS.DELETE_KEY_MIN) {
    return `削除キーは${LIMITS.DELETE_KEY_MIN}文字以上で設定してください。`;
  }
  if (key.length > LIMITS.DELETE_KEY_MAX) {
    return `削除キーは${LIMITS.DELETE_KEY_MAX}文字以内で設定してください。`;
  }
  return null;
}

export function validateCommentInput({ name, body }) {
  const errors = [];
  if (!body || body.length === 0) errors.push("コメントを入力してください。");
  if (body && body.length > LIMITS.COMMENT_MAX) errors.push(`コメントは${LIMITS.COMMENT_MAX}文字以内で入力してください。`);
  if (name && name.length > LIMITS.NAME_MAX) errors.push(`名前は${LIMITS.NAME_MAX}文字以内で入力してください。`);
  return errors;
}

// ---------------------------------------------------
// 削除キーのハッシュ化（Web Crypto API / SHA-256）
// 平文の削除キーは一切サーバーに保存しない
// ---------------------------------------------------
export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------
// 日時フォーマット
// ---------------------------------------------------
export function formatDateTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

// ---------------------------------------------------
// 画像の検証・リサイズ・Base64 化
// - 拡張子/MIME だけでなく、実際に <canvas> へのデコードが
//   成功するかどうかで「本物の画像ファイルか」を検証する
// - 長辺 IMAGE_MAX_DIMENSION px に縮小し、JPEG で圧縮
// ---------------------------------------------------
export function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "画像はJPEG・PNG・WebP・GIF形式のみアップロードできます。";
  }
  if (file.size > LIMITS.IMAGE_MAX_SOURCE_BYTES) {
    return "画像サイズは8MB以内にしてください。";
  }
  return null;
}

export function resizeImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        let { width, height } = img;
        const max = LIMITS.IMAGE_MAX_DIMENSION;
        if (width > max || height > max) {
          if (width >= height) {
            height = Math.round((height * max) / width);
            width = max;
          } else {
            width = Math.round((width * max) / height);
            height = max;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // 品質を段階的に下げながら上限サイズに収める
        let quality = 0.82;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > LIMITS.IMAGE_MAX_ENCODED_BYTES && quality > 0.3) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        URL.revokeObjectURL(objectUrl);

        if (dataUrl.length > LIMITS.IMAGE_MAX_ENCODED_BYTES) {
          reject(new Error("画像を十分に圧縮できませんでした。別の画像でお試しください。"));
          return;
        }
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像ファイルを読み込めませんでした。破損しているか、対応していない形式の可能性があります。"));
    };

    img.src = objectUrl;
  });
}

// ---------------------------------------------------
// 簡易スパム対策
// - ハニーポット（画面に見えない入力欄。埋まっていればボット）
// - localStorage を使ったクライアント側の連投抑止
//   （厳密なサーバー側レート制限ではない簡易的な抑止です）
// ---------------------------------------------------
export function isHoneypotFilled(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function canPostNow(storageKey, intervalMs) {
  const last = Number(localStorage.getItem(storageKey) || 0);
  return Date.now() - last >= intervalMs;
}

export function recordPostNow(storageKey) {
  localStorage.setItem(storageKey, String(Date.now()));
}

export function remainingWaitSeconds(storageKey, intervalMs) {
  const last = Number(localStorage.getItem(storageKey) || 0);
  const remain = intervalMs - (Date.now() - last);
  return Math.max(0, Math.ceil(remain / 1000));
}

// ---------------------------------------------------
// 閲覧数の二重カウント防止（同一セッション内は1回のみカウント）
// ---------------------------------------------------
export function hasViewedPost(postId) {
  try {
    const viewed = JSON.parse(sessionStorage.getItem("hiroba_viewed") || "[]");
    return viewed.includes(postId);
  } catch {
    return false;
  }
}

export function markPostViewed(postId) {
  try {
    const viewed = JSON.parse(sessionStorage.getItem("hiroba_viewed") || "[]");
    if (!viewed.includes(postId)) {
      viewed.push(postId);
      sessionStorage.setItem("hiroba_viewed", JSON.stringify(viewed));
    }
  } catch {
    /* sessionStorage が使えない環境では何もしない */
  }
}

// ---------------------------------------------------
// URL クエリパラメータ取得
// ---------------------------------------------------
export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
