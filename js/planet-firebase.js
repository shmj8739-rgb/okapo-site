// ===================================================
// おかぽるPLANTS — 注文機能専用のFirebase初期化
// ---------------------------------------------------
// おかぽ広場（js/hiroba-common.js）の初期化とは完全に分離するため、
// "okapoPlants" という名前付きアプリとして初期化する
// （同一ページでどちらも読み込まれても "Firebase App already exists"
//  エラーが起きないようにするための措置。現状は両者が同じページで
//  同時に読み込まれることはないが、将来の安全のため）。
//
// firebaseConfig の値自体は秘密鍵ではない（Firebaseの設計上、
// クライアントに公開される前提の識別情報）。アクセス制御は
// この値を隠すことではなく、Firestore セキュリティルール
// （firestore.rules）側で行う。既存の js/firebase-config.js を
// そのまま再利用し、新しい値の追加は行わない。
// ===================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig, "okapoPlants");
export const db = getFirestore(app);

export { collection, addDoc, serverTimestamp };
