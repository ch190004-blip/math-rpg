(function(app){
  const U = app.utils;

  const TYPE_META = [
    { id: 1, title: '題型一｜代入求值', slug: '代入運算', color: '#74e0ff' },
    { id: 2, title: '題型二｜式子化簡', slug: '同類項', color: '#8eff9b' },
    { id: 3, title: '題型三｜分數型化簡', slug: '通分展開', color: '#ffd66d' },
    { id: 4, title: '題型四｜情境列式', slug: '列方程式', color: '#ff8fb2' },
    { id: 5, title: '題型五｜整數解判斷', slug: '整數解', color: '#b798ff' },
    { id: 6, title: '題型六｜綜合挑戰', slug: '綜合推理', color: '#ffb96f' }
  ];

  const TYPE_NAMES = {
    1:['代入史萊姆','代入晶角史萊姆'],
    2:['化簡史萊姆','化簡晶角史萊姆'],
    3:['通分史萊姆','通分晶角史萊姆'],
    4:['列式史萊姆','列式晶角史萊姆'],
    5:['整數解史萊姆','整數解晶角史萊姆'],
    6:['綜合王史萊姆','綜合王晶角史萊姆']
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

  function fmtPoly(coeffs, vars){
    let out = '';
    let first = true;
    coeffs.forEach((c, i) => {
      if (c === 0) return;
      const v = vars[i];
      const abs = Math.abs(c);
      const sign = c >= 0 ? '+' : '−';
      if (!first) out += ` ${sign} `;
      else if (c < 0) out += '−';
      if (v) out += `${abs === 1 ? '' : abs}${v}`;
      else out += `${abs}`;
      first = false;
    });
    return out || '0';
  }

  function type1(mode){
    const cx = U.randInt(-5, 5) || 3;
    const cy = U.randInt(-5, 5) || -2;
    const cc = U.randInt(-8, 8);
    const vx = U.randInt(-4, 5);
    const vy = U.randInt(-4, 5);
    const expr = fmtPoly([cx, cy, cc], ['x', 'y', '']);
    const ans = cx * vx + cy * vy + cc;
    return makeQuestion({
      typeId: 1,
      mode,
      title: mode === 'literacy' ? '角色戰力代入' : '代入求值',
      prompt: mode === 'literacy'
        ? `某角色的戰力公式為 <b>${expr}</b>。若 <b>x = ${vx}</b>、<b>y = ${vy}</b>，請問戰力數值是多少？`
        : `已知 <b>x = ${vx}</b>、<b>y = ${vy}</b>，求二元一次式 <b>${expr}</b> 的值。`,
      feedbackLead: '把 x、y 代入，再照整數加減乘計算。',
      successText: `代入後的值是 <b>${ans}</b>。`,
      inputMode: 'numeric',
      placeholder: '請輸入整數',
      validate: intValidator(ans),
      visual: { kind:'pair-card', left:`x = ${vx}`, right:`y = ${vy}`, relation:expr }
    });
  }

  function type2(mode){
    const outA = U.randInt(2, 5) * U.choice([1, -1]);
    const outB = U.randInt(2, 5) * U.choice([1, -1]);
    const a = U.randInt(-4, 4) || 2;
    const b = U.randInt(-4, 4) || -3;
    const c = U.randInt(-4, 5);
    const d = U.randInt(-4, 4) || 1;
    const e = U.randInt(-4, 4) || 2;
    const f = U.randInt(-4, 5);
    const expr = `${outA}(${fmtPoly([a,b,c], ['x','y',''])}) ${outB >= 0 ? '+' : '−'} ${Math.abs(outB)}(${fmtPoly([d,e,f], ['x','y',''])})`;
    const finalX = outA * a + outB * d;
    const finalY = outA * b + outB * e;
    const finalC = outA * c + outB * f;
    const ask = U.choice([
      { text:'化簡後 x 的係數', answer:finalX },
      { text:'化簡後 y 的係數', answer:finalY },
      { text:'化簡後常數項', answer:finalC }
    ]);
    return makeQuestion({
      typeId: 2,
      mode,
      title: mode === 'literacy' ? '零件異動化簡' : '式子化簡',
      prompt: `${mode === 'literacy' ? '某工廠盤點後得到' : '請化簡下列式子'}：<div class="math-big">${expr}</div>請輸入<b>${ask.text}</b>。`,
      feedbackLead: '先用分配律展開，再合併同類項。',
      successText: `答案是 <b>${ask.answer}</b>。整體會化簡成 <b>${fmtPoly([finalX, finalY, finalC], ['x','y',''])}</b>。`,
      inputMode: 'numeric',
      placeholder: '請輸入整數',
      validate: intValidator(ask.answer),
      visual: { kind:'poly-cards', items:[`${outA} × 第一括號`, `${outB} × 第二括號`, ask.text] }
    });
  }

  function type3(mode){
    const m = U.choice([2, 3, 4]);
    let n = U.choice([3, 4, 5]);
    if (m === n) n = m + 1;
    const sign = U.choice([1, -1]);
    const a = U.randInt(-3, 3) || 2;
    const b = U.randInt(-3, 3) || -1;
    const c = U.randInt(-4, 4);
    const d = U.randInt(-3, 3) || 1;
    const e = U.randInt(-3, 3) || 2;
    const f = U.randInt(-4, 4);
    const L = (m * n) / U.gcd(m, n);
    const k1 = L / m;
    const k2 = L / n;
    const finalX = k1 * a + sign * k2 * d;
    const finalY = k1 * b + sign * k2 * e;
    const finalC = k1 * c + sign * k2 * f;
    const ask = U.choice([
      { text:'通分後分子中 x 的係數', answer:finalX },
      { text:'通分後分子中 y 的係數', answer:finalY },
      { text:'通分後分子中的常數項', answer:finalC }
    ]);
    return makeQuestion({
      typeId: 3,
      mode,
      title: mode === 'literacy' ? '資源報表通分' : '分數型化簡',
      prompt: `化簡 <b>(${fmtPoly([a,b,c], ['x','y',''])})/${m} ${sign > 0 ? '+' : '−'} (${fmtPoly([d,e,f], ['x','y',''])})/${n}</b> 時，請輸入<b>${ask.text}</b>。`,
      feedbackLead: `先把分母通成最小公倍數 ${L}。`,
      successText: `答案是 <b>${ask.answer}</b>，通分後分子可整理成 <b>${fmtPoly([finalX, finalY, finalC], ['x','y',''])}</b>。`,
      inputMode: 'numeric',
      placeholder: '請輸入整數',
      validate: intValidator(ask.answer),
      visual: { kind:'equation-cards', left:`LCM(${m}, ${n}) = ${L}`, right:`分子：${k1} 倍與 ${k2} 倍`, answer:`問：${ask.text}` }
    });
  }

  function type4(mode){
    const p = U.choice([12, 15, 18, 20, 24, 30]);
    const q = U.choice([16, 20, 25, 28, 35, 40]);
    const xOrY = Math.random() > 0.5 ? 'x' : 'y';
    const total = U.randInt(120, 380);
    const ans = xOrY === 'x' ? p : q;
    return makeQuestion({
      typeId: 4,
      mode,
      title: mode === 'literacy' ? '情境列式' : '列出方程式',
      prompt: mode === 'literacy'
        ? `某科技站每次「高速運算」耗用 <b>${p}</b> 單位能量，每次「備份任務」耗用 <b>${q}</b> 單位能量。若高速運算做 <b>x</b> 次、備份任務做 <b>y</b> 次，總能量為 <b>${total}</b>，請輸入方程式中 <b>${xOrY}</b> 的係數。`
        : `鉛筆一枝 ${p} 元、筆記本一本 ${q} 元。若買了 <b>x</b> 枝鉛筆與 <b>y</b> 本筆記本，共花 <b>${total}</b> 元，方程式可列成 <b>${p}x + ${q}y = ${total}</b>。請輸入 <b>${xOrY}</b> 的係數。`,
      feedbackLead: '先抓出每一次的單位量，再乘上變數。',
      successText: `答案是 <b>${ans}</b>。完整方程式為 <b>${p}x + ${q}y = ${total}</b>。`,
      inputMode: 'numeric',
      placeholder: '請輸入整數',
      validate: intValidator(ans),
      visual: { kind:'equation-cards', left:`x 的單位量：${p}`, right:`y 的單位量：${q}`, answer:`總量：${total}` }
    });
  }

  function type5(mode){
    const p = U.choice([2, 3, 4, 5]);
    const q = U.choice([3, 4, 5, 6]);
    const positiveOnly = Math.random() > 0.5;
    const total = U.randInt(18, 42);
    let count = 0;
    const pairs = [];
    for (let x = positiveOnly ? 1 : 0; x <= Math.floor(total / p); x++) {
      const remain = total - p * x;
      if (remain < 0) break;
      if (remain % q === 0) {
        const y = remain / q;
        if (positiveOnly && y < 1) continue;
        count += 1;
        pairs.push(`(${x}, ${y})`);
      }
    }
    if (count === 0) return type5(mode);
    return makeQuestion({
      typeId: 5,
      mode,
      title: mode === 'literacy' ? '整數解盤點' : '整數解判斷',
      prompt: `方程式 <b>${p}x + ${q}y = ${total}</b> 共有幾組<b>${positiveOnly ? '正整數' : '非負整數'}</b>解？`,
      feedbackLead: '依序代入 x 的可能值，再檢查 y 是否為符合條件的整數。',
      successText: `答案是 <b>${count}</b> 組；例如 ${pairs.slice(0, 4).join('、')}。`,
      inputMode: 'numeric',
      placeholder: '請輸入組數',
      validate: intValidator(count),
      visual: { kind:'equation-cards', left:`${p}x + ${q}y = ${total}`, right:positiveOnly ? 'x, y ≥ 1' : 'x, y ≥ 0', answer:'問：共有幾組？' }
    });
  }

  function type6(mode){
    const jacket = U.choice([200, 250, 300]);
    const shirt = jacket / 2;
    const totalN = U.choice([20, 30, 40, 50]);
    const soldJacket = U.choice([5, 10, 15, 20, 25, 30, 35].filter(n => n < totalN));
    const jPrice = jacket * 0.6;
    const sPrice = shirt * 0.8;
    const revenue = jPrice * soldJacket + sPrice * (totalN - soldJacket);
    const ask = U.choice(['jacket', 'shirt']);
    const answer = ask === 'jacket' ? soldJacket : (totalN - soldJacket);
    return makeQuestion({
      typeId: 6,
      mode,
      title: mode === 'literacy' ? '商店折扣綜合' : '綜合挑戰',
      prompt: `某商店把外套原價 <b>${jacket}</b> 元打 <b>6 折</b>，襯衫原價 <b>${shirt}</b> 元打 <b>8 折</b>。若兩種衣服共賣出 <b>${totalN}</b> 件，總收入為 <b>${revenue}</b> 元，請問賣出的<b>${ask === 'jacket' ? '外套' : '襯衫'}</b>有幾件？`,
      feedbackLead: '先算折後單價，再用總件數與總收入兩條關係推回數量。',
      successText: `答案是 <b>${answer}</b> 件。`,
      inputMode: 'numeric',
      placeholder: '請輸入件數',
      validate: intValidator(answer),
      visual: { kind:'equation-cards', left:`外套折後 ${jPrice} 元`, right:`襯衫折後 ${sPrice} 元`, answer:`共 ${totalN} 件 / 收入 ${revenue}` }
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
          id: `7d11_t${meta.id}_${mode}`,
          typeId: meta.id,
          name: TYPE_NAMES[meta.id][idx],
          color: meta.color,
          mode,
          modeLabel: mode === 'literacy' ? '素養題' : '課本標準題',
          aura: `${meta.slug}｜${mode === 'literacy' ? '素養題' : '標準題'}`,
          feature: mode === 'literacy' ? 'crystal' : 'plain',
          textureKey: `7d11-slime-t${meta.id}-${mode}`
        });
      });
    });
    return list;
  }

  app.data.chapter7d11 = {
    types: TYPE_META,
    slimeCatalog: createSlimeCatalog(),
    generateQuestion,
    getTypeMeta(typeId){ return TYPE_META.find(item => item.id === typeId) || TYPE_META[0]; },
    getSlimeById(slimeId){ return this.slimeCatalog.find(item => item.id === slimeId) || null; }
  };
})(window.MathRPG);
