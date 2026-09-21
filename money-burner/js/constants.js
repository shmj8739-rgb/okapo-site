// ===================================================
// OKAPO MONEY CRASH — 定数・データ定義
// ---------------------------------------------------
// 「紙幣を壊すことそのもの」に集中したシンプル版。
// ゲーム名・額面・ツールなど、変更されうる値はこのファイルに集約する。
// ===================================================

// ---------- ゲームタイトル ----------
// サブタイトルは今回のリニューアルで廃止（空文字のままでよい）。
// タイトルを変える場合はここを書き換えるだけでOK
// （document.title・画面上のタイトル表示の両方に反映される）。
const GAME_TITLE = {
  main: "OKAPO MONEY CRASH",
  short: "MONEY CRASH",
};

// ---------- 通貨単位 ----------
// 紙幣の額面に合わせて「YEN」表記にしている。
const CURRENCY_UNIT = "YEN";

// ---------- 紙幣の額面 ----------
// 実在の日本銀行券そのものではなく、額面・配色の系統だけを踏襲した
// オリジナルデザイン（js/notes.js 側でSVG風にCSS生成）。
const DENOMINATIONS = [
  { value: 1000, className: "note--1000", label: "1,000", tint: "blue" },
  { value: 5000, className: "note--5000", label: "5,000", tint: "magenta" },
  { value: 10000, className: "note--10000", label: "10,000", tint: "gold" },
];
// 出現しやすさの重み（1000円が一番出やすい）
const DENOMINATION_WEIGHTS = [0.5, 0.3, 0.2];

// ---------- ツール ----------
// FIRE（燃やす）と TEAR（破る）の2つだけに絞っている。
const TOOLS = {
  fire: { id: "fire", label: "FIRE", jp: "燃やす", icon: "🔥" },
  tear: { id: "tear", label: "TEAR", jp: "破る", icon: "✋" },
};
const TOOL_ORDER = ["fire", "tear"];

// ---------- 燃焼シミュレーション（FIRE）----------
const FIRE_CONFIG = {
  autoBurnRate: 11, // 着火後、1秒あたり自動で進む burnProgress
  scorchStart: 1, // 1〜30: 少し焦げる
  burningStart: 31, // 31〜70: 燃焼中
  ashStart: 71, // 71〜99: ほぼ灰
  complete: 100, // 100: 完全消滅（スコアに加算）
};

// ---------- 破る操作（TEAR）----------
const TEAR_CONFIG = {
  pxPerProgress: 3.2, // なぞった距離(px)が何pxでtearProgressが1進むか
  complete: 100,
};

// ---------- localStorage キー ----------
// シンプル化に伴い保存内容も totalDestroyed のみに変更。
// 旧バージョン（ミッション・ランク等）のデータと衝突しないよう
// キー名を変更している。
const STORAGE_KEY = "okapoMoneyCrash.v1";
