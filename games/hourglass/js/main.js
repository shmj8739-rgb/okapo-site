/* =====================================================================
   main.js
   起動のみ。依存順に読み込まれた constants → calc → hourglass → ui を
   DOMContentLoaded で立ち上げる。
===================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  LH.UI.init();
});
