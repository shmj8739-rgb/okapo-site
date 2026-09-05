/* =====================================================================
   ui.js
   入力（DOM）→ state を組み立て → calc.compute → 画面と砂時計を更新。

   構造の分離：
     LH.UI.buildState()  … DOM から state を読む（唯一の入力源）
     LH.calc.compute()   … state → 派生値（純粋関数）
     LH.UI.render()      … 派生値を DOM と Hourglass へ反映（唯一の出力先）

   第二段階の拡張ポイント：
     ・選択カード       … buildState 後の state を変換する関数を挟む
     ・Before / After   … compute を 2 回呼んで結果を並べる
     ・時間プール       … 下の「自由に使える時間」表示をカード化して常時表示
     ・シナリオ共有     … buildState / fillState を URLSearchParams と往復させる
===================================================================== */
window.LH = window.LH || {};

LH.UI = (function () {
  var $ = function (id) { return document.getElementById(id); };
  var state = null;
  var whisperIndex = 0;

  function readNumber(id, fallback) {
    var el = $(id);
    var v = el ? parseFloat(el.value) : NaN;
    return isFinite(v) ? v : fallback;
  }

  /* DOM → state（入力源はここだけ） */
  function buildState() {
    var d = LH.CONFIG.DEFAULTS;
    var daily = {};
    LH.CATEGORIES.forEach(function (c) {
      daily[c.key] = readNumber('in-cat-' + c.key, d.daily[c.key] || 0);
    });
    return {
      age: readNumber('in-age', d.age),
      lifeExpectancy: readNumber('in-life', d.lifeExpectancy),
      daily: daily,
      money: {
        annualIncome: readNumber('in-income', d.money.annualIncome),
        workHoursPerDay: readNumber('in-work-hours', d.money.workHoursPerDay),
        workDaysPerYear: readNumber('in-work-days', d.money.workDaysPerYear),
      },
    };
  }

  /* CATEGORIES 配列からカテゴリー行を生成する */
  function renderCategoryInputs() {
    $('lh-categories').innerHTML = LH.CATEGORIES.map(function (c) {
      var id = 'in-cat-' + c.key;
      return '' +
        '<div class="lh-cat">' +
          '<div class="lh-cat-head">' +
            '<label for="' + id + '">' + c.label +
              '<span class="lh-cat-hint">' + c.hint + '</span>' +
            '</label>' +
            '<span class="lh-cat-input">' +
              '<input type="number" id="' + id + '" inputmode="decimal" ' +
                'min="0" max="24" step="0.5" aria-label="' + c.label + ' の1日の時間">' +
              '<span class="lh-unit">時間/日</span>' +
            '</span>' +
          '</div>' +
          '<div class="lh-cat-bar"><span id="bar-' + c.key + '"></span></div>' +
          '<div class="lh-cat-foot">' +
            '残りの人生で <strong id="out-cat-' + c.key + '">—</strong>' +
            '<span id="out-cat-' + c.key + '-h" class="lh-cat-sub"></span>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  /* state → 各入力欄へ初期値を流し込む（将来 URL 復元にも使える） */
  function fillInputs(s) {
    $('in-age').value = s.age;
    $('in-life').value = s.lifeExpectancy;
    LH.CATEGORIES.forEach(function (c) {
      $('in-cat-' + c.key).value = s.daily[c.key];
    });
    $('in-income').value = s.money.annualIncome;
    $('in-work-hours').value = s.money.workHoursPerDay;
    $('in-work-days').value = s.money.workDaysPerYear;
  }

  function setNote(id, text, warn) {
    var el = $(id);
    el.textContent = text || '';
    el.classList.toggle('is-warn', !!warn);
  }

  /* 経過率の「見た目」だけを整える（計算は一切しない）。
     ・表示する数値は LH.calc.fmt.percent(elapsedPercent) のまま
       → "35.7%" を <数値>35.7</数値><単位>%</単位> に分割してベースラインを揃える。
       （"—" や "0.01% 未満" など数字始まりでない表記はそのまま表示）
     ・下の細いバーの幅を経過率（0..1、砂時計と同じ値）に合わせる。 */
  function paintElapsed(elapsedPercent, elapsedRatio) {
    var el = $('out-elapsed-percent');
    var text = LH.calc.fmt.percent(elapsedPercent);
    var m = /^([\d,]+(?:\.[\d]+)?)(.*)$/.exec(text);
    if (m) {
      el.innerHTML =
        '<span class="lh-pct-num">' + m[1] + '</span>' +
        '<span class="lh-pct-unit">' + m[2].replace(/^\s+/, '') + '</span>';
    } else {
      el.textContent = text;
    }
    var fill = $('lh-elapsed-fill');
    if (fill) {
      var pct = LH.calc.clamp(elapsedRatio, 0, 1) * 100;
      fill.style.width = pct.toFixed(2) + '%';
    }
  }

  /* 派生値 → DOM / 砂時計（出力先はここだけ） */
  function render() {
    state = buildState();
    var r = LH.calc.compute(state);
    var f = LH.calc.fmt;
    var one = function (n) { return (Math.round(n * 10) / 10).toLocaleString('ja-JP'); };

    LH.Hourglass.update(r.progress.elapsedRatio);

    paintElapsed(r.elapsedPercent, r.progress.elapsedRatio);
    $('out-remaining-years').textContent = f.years(r.progress.remainingYears);
    $('out-remaining-hours').textContent = f.hours(r.progress.remainingHours);

    setNote(
      'note-life',
      state.lifeExpectancy <= state.age
        ? '想定寿命は、現在の年齢より大きい値を入れてください。'
        : '',
      true
    );

    LH.CATEGORIES.forEach(function (c) {
      var cd = r.daily[c.key];
      $('out-cat-' + c.key).textContent = f.years(cd.years);
      $('out-cat-' + c.key + '-h').textContent = '（' + f.hours(cd.hours) + '）';
      $('bar-' + c.key).style.width = (cd.ratioOfDay * 100) + '%';
    });

    if (r.dailyOver) {
      setNote('note-daily',
        '1日の合計が ' + one(r.dailySum) + ' 時間になっています（24時間を超えています）。',
        true);
    } else {
      setNote('note-daily',
        '1日の合計 ' + one(r.dailySum) + ' 時間　／　自由に使える時間 ' + one(r.dailyFree) + ' 時間',
        false);
    }

    $('out-hourly').textContent = f.yen(r.hourlyWage) + ' / 時間';
  }

  function cycleWhisper() {
    whisperIndex = (whisperIndex + 1) % LH.WHISPERS.length;
    var el = $('lh-whisper');
    el.style.opacity = '0';
    setTimeout(function () {
      el.textContent = LH.WHISPERS[whisperIndex];
      el.style.opacity = '1';
    }, 600);
  }

  function bindInputs() {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('input', render);
    }
  }

  function init() {
    $('lh-hg-label-top').textContent = LH.LABELS.top;
    $('lh-hg-label-bottom').textContent = LH.LABELS.bottom;
    $('lh-whisper').textContent = LH.WHISPERS[0];

    renderCategoryInputs();
    fillInputs(LH.CONFIG.DEFAULTS);
    LH.Hourglass.mount($('lh-hourglass'));
    bindInputs();
    render();

    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) setInterval(cycleWhisper, 9000);
  }

  return {
    init: init,
    render: render,
    buildState: buildState,
    fillInputs: fillInputs,
    getState: function () { return state; },
  };
})();
