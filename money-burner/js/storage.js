// ===================================================
// OKAPO MONEY CRASH — localStorage 保存ラッパー
// ---------------------------------------------------
// シンプル化に伴い、保存するのは totalDestroyed（これまでに破壊した
// 合計金額）だけにしている。BEST SCORE・ランク・実績などは廃止。
// localStorageが使えない環境でもtry/catchで無視し、
// メモリ上のデフォルト値のまま動作を続ける。
// ===================================================

const Storage = (() => {
  function defaults() {
    return { totalDestroyed: 0 };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      return Object.assign(defaults(), parsed);
    } catch (e) {
      return defaults();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* 保存できない環境では無視して続行する */
    }
  }

  return { load, save, defaults };
})();
