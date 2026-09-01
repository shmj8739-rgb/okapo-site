/* =====================================================================
   calc.js
   純粋な計算関数群。DOM には一切触れない・副作用なし。
   → 第二段階（選択カード / Before-After / 時間プール）でもそのまま流用でき、
     単体テストもしやすいように UI から完全に分離している。
===================================================================== */
window.LH = window.LH || {};

(function () {
  var DPY = LH.CONFIG.DAYS_PER_YEAR;
  var HOURS_PER_YEAR = DPY * 24;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  /* 人生の経過。age >= life でも壊れないようにする */
  function lifeProgress(age, lifeExpectancy) {
    var life = Math.max(lifeExpectancy, 0.0001);
    var a = Math.max(age, 0);
    var elapsedRatio = clamp(a / life, 0, 1);
    var remainingYears = Math.max(life - a, 0);
    return {
      elapsedRatio: elapsedRatio,
      remainingRatio: 1 - elapsedRatio,
      elapsedYears: Math.min(a, life),
      remainingYears: remainingYears,
      remainingHours: remainingYears * HOURS_PER_YEAR,
      remainingDays: remainingYears * DPY,
    };
  }

  /* 1 日 hoursPerDay 時間を使うと、残りの人生で合計何年になるか */
  function categoryYears(remainingYears, hoursPerDay) {
    return remainingYears * (clamp(hoursPerDay, 0, 24) / 24);
  }

  /* 労働 1 時間あたりが生む金額 */
  function hourlyWage(annualIncome, workHoursPerDay, workDaysPerYear) {
    var denom = Math.max(workHoursPerDay, 0.0001) * Math.max(workDaysPerYear, 0.0001);
    return annualIncome / denom;
  }

  /* 金額を「働く時間」に変換 */
  function workHoursForAmount(amount, hourlyWageValue) {
    if (!(hourlyWageValue > 0)) return Infinity;
    return amount / hourlyWageValue;
  }

  /* ---------------------------------------------------------------
     state（全入力）から、画面表示に必要な派生値をまとめて作る。
     第二段階では、この戻り値に選択カードの効果を足し引きした
     「もうひとつの derived」を作って並べれば Before / After になる。
  --------------------------------------------------------------- */
  function compute(state) {
    var prog = lifeProgress(state.age, state.lifeExpectancy);

    var daily = {};
    var dailySum = 0;
    LH.CATEGORIES.forEach(function (c) {
      var h = Number(state.daily[c.key]) || 0;
      dailySum += h;
      var years = categoryYears(prog.remainingYears, h);
      daily[c.key] = {
        hoursPerDay: h,
        ratioOfDay: clamp(h / 24, 0, 1),
        years: years,
        hours: years * HOURS_PER_YEAR,
      };
    });

    var wage = hourlyWage(
      state.money.annualIncome,
      state.money.workHoursPerDay,
      state.money.workDaysPerYear
    );

    return {
      progress: prog,
      elapsedPercent: prog.elapsedRatio * 100,
      remainingPercent: prog.remainingRatio * 100,
      daily: daily,
      dailySum: dailySum,
      dailyFree: 24 - dailySum,
      dailyOver: dailySum > 24,
      hourlyWage: wage,
    };
  }

  /* ---- 表示フォーマッタ ---- */
  function roundTo(n, unit) { return Math.round(n / unit) * unit; }

  function num(n) {
    if (!isFinite(n)) return '—';
    return Math.round(n).toLocaleString('ja-JP');
  }
  function years(n) {
    if (!isFinite(n)) return '—';
    return '約 ' + (Math.round(n * 10) / 10).toLocaleString('ja-JP') + ' 年';
  }
  function hours(n) {
    if (!isFinite(n)) return '—';
    var r =
      n >= 100000 ? roundTo(n, 1000) :
      n >= 10000  ? roundTo(n, 100) :
      Math.round(n);
    return '約 ' + r.toLocaleString('ja-JP') + ' 時間';
  }
  function days(n) {
    if (!isFinite(n)) return '—';
    return '約 ' + (Math.round(n * 10) / 10).toLocaleString('ja-JP') + ' 日';
  }
  function yen(n) {
    if (!isFinite(n)) return '—';
    return '¥' + Math.round(n).toLocaleString('ja-JP');
  }
  function percent(n) {
    if (!isFinite(n)) return '—';
    var a = Math.abs(n);
    if (a > 0 && a < 0.01) return '0.01% 未満';
    var d = a >= 1 ? 1 : 2;
    var k = Math.pow(10, d);
    return (Math.round(n * k) / k).toLocaleString('ja-JP') + '%';
  }

  LH.calc = {
    clamp: clamp,
    lifeProgress: lifeProgress,
    categoryYears: categoryYears,
    hourlyWage: hourlyWage,
    workHoursForAmount: workHoursForAmount,
    compute: compute,
    HOURS_PER_YEAR: HOURS_PER_YEAR,
    fmt: { num: num, years: years, hours: hours, days: days, yen: yen, percent: percent },
  };
})();
