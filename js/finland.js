// OKAPO LAB × FINLAND（/finland/）専用スクリプト — EN / JA 言語切替（リロードなし）
//
// 表示・非表示の実体は css/finland.css の `html[data-lang="en"] .lang-en` 等の
// CSS属性セレクタが担っている。ここでは <html> の data-lang 属性を
// 書き換えるだけ。HTML側が最初から data-lang="ja" を静的に持っているため、
// このJSが読み込まれない／実行できない環境でも常に日本語表示のまま壊れない。
//
// 将来 FI（フィンランド語）を追加する場合：
//  1. SUPPORTED_LANGS に 'fi' を追加
//  2. HTML側に .lang-fi 要素と、css/finland.css に
//     html[data-lang="fi"] 用の表示ルールを追加
//  3. ヘッダーに <button data-lang-btn="fi"> を追加すれば、このJSはそのまま動く
(() => {
  const SUPPORTED_LANGS = ["ja", "en"];
  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-lang-btn]");

  function applyLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;

    root.setAttribute("data-lang", lang);

    buttons.forEach((btn) => {
      const isActive = btn.getAttribute("data-lang-btn") === lang;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });

    try {
      localStorage.setItem("okapoFinlandLang", lang);
    } catch (e) {
      /* localStorage が使えない環境（プライベートブラウズ等）でも無視して続行 */
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyLang(btn.getAttribute("data-lang-btn"));
    });
  });

  let initialLang = "ja";
  try {
    const saved = localStorage.getItem("okapoFinlandLang");
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      initialLang = saved;
    }
  } catch (e) {
    /* 無視して既定の 'ja' を使う */
  }

  applyLang(initialLang);
})();
