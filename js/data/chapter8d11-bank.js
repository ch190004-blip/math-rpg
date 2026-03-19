(function(app){
  const U = app.utils;

  const TYPE_META = [
    { id: 1, title: '題型一｜基礎公差與推項', slug: '公差', color: '#78df9c' },
    { id: 2, title: '題型二｜第 n 項公式', slug: '第 n 項', color: '#77d7ff' },
    { id: 3, title: '題型三｜逆向尋找 n', slug: '反求 n', color: '#ffcd6b' },
    { id: 4, title: '題型四｜等差中項', slug: '中項', color: '#ff8db0' },
    { id: 5, title: '題型五｜生活規律應用', slug: '應用題', color: '#bc97ff' },
    { id: 6, title: '題型六｜跨項推演', slug: '跨項', color: '#ffb67a' }
  ];

  const TYPE_NAMES = {
    1:['公差史萊姆','公差晶角史萊姆'],
    2:['公式史萊姆','公式晶角史萊姆'],
    3:['項數史萊姆','項數晶角史萊姆'],
    4:['中項史萊姆','中項晶角史萊姆'],
    5:['應用史萊姆','應用晶角史萊姆'],
    6:['跨項王史萊姆','跨項王晶角史萊姆']
  };

  function makeQuestion(base){
    const q = Object.assign({
      rewardCoins: app.config.game.rewardCoins,
      rewardExp: app.config.game.rewardExp,
      placeholder: '請輸入答案',
      inputMode: 'text',
      modeLabel: base.mode === 'literacy' ? '素養題' : '標準題',
      hintCost: 5
    }, base);
    if (!q.hintText) q.hintText = q.feedbackLead || '先整理已知條件與所求。';
    return q;
  }

  function intValidator(answer){
    return (raw) => U.normalizeIntegerInput(raw) === String(answer);
  }

  function type1(mode){
    const a1 = U.randInt(-12, 15);
    let d = U.randInt(-7, 7);
    if (d === 0) d = 3;
    const a2 = a1 + d;
    const a3 = a2 + d;
    const a4 = a3 + d;
    const ask = U.choice(['d', 'a4']);
    const answer = ask === 'd' ? d : a4;
    return makeQuestion({
      typeId: 1,
      mode,
      title: mode === 'literacy' ? '規律感測列' : '基礎公差與推項',
      prompt: `${mode === 'literacy' ? '感測器連續三次資料' : '已知等差數列前三項'}為 <b>${a1}, ${a2}, ${a3}, ...</b>。請輸入${ask === 'd' ? '<b>公差 d</b>' : '<b>第 4 項</b>'}。`,
      feedbackLead: '後項減前項先找到公差，再依規律往後推。',
      successText: `答案是 <b>${answer}</b>。公差為 ${d}，第 4 項為 ${a4}。`,
      inputMode: 'numeric',
      placeholder: '請輸入整數',
      validate: intValidator(answer),
      visual: { kind:'sequence-terms', values:[a1, a2, a3, '?'], highlight:ask === 'd' ? '公差' : '第4項' }
    });
  }

  function type2(mode){
    const a1 = U.randInt(-18, 18);
    let d = U.randInt(-6, 6);
    if (d === 0) d = -3;
    const n = U.randInt(12, 35);
    const ans = a1 + (n - 1) * d;
    return makeQuestion({
      typeId: 2,
      mode,
      title: mode === 'literacy' ? '光照指數公式' : '第 n 項公式',
      prompt: `某等差數列首項 <b>a1 = ${a1}</b>、公差 <b>d = ${d}</b>。請問第 <b>${n}</b> 項是多少？`,
      feedbackLead: '直接套用 aₙ = a₁ + (n - 1)d。',
      successText: `答案是 <b>${ans}</b>。`,
      inputMode: 'numeric',
      placeholder: '請輸入整數',
      validate: intValidator(ans),
      visual: { kind:'formula-cards', items:[`a1 = ${a1}`, `d = ${d}`, `n = ${n}`] }
    });
  }

  function type3(mode){
    const a1 = U.randInt(-10, 20);
    let d = U.randInt(2, 7) * U.choice([1, -1]);
    if (d === 0) d = 4;
    const n = U.randInt(8, 28);
    const an = a1 + (n - 1) * d;
    const a2 = a1 + d;
    const a3 = a2 + d;
    return makeQuestion({
      typeId: 3,
      mode,
      title: mode === 'literacy' ? '節點定位' : '逆向尋找項數',
      prompt: `等差數列 <b>${a1}, ${a2}, ${a3}, ...</b> 中，數值 <b>${an}</b> 是第幾項？`,
      feedbackLead: '先找出公差，再用 (aₙ - a₁) ÷ d + 1。',
      successText: `答案是第 <b>${n}</b> 項。`,
      inputMode: 'numeric',
      placeholder: '請輸入項數',
      validate: intValidator(n),
      visual: { kind:'formula-cards', items:[`a1 = ${a1}`, `目標值 = ${an}`, `公差 = ${d}`] }
    });
  }

  function type4(mode){
    let a = U.randInt(-16, 24);
    let c = U.randInt(-16, 24);
    while ((a + c) % 2 !== 0 || a === c) c = U.randInt(-16, 24);
    const b = (a + c) / 2;
    return makeQuestion({
      typeId: 4,
      mode,
      title: mode === 'literacy' ? '補幀中項' : '等差中項',
      prompt: `已知 <b>${a}, x, ${c}</b> 三數成等差數列，請求出中間的 <b>x</b>。`,
      feedbackLead: '左右兩個數相加後除以 2，就是等差中項。',
      successText: `答案是 <b>${b}</b>。`,
      inputMode: 'numeric',
      placeholder: '請輸入整數',
      validate: intValidator(b),
      visual: { kind:'sequence-terms', values:[a, '?', c], highlight:'中項' }
    });
  }

  function type5(mode){
    const firstDay = U.randInt(6, 20);
    let d = U.randInt(2, 8);
    const targetDay = U.randInt(8, 20);
    const ans = firstDay + (targetDay - 1) * d;
    const story = U.choice([
      { unit:'元', name:'存錢', base:'第一天存入', diff:'每天多存' },
      { unit:'張', name:'座位排數', base:'第一排座位', diff:'每往後一排增加' },
      { unit:'點', name:'遊戲積分', base:'第一場得分', diff:'每場增加' }
    ]);
    return makeQuestion({
      typeId: 5,
      mode,
      title: mode === 'literacy' ? '規律情境' : '生活規律應用',
      prompt: `${story.name}情境中，${story.base} <b>${firstDay}${story.unit}</b>，之後${story.diff} <b>${d}${story.unit}</b>。請問第 <b>${targetDay}</b> 天/次 共有多少${story.unit}？`,
      feedbackLead: '把情境轉成首項與公差，再用第 n 項公式。',
      successText: `答案是 <b>${ans}</b>${story.unit}。`,
      inputMode: 'numeric',
      placeholder: '請輸入整數',
      validate: intValidator(ans),
      visual: { kind:'formula-cards', items:[`首項 = ${firstDay}${story.unit}`, `公差 = ${d}${story.unit}`, `第 ${targetDay} 項`] }
    });
  }

  function type6(mode){
    const a = U.randInt(-6, 10);
    const d = U.randInt(2, 6) * U.choice([1, -1]);
    let m = U.randInt(4, 8);
    let n = U.randInt(10, 16);
    if (n <= m) n = m + 5;
    const am = a + (m - 1) * d;
    const an = a + (n - 1) * d;
    const ask = U.choice(['d', 'a20', 'a1']);
    const answer = ask === 'd' ? d : ask === 'a20' ? a + 19 * d : a;
    const askText = ask === 'd' ? '公差 d' : ask === 'a20' ? '第 20 項' : '首項 a1';
    return makeQuestion({
      typeId: 6,
      mode,
      title: mode === 'literacy' ? '跨項推演' : '會考挑戰',
      prompt: `已知某等差數列第 <b>${m}</b> 項為 <b>${am}</b>，第 <b>${n}</b> 項為 <b>${an}</b>。請輸入 <b>${askText}</b>。`,
      feedbackLead: '先用兩項差值求公差，再回推出首項或其他項。',
      successText: `答案是 <b>${answer}</b>。`,
      inputMode: 'numeric',
      placeholder: '請輸入整數',
      validate: intValidator(answer),
      visual: { kind:'equation-cards', left:`a${m} = ${am}`, right:`a${n} = ${an}`, answer:`問：${askText}` }
    });
  }

  function generateQuestion(typeId, mode){
    switch (typeId) {
      case 1: return type1(mode);
      case 2: return type2(mode);
      case 3: return type3(mode);
      case 4: return type4(mode);
      case 5: return type5(mode);
      case 6: return type6(mode);
      default: return type1(mode);
    }
  }

  function createSlimeCatalog(){
    const list = [];
    TYPE_META.forEach((meta) => {
      ['standard', 'literacy'].forEach((mode, idx) => {
        list.push({
          id: `8d11_t${meta.id}_${mode}`,
          typeId: meta.id,
          name: TYPE_NAMES[meta.id][idx],
          color: meta.color,
          mode,
          modeLabel: mode === 'literacy' ? '素養題' : '課本標準題',
          aura: `${meta.slug}｜${mode === 'literacy' ? '素養題' : '標準題'}`,
          feature: mode === 'literacy' ? 'crystal' : 'plain',
          textureKey: `8d11-slime-t${meta.id}-${mode}`
        });
      });
    });
    return list;
  }

  app.data.chapter8d11 = {
    types: TYPE_META,
    slimeCatalog: createSlimeCatalog(),
    generateQuestion,
    getTypeMeta(typeId){ return TYPE_META.find(item => item.id === typeId) || TYPE_META[0]; },
    getSlimeById(slimeId){ return this.slimeCatalog.find(item => item.id === slimeId) || null; }
  };
})(window.MathRPG);
