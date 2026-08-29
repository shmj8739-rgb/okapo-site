// ===================================================
// おかぽるLAB — トップページ訪問者カウンター
// ---------------------------------------------------
// 「あなたは 000267 人目のお客様です」表示。データは Firestore の
// site_meta/visitorCounter ドキュメント（count フィールド）を使う。
//
//  - そのブラウザでの初回訪問時だけ runTransaction で count を +1 し、
//    発行された通し番号を localStorage（キー: okapoVisitorNo）へ保存する。
//  - 2回目以降（リロード・再訪問）は localStorage の番号をそのまま表示し、
//    Firestore には一切アクセスしない（読み取り・書き込みゼロ）。
//    → 同一ユーザーの再読み込みで番号が増えない。
//  - runTransaction を使うことで、複数人が同時にアクセスしても
//    Firestore 側が書き込み競合を検知して自動的にやり直すため、
//    同じ番号が重複発行されることはない。
//
// おかぽ広場（js/hiroba-common.js）・おかぽるPLANTS（js/planet-firebase.js）
// とは別名の Firebase アプリ（"okapoCounter"）として初期化しており、
// 参照するドキュメントも site_meta/visitorCounter のみ。
// 既存のコレクション（hiroba_posts / orders）には一切アクセスしない。
//
// 取得・保存するのは「通し番号」だけ。IP・UA・Cookie など個人情報は扱わない。
// ===================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  doc,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const STORAGE_KEY = "okapoVisitorNo";
const COUNTER_DIGITS = 6;

// 表示用の6桁ゼロ埋め（例: 1 -> "000001" / 267 -> "000267"）。
// 100万以上に達して桁があふれた場合はゼロ埋めせずそのまま表示する。
function formatVisitorNumber(number) {
  return String(number).padStart(COUNTER_DIGITS, "0");
}

// localStorage から保存済みの通し番号を読む。
// 未保存・壊れた値・非正整数はすべて「無し（初回扱い）」とする。
// プライベートブラウズ等で localStorage が使えない環境でも例外を投げない。
function readStoredVisitorNumber() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (_e) {
    return null;
  }
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function writeStoredVisitorNumber(number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(number));
  } catch (_e) {
    // 保存できなくても表示は行う（次回また初回扱いになるだけ）。
  }
}

const app = initializeApp(firebaseConfig, "okapoCounter");
const db = getFirestore(app);
const counterRef = doc(db, "site_meta", "visitorCounter");

// 初回訪問時のみ呼ぶ。count を +1 して、発行された番号を返す。
// ドキュメントが未作成なら count:1 で作成、既存なら count+1 に更新する
// （どちらも firestore.rules の site_meta/visitorCounter 条件に合致する）。
async function incrementAndGetVisitorNumber() {
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const current =
      snap.exists() && typeof snap.data().count === "number" ? snap.data().count : 0;
    const next = current + 1;
    transaction.set(counterRef, { count: next });
    return next;
  });
}

// 数字を桁ごとの小さな「箱」に入れて、昔のアクセスカウンター風に見せる。
// 中身は formatVisitorNumber の出力（基本は数字のみ）だけなので、
// テキストノードとして安全に組み立てる。
function showVisitorNumber(root, number) {
  const numberEl = root.querySelector(".visitor-counter-number");
  if (numberEl) {
    const text = formatVisitorNumber(number);
    numberEl.setAttribute("role", "text");
    numberEl.setAttribute("aria-label", text);
    numberEl.replaceChildren(
      ...Array.from(text, (ch) => {
        const cell = document.createElement("span");
        cell.className = "visitor-counter-digit";
        cell.setAttribute("aria-hidden", "true");
        cell.textContent = ch;
        return cell;
      })
    );
  }
  root.classList.add("is-ready");
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("visitor-counter");
  if (!root) return;

  // 2回目以降: 保存済みの番号を表示して終了（Firestore へアクセスしない）。
  const stored = readStoredVisitorNumber();
  if (stored !== null) {
    showVisitorNumber(root, stored);
    return;
  }

  // 初回: Firestore の count を +1 して番号を発行 → localStorage に保存 → 表示。
  incrementAndGetVisitorNumber()
    .then((number) => {
      writeStoredVisitorNumber(number);
      showVisitorNumber(root, number);
    })
    .catch((err) => {
      // オフライン・広告ブロッカー・ルール未公開などで Firestore に
      // 接続できない場合は、誤解を招く数字（ランダム値や 0）を出さず
      // カウンター要素ごと非表示にする。localStorage は更新しないので、
      // 次回アクセス時に改めて初回として再試行される。
      console.error("visitor counter error:", err);
      root.hidden = true;
    });
});
