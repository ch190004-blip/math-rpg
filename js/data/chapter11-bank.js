
(function(app){
  const U = app.utils;

  const TYPE_META = [
    { id: 1, title: '題型一｜相反意義的量(一)', slug: '基準差值', color: '#6ddf8f' },
    { id: 2, title: '題型二｜相反意義的量(二)', slug: '增減表徵', color: '#57d0ff' },
    { id: 3, title: '題型三｜數線坐標與距離', slug: '距離判讀', color: '#8d8cff' },
    { id: 4, title: '題型四｜數線與等分點', slug: '等分分點', color: '#ffcf63' },
    { id: 5, title: '題型五｜數的大小比較(一)', slug: '整數小數比較', color: '#ff8ca7' },
    { id: 6, title: '題型六｜數的大小比較(二)', slug: '負分數比較', color: '#66ddb6' },
    { id: 7, title: '題型七｜相反數解碼', slug: '相反數', color: '#9be15b' },
    { id: 8, title: '題型八｜絕對值運算範圍', slug: '整數解範圍', color: '#ffa86a' },
    { id: 9, title: '題型九｜圖解絕對值距離', slug: '圖解判斷', color: '#c98bff' },
    { id: 10, title: '題型十｜綜合挑戰', slug: '絕對值綜合', color: '#70e1d7' }
  ];

  const TYPE_NAMES = {
    1: ['晨露史萊姆', '晨露晶角史萊姆'],
    2: ['盈虧史萊姆', '盈虧晶角史萊姆'],
    3: ['座標史萊姆', '座標晶角史萊姆'],
    4: ['分點史萊姆', '分點晶角史萊姆'],
    5: ['排序史萊姆', '排序晶角史萊姆'],
    6: ['負分數史萊姆', '負分數晶角史萊姆'],
    7: ['鏡像史萊姆', '鏡像晶角史萊姆'],
    8: ['絕對值史萊姆', '絕對值晶角史萊姆'],
    9: ['圖解史萊姆', '圖解晶角史萊姆'],
    10: ['綜合王史萊姆', '綜合王晶角史萊姆']
  };

  const AURAS = {
    standard: '課本標準題',
    literacy: '素養情境題'
  };

  function slugLabel(typeId){
    const meta = TYPE_META.find(item => item.id === typeId);
    return meta ? `${meta.title}｜${meta.slug}` : '1-1 題型';
  }

  function makeQuestion(base){
    return Object.assign({
      rewardCoins: app.config.game.rewardCoins,
      rewardExp: app.config.game.rewardExp,
      placeholder: '請輸入答案',
      inputMode: 'text',
      modeLabel: base.mode === 'literacy' ? '素養題' : '標準題'
    }, base);
  }

  function integerValidator(answer){
    return (raw) => {
      const value = U.normalizeIntegerInput(raw);
      return value !== null && value === String(answer);
    };
  }

  function choiceValidator(answer){
    return (raw) => U.normalizeChoiceInput(raw) === String(answer).toUpperCase();
  }

  function rationalValidator(num, den){
    const right = U.reduceFraction(num, den);
    return (raw) => {
      const parsed = U.parseRational(raw);
      return U.rationalEqual(parsed, right);
    };
  }

  function symbolValidator(answer){
    return (raw) => {
      const value = U.normalizeChoiceInput(raw).replace(/＝/g, '=');
      return value === answer;
    };
  }

  function range(min, max){
    const list = [];
    for (let i = min; i <= max; i++) list.push(i);
    return list;
  }

  function type1(mode){
    const scenarios = mode === 'literacy'
      ? [
          { unit: '噸', baseLabel: '標準艙位', actualLabel: '本日艙位', story: '星際貨運倉位', verbHigh: '超出', verbLow: '不足' },
          { unit: '度', baseLabel: '安全溫度', actualLabel: '感測讀值', story: '冷凍艙溫控', verbHigh: '高於', verbLow: '低於' },
          { unit: '點', baseLabel: '基礎評級', actualLabel: '當前評級', story: '電競積分站', verbHigh: '高於', verbLow: '低於' }
        ]
      : [
          { unit: '分', baseLabel: '平均分數', actualLabel: '學生分數', story: '測驗基準差值', verbHigh: '多', verbLow: '少' },
          { unit: '箱', baseLabel: '安全存量', actualLabel: '今日盤點', story: '倉庫補貨標準', verbHigh: '多', verbLow: '少' },
          { unit: '公分', baseLabel: '身高基準', actualLabel: '量測結果', story: '量測相對值', verbHigh: '高', verbLow: '低' }
        ];
    const sc = U.choice(scenarios);
    const base = U.randInt(58, 92);
    const diff = (Math.random() > 0.5 ? 1 : -1) * U.randInt(3, 16);
    const actual = base + diff;
    const askWord = mode === 'literacy' ? '系統應顯示什麼整數訊號' : '紀錄表應記為什麼整數';
    return makeQuestion({
      typeId: 1,
      mode,
      title: sc.story,
      prompt: `${sc.baseLabel}設為 <b>${base}</b>${sc.unit} 並記為 <b>0</b>。若${sc.actualLabel}為 <b>${actual}</b>${sc.unit}，${askWord}？`,
      feedbackLead: `先判斷 <b>${actual}</b> 是比基準 <b>${base}</b> ${actual > base ? sc.verbHigh : sc.verbLow}。`,
      successText: `${actual} 與 ${base} 的差是 <b>${diff > 0 ? '+' : ''}${diff}</b>，所以答案是 <b>${diff}</b>。`,
      placeholder: '例如 -8、+5、3',
      inputMode: 'numeric',
      validate: integerValidator(diff),
      visual: {
        kind: 'relative-track',
        baseline: base,
        actual,
        baselineLabel: sc.baseLabel,
        actualLabel: sc.actualLabel
      }
    });
  }

  function type2(mode){
    const base = U.randInt(40, 88);
    const diff = (Math.random() > 0.5 ? 1 : -1) * U.randInt(2, 15);
    const finalValue = base + diff;
    const scenarios = mode === 'literacy'
      ? [
          `遊戲系統以 <b>${base}</b> 點作為起始能量值，勇者目前能量為 <b>${finalValue}</b> 點。相對基準值應顯示多少？`,
          `太空站把 <b>${base}</b> 箱物資視為安全線，目前剩下 <b>${finalValue}</b> 箱，狀態欄應顯示什麼整數？`
        ]
      : [
          `以 <b>${base}</b> 為基準 0。若某數量是 <b>${finalValue}</b>，請寫出相對基準的整數表示。`,
          `教室把 <b>${base}</b> 本參考書記作 0。若現在有 <b>${finalValue}</b> 本，請問應記成什麼整數？`
        ];
    return makeQuestion({
      typeId: 2,
      mode,
      title: mode === 'literacy' ? '增減狀態欄' : '增減表徵',
      prompt: U.choice(scenarios),
      feedbackLead: '先算實際值和基準值的差，再決定正負號。',
      successText: `${finalValue} − ${base} = <b>${diff}</b>，所以相對整數是 <b>${diff}</b>。`,
      placeholder: '請輸入整數',
      inputMode: 'numeric',
      validate: integerValidator(diff),
      visual: {
        kind: 'delta-cards',
        base,
        actual: finalValue
      }
    });
  }

  function type3(mode){
    const left = -U.randInt(3, 12);
    const right = U.randInt(2, 11);
    const distance = right - left;
    const pA = mode === 'literacy' ? '敵方據點 A' : 'A 點';
    const pB = mode === 'literacy' ? '補給基地 B' : 'B 點';
    return makeQuestion({
      typeId: 3,
      mode,
      title: mode === 'literacy' ? '直線座標航道' : '數線兩點距離',
      prompt: `${pA} 在數線座標 <b>${left}</b>，${pB} 在數線座標 <b>${right}</b>。兩點之間的距離是多少單位長？`,
      feedbackLead: '距離是兩點坐標差的絕對值。',
      successText: `|${right} − (${left})| = <b>${distance}</b>。`,
      placeholder: '請輸入正整數',
      inputMode: 'numeric',
      validate: integerValidator(distance),
      visual: {
        kind: 'two-point-line',
        left,
        right,
        labels: ['A', 'B']
      }
    });
  }

  function type4(mode){
    const A = U.randInt(1, 8);
    const N = U.choice([3, 4, 5, 8, 10]);
    const k = U.randInt(1, N - 1);
    const fromLeft = Math.random() > 0.5;
    const left = -(A + 1);
    const right = -A;
    const num = fromLeft ? (left * N + k) : (right * N - k);
    const den = N;
    const ans = U.reduceFraction(num, den);
    const fromLabel = fromLeft ? `${left}` : `${right}`;
    const sideWord = fromLeft ? '左端' : '右端';
    const goalWord = mode === 'literacy' ? '探測艇所在深度' : '等分點坐標';
    return makeQuestion({
      typeId: 4,
      mode,
      title: mode === 'literacy' ? '聲納等分點' : '數線等分點',
      prompt: `把數線上 <b>${left}</b> 到 <b>${right}</b> 之間平均分成 <b>${N}</b> 等分。從${sideWord} <b>${fromLabel}</b> 開始數，第 <b>${k}</b> 個等分點代表的數是多少？`,
      feedbackLead: `每一段是 <b>1/${N}</b>，從 ${fromLabel} 再移動 ${k} 段。`,
      successText: `答案可寫成 <b>${U.rationalToString(ans.num, ans.den)}</b>。`,
      placeholder: '可輸入 -9/4、-2 1/4、-2.25',
      inputMode: 'text',
      validate: rationalValidator(ans.num, ans.den),
      visual: {
        kind: 'segment-divisions',
        left,
        right,
        segments: N,
        targetIndex: fromLeft ? k : N - k,
        caption: goalWord
      }
    });
  }

  function type5(mode){
    const int1 = -U.randInt(4, 9);
    const dec = Number((int1 + (U.randInt(2, 8) / 10)).toFixed(1));
    const pos = U.randInt(1, 6);
    const vars = [
      { key: 'a', value: dec, show: dec.toFixed(1) },
      { key: 'b', value: int1, show: String(int1) },
      { key: 'c', value: pos, show: String(pos) }
    ];
    vars.sort(() => Math.random() - 0.5);
    const askMax = Math.random() > 0.5;
    const sorted = [...vars].sort((x, y) => askMax ? y.value - x.value : x.value - y.value);
    const answer = sorted[0].key.toUpperCase();
    return makeQuestion({
      typeId: 5,
      mode,
      title: mode === 'literacy' ? '溫度比較' : '數的大小比較',
      prompt: `已知 <b>a = ${vars.find(v => v.key === 'a').show}</b>、<b>b = ${vars.find(v => v.key === 'b').show}</b>、<b>c = ${vars.find(v => v.key === 'c').show}</b>。請問三者之中，哪一個變數的值最<b>${askMax ? '大' : '小'}</b>？請輸入 <b>A / B / C</b>。`,
      feedbackLead: '先判斷正數、負數，再比較負數之間的大小。',
      successText: `答案是 <b>${answer}</b>。對應的數值為 <b>${sorted[0].show}</b>。`,
      placeholder: '輸入 A、B 或 C',
      inputMode: 'text',
      validate: choiceValidator(answer),
      visual: {
        kind: 'compare-cards',
        items: vars.map(v => ({ label: v.key.toUpperCase(), value: v.show }))
      }
    });
  }

  function type6(mode){
    let d1 = U.randInt(3, 9), d2 = U.randInt(3, 9);
    while (d2 === d1) d2 = U.randInt(3, 9);
    const n1 = U.randInt(1, d1 - 1);
    let n2 = Math.floor((n1 / d1) * d2);
    if (n2 <= 0) n2 = 1;
    if (n2 >= d2) n2 = d2 - 1;
    if (n1 * d2 === n2 * d1) n2 = n2 > 1 ? n2 - 1 : n2 + 1;
    const v1 = -n1 / d1;
    const v2 = -n2 / d2;
    const answer = v1 > v2 ? '>' : '<';
    return makeQuestion({
      typeId: 6,
      mode,
      title: mode === 'literacy' ? '冷卻液溫度比較' : '負分數比較',
      prompt: `比較兩數大小：<div class="big-choice">−${n1}/${d1}　[　　]　−${n2}/${d2}</div>請輸入 <b>&gt;</b> 或 <b>&lt;</b>。`,
      feedbackLead: '負分數的絕對值愈大，實際值反而愈小。',
      successText: `答案是 <b>${answer}</b>。`,
      placeholder: '輸入 > 或 <',
      inputMode: 'text',
      validate: symbolValidator(answer),
      visual: {
        kind: 'fraction-compare',
        left: `-${n1}/${d1}`,
        right: `-${n2}/${d2}`
      }
    });
  }

  function type7(mode){
    const useFraction = Math.random() > 0.5;
    let answerNum = 0;
    let answerDen = 1;
    let display = '';
    if (useFraction) {
      const den = U.choice([2, 3, 4, 5]);
      let num = U.randInt(1, den * 2 - 1);
      if (num % den === 0) num += 1;
      answerNum = num;
      answerDen = den;
      display = `−${U.rationalToString(num, den)}`;
    } else {
      answerNum = U.randInt(2, 9);
      answerDen = 1;
      display = `−${answerNum}`;
    }
    const askDistance = Math.random() > 0.5;
    const distanceNum = answerNum * 2;
    const distanceDen = answerDen;
    return makeQuestion({
      typeId: 7,
      mode,
      title: mode === 'literacy' ? '鏡像反轉數據' : '相反數解碼',
      prompt: askDistance
        ? `已知 <b>x</b> 的相反數是 <b>${display}</b>。請問 <b>x</b> 與它的相反數在數線上的距離是多少？`
        : `已知 <b>x</b> 的相反數是 <b>${display}</b>。請問 <b>x</b> = ?`,
      feedbackLead: askDistance ? '先找出 x，再算兩個對稱點的距離。' : '相反數只改變符號，數字部分不變。',
      successText: askDistance
        ? `距離是兩個絕對值相加，所以答案是 <b>${U.rationalToString(distanceNum, distanceDen)}</b>。`
        : `把負號改成正號即可，答案是 <b>${U.rationalToString(answerNum, answerDen)}</b>。`,
      placeholder: askDistance ? '可輸入 4、3/2、1 1/2' : '可輸入 3、5/2、2 1/2',
      inputMode: 'text',
      validate: askDistance ? rationalValidator(distanceNum, distanceDen) : rationalValidator(answerNum, answerDen),
      visual: {
        kind: 'mirror-points',
        leftNum: -answerNum,
        leftDen: answerDen,
        rightNum: answerNum,
        rightDen: answerDen
      }
    });
  }

  function type8(mode){
    const limit = U.randInt(4, 11);
    const inclusive = Math.random() > 0.5;
    const maxInt = inclusive ? limit : limit - 1;
    const count = maxInt * 2 + 1;
    const ask = U.choice(['count', 'max', 'min']);
    const answer = ask === 'count' ? count : ask === 'max' ? maxInt : -maxInt;
    const askText = ask === 'count' ? '共有幾個整數解' : ask === 'max' ? '最大整數解是多少' : '最小整數解是多少';
    return makeQuestion({
      typeId: 8,
      mode,
      title: mode === 'literacy' ? '安全巡航範圍' : '絕對值整數解',
      prompt: `若整數 <b>a</b> 滿足 <b>|a| ${inclusive ? '≤' : '<'} ${limit}</b>，請問符合條件的 <b>${askText}</b>？`,
      feedbackLead: '絕對值表示到原點的距離，先找左右最遠可到哪裡。',
      successText: `答案是 <b>${answer}</b>。`,
      placeholder: '請輸入整數',
      inputMode: 'numeric',
      validate: integerValidator(answer),
      visual: {
        kind: 'absolute-range',
        limit,
        inclusive
      }
    });
  }

  function type9(mode){
    const layouts = [
      { points: { A: 2, B: 7, C: -9, D: -4 }, origin: 0 },
      { points: { A: 1, B: 6, C: -8, D: -3 }, origin: 0 },
      { points: { A: 3, B: 9, C: -10, D: -5 }, origin: 0 }
    ];
    const layout = U.choice(layouts);
    const askNear = Math.random() > 0.5;
    const ranked = Object.entries(layout.points)
      .sort((a, b) => askNear ? Math.abs(a[1]) - Math.abs(b[1]) : Math.abs(b[1]) - Math.abs(a[1]));
    const answer = ranked[0][0];
    return makeQuestion({
      typeId: 9,
      mode,
      title: mode === 'literacy' ? '航線投放點' : '圖解絕對值距離',
      prompt: `${askNear ? '哪一個點' : '哪一個點'}距離原點 <b>O</b> 最<b>${askNear ? '近' : '遠'}</b>？請輸入 <b>A / B / C / D</b>。`,
      feedbackLead: '絕對值就是到原點 O 的距離。',
      successText: `答案是 <b>${answer}</b>。`,
      placeholder: '輸入 A、B、C 或 D',
      inputMode: 'text',
      validate: choiceValidator(answer),
      visual: {
        kind: 'hidden-distance-line',
        points: layout.points,
        askNear
      }
    });
  }

  function type10(mode){
    const valX = U.randInt(3, 8);
    const valY = U.randInt(9, 16);
    const greater = Math.random() > 0.5;
    const aVals = [valX, -valX];
    const bVals = [valY, -valY];
    const valid = [];
    aVals.forEach((a) => {
      bVals.forEach((b) => {
        if ((greater && a > b) || (!greater && a < b)) {
          valid.push({ a, b, sum: a + b });
        }
      });
    });
    const sums = [...new Set(valid.map(item => item.sum))].sort((a, b) => a - b);
    const ask = U.choice(['max', 'min', 'count']);
    const answer = ask === 'max' ? Math.max(...sums) : ask === 'min' ? Math.min(...sums) : sums.length;
    const askText = ask === 'max' ? '最大可能值' : ask === 'min' ? '最小可能值' : '共有幾種不同可能值';
    return makeQuestion({
      typeId: 10,
      mode,
      title: mode === 'literacy' ? '雙星極端溫度' : '絕對值綜合',
      prompt: `已知 <b>|a| = ${valX}</b>、<b>|b| = ${valY}</b>，且 <b>a ${greater ? '>' : '<'} b</b>。請問 <b>a + b</b> 的 <b>${askText}</b> 是多少？`,
      feedbackLead: '先列出 a、b 的可能值，再用 a 和 b 的大小關係刪掉不合條件的組合。',
      successText: `答案是 <b>${answer}</b>。`,
      placeholder: '請輸入整數',
      inputMode: 'numeric',
      validate: integerValidator(answer),
      visual: {
        kind: 'pair-card',
        left: `|a| = ${valX}`,
        right: `|b| = ${valY}`,
        relation: `a ${greater ? '>' : '<'} b`
      }
    });
  }

  function generateQuestion(typeId, mode, slime){
    switch (typeId) {
      case 1: return type1(mode, slime);
      case 2: return type2(mode, slime);
      case 3: return type3(mode, slime);
      case 4: return type4(mode, slime);
      case 5: return type5(mode, slime);
      case 6: return type6(mode, slime);
      case 7: return type7(mode, slime);
      case 8: return type8(mode, slime);
      case 9: return type9(mode, slime);
      case 10: return type10(mode, slime);
      default: return type1(mode, slime);
    }
  }

  function createSlimeCatalog(){
    const list = [];
    TYPE_META.forEach((meta) => {
      ['standard', 'literacy'].forEach((mode, idx) => {
        const names = TYPE_NAMES[meta.id];
        list.push({
          id: `11_t${meta.id}_${mode}`,
          typeId: meta.id,
          name: names[idx],
          color: meta.color,
          mode,
          modeLabel: AURAS[mode],
          aura: `${meta.slug}｜${AURAS[mode]}`,
          feature: mode === 'literacy' ? 'crystal' : 'plain',
          textureKey: `slime-t${meta.id}-${mode}`
        });
      });
    });
    return list;
  }

  app.data.chapter11 = {
    types: TYPE_META,
    slimeCatalog: createSlimeCatalog(),
    generateQuestion,
    getTypeMeta(typeId){
      return TYPE_META.find(item => item.id === typeId);
    },
    getSlimeById(slimeId){
      return this.slimeCatalog.find(item => item.id === slimeId);
    },
    slugLabel
  };
})(window.MathRPG);
