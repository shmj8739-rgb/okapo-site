/**
 * storage.js
 * -----------------------------------------------------------------------
 * localStorage を利用したハイスコア／設定の永続化。
 * localStorage が使えない環境（プライベートモード等）でも例外で
 * ゲームが落ちないようフォールバックする。
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const { STORAGE_KEY_HIGH_SCORE, STORAGE_KEY_SOUND } = global.OKARIS_CONST;

  function isStorageAvailable() {
    try {
      const testKey = '__okaris_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  const available = isStorageAvailable();

  function getHighScore() {
    if (!available) return 0;
    const raw = window.localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
    const value = parseInt(raw, 10);
    return Number.isFinite(value) ? value : 0;
  }

  function setHighScore(score) {
    if (!available) return;
    window.localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(score));
  }

  function getSoundEnabled() {
    if (!available) return true;
    const raw = window.localStorage.getItem(STORAGE_KEY_SOUND);
    return raw === null ? true : raw === '1';
  }

  function setSoundEnabled(enabled) {
    if (!available) return;
    window.localStorage.setItem(STORAGE_KEY_SOUND, enabled ? '1' : '0');
  }

  global.OkarisStorage = {
    getHighScore,
    setHighScore,
    getSoundEnabled,
    setSoundEnabled,
  };
})(window);
