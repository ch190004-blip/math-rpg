
(function(app){
  const state = app.state;
  const utils = app.utils;

  function stopBattleTimer(){
    if (state.battle.timerId) {
      clearInterval(state.battle.timerId);
      state.battle.timerId = null;
    }
  }

  function startBattleTimer(){
    stopBattleTimer();
    state.battle.timerId = setInterval(() => {
      state.battle.seconds += 1;
      const timer = document.getElementById('battle-timer');
      if (timer) timer.textContent = utils.formatTime(state.battle.seconds);
    }, 1000);
  }

  function renderTitle(){
    const root = document.getElementById('overlay-root');
    const authCopy = !state.authReady
      ? '<span class="loading-pulse"></span>'
      : (state.user ? '已維持登入，可直接進世界' : '請先用 Google 登入');
    root.innerHTML = `
      <div class="overlay-screen">
        <div class="title-panel soft-card">
          <section class="hero-card soft-card">
            <div>
              <div class="brand-row">
                <div class="big-logo">∑</div>
                <div>
                  <div class="badge">單一網址・沉浸式數學 RPG</div>
                  <h1 class="hero-title">Math RPG<br>七上世界入口</h1>
                </div>
              </div>
              <p class="hero-sub">
                Google 登入後，從明亮的大廳原野出發，進入七上之塔，再深入 1-1 原野與十系史萊姆交戰。
                重新整理只會回到這個入口，但登入狀態會保留。
              </p>
              <div class="hero-preview">
                <article class="preview-box">
                  <h4>大廳原野</h4>
                  <p>勇者鬥惡龍感的 top-down 草原探索，明確撞到塔門就能進入七上之塔。</p>
                </article>
                <article class="preview-box">
                  <h4>七上之塔</h4>
                  <p>像洛克人般的橫向三區塔樓，左右移動、跳躍、搭升降台選章。</p>
                </article>
                <article class="preview-box">
                  <h4>1-1 十系史萊姆</h4>
                  <p>10 題型 10 色史萊姆；頭上晶角的是素養題，答對直接領金幣與經驗。</p>
                </article>
              </div>
            </div>
            <div class="tiny">目前進度：大廳 → 七上之塔 → 1-1 原野 → 題型一到題型十史萊姆戰鬥</div>
          </section>
          <aside class="menu-card soft-card">
            <div class="menu-block">
              <div class="menu-title">世界入口</div>
              <div class="menu-copy">${authCopy}</div>
              <div class="button-stack">
                ${state.user
                  ? '<button class="primary-btn" id="enter-world-btn">進入大廳</button>'
                  : '<button class="primary-btn login-btn" id="login-btn"><span class="google-mark">G</span><span>Google 登入</span></button>'}
                <button class="secondary-btn" id="offline-btn">離線試玩</button>
              </div>
            </div>

            <div class="menu-block">
              <div class="menu-title">目前規則</div>
              <div class="status-list">
                <div class="status-item"><span>網址</span><strong>固定只有 index.html</strong></div>
                <div class="status-item"><span>重新整理</span><strong>回世界入口</strong></div>
                <div class="status-item"><span>登入狀態</span><strong>保留，不自動登出</strong></div>
                <div class="status-item"><span>1-1 內容</span><strong>10 題型史萊姆已接上</strong></div>
                <div class="status-item"><span>速度</span><strong>測試版 2 倍移動</strong></div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;

    const loginBtn = document.getElementById('login-btn');
    const enterBtn = document.getElementById('enter-world-btn');
    const offlineBtn = document.getElementById('offline-btn');

    if (loginBtn) loginBtn.onclick = () => app.services.firebase.signIn();
    if (enterBtn) enterBtn.onclick = () => app.runtime.enterWorld();
    if (offlineBtn) offlineBtn.onclick = () => {
      if (!state.user) {
        state.user = { uid: 'offline-user', displayName: '離線旅人', email: '' };
      }
      app.runtime.enterWorld();
    };
  }

  function gradientColor(hex){
    return `radial-gradient(circle at 35% 25%, rgba(255,255,255,.32), transparent 20%), linear-gradient(180deg, ${hex}, ${hex})`;
  }

  function slimeAccessory(slime){
    if (!slime || slime.mode !== 'literacy') return '';
    return '<div class="slime-crystal"></div>';
  }

  function renderVisual(q){
    if (!q.visual) return '';
    const v = q.visual;

    if (v.kind === 'relative-track') {
      const min = Math.min(v.baseline, v.actual) - 4;
      const max = Math.max(v.baseline, v.actual) + 4;
      const baseLeft = ((v.baseline - min) / (max - min)) * 100;
      const actualLeft = ((v.actual - min) / (max - min)) * 100;
      return `
        <div class="visual-box">
          <div class="visual-title">相對基線示意</div>
          <div class="numberline">
            <div class="nl-track">
              <div class="nl-point gold" style="left:${baseLeft}%"></div>
              <div class="nl-point blue" style="left:${actualLeft}%"></div>
              <div class="nl-label" style="left:${baseLeft}%">${v.baselineLabel}<br><b>${v.baseline}</b></div>
              <div class="nl-label" style="left:${actualLeft}%">${v.actualLabel}<br><b>${v.actual}</b></div>
            </div>
          </div>
        </div>
      `;
    }

    if (v.kind === 'delta-cards') {
      return `
        <div class="visual-box visual-grid two">
          <div class="visual-card"><span>基準</span><b>${v.base}</b></div>
          <div class="visual-card"><span>實際</span><b>${v.actual}</b></div>
        </div>
      `;
    }

    if (v.kind === 'two-point-line') {
      const min = v.left - 3;
      const max = v.right + 3;
      const leftPos = ((v.left - min) / (max - min)) * 100;
      const rightPos = ((v.right - min) / (max - min)) * 100;
      const zeroPos = ((0 - min) / (max - min)) * 100;
      return `
        <div class="visual-box">
          <div class="visual-title">數線位置示意</div>
          <div class="numberline">
            <div class="nl-track">
              <div class="nl-point silver" style="left:${zeroPos}%"></div>
              <div class="nl-point gold" style="left:${leftPos}%"></div>
              <div class="nl-point blue" style="left:${rightPos}%"></div>
              <div class="nl-label" style="left:${leftPos}%">A<br><b>${v.left}</b></div>
              <div class="nl-label" style="left:${zeroPos}%">O<br><b>0</b></div>
              <div class="nl-label" style="left:${rightPos}%">B<br><b>${v.right}</b></div>
            </div>
          </div>
        </div>
      `;
    }

    if (v.kind === 'segment-divisions') {
      const points = [];
      for (let i = 0; i <= v.segments; i++) {
        const left = (i / v.segments) * 100;
        points.push(`<div class="segment-mark ${i === v.targetIndex ? 'target' : ''}" style="left:${left}%"></div>`);
      }
      return `
        <div class="visual-box">
          <div class="visual-title">等分示意圖</div>
          <div class="segment-visual">
            <div class="segment-line">${points.join('')}</div>
            <div class="segment-labels">
              <span>${v.left}</span>
              <span>目標：第 ${v.targetIndex} 個等分點</span>
              <span>${v.right}</span>
            </div>
          </div>
        </div>
      `;
    }

    if (v.kind === 'compare-cards') {
      return `
        <div class="visual-box visual-grid three">
          ${v.items.map(item => `<div class="visual-card"><span>${item.label}</span><b>${item.value}</b></div>`).join('')}
        </div>
      `;
    }

    if (v.kind === 'fraction-compare') {
      return `
        <div class="visual-box visual-grid two">
          <div class="visual-card big"><span>左式</span><b>${v.left}</b></div>
          <div class="visual-card big"><span>右式</span><b>${v.right}</b></div>
        </div>
      `;
    }

    if (v.kind === 'mirror-points') {
      return `
        <div class="visual-box">
          <div class="visual-title">原點對稱示意</div>
          <div class="numberline">
            <div class="nl-track">
              <div class="nl-point gold" style="left:22%"></div>
              <div class="nl-point silver" style="left:50%"></div>
              <div class="nl-point blue" style="left:78%"></div>
              <div class="nl-label" style="left:22%">相反數</div>
              <div class="nl-label" style="left:50%">O</div>
              <div class="nl-label" style="left:78%">x</div>
            </div>
          </div>
        </div>
      `;
    }

    if (v.kind === 'absolute-range') {
      return `
        <div class="visual-box">
          <div class="visual-title">距離限制示意</div>
          <div class="range-visual">
            <div class="range-track"></div>
            <div class="range-highlight"></div>
            <div class="range-mark left">${v.inclusive ? '≤' : '<'} ${v.limit}</div>
            <div class="range-mark center">0</div>
            <div class="range-mark right">${v.inclusive ? '≤' : '<'} ${v.limit}</div>
          </div>
        </div>
      `;
    }

    if (v.kind === 'hidden-distance-line') {
      const positions = Object.entries(v.points);
      const values = positions.map(item => item[1]);
      const min = Math.min(...values) - 2;
      const max = Math.max(...values) + 2;
      return `
        <div class="visual-box">
          <div class="visual-title">只看位置，不透露距離數值</div>
          <div class="numberline">
            <div class="nl-track">
              ${positions.map(([key, value]) => {
                const left = ((value - min) / (max - min)) * 100;
                return `<div class="nl-point ${key === 'A' ? 'gold' : 'blue'}" style="left:${left}%"></div><div class="nl-label" style="left:${left}%">${key}</div>`;
              }).join('')}
              <div class="nl-point silver" style="left:${((0 - min) / (max - min)) * 100}%"></div>
              <div class="nl-label" style="left:${((0 - min) / (max - min)) * 100}%">O</div>
            </div>
          </div>
        </div>
      `;
    }

    if (v.kind === 'pair-card') {
      return `
        <div class="visual-box visual-grid three">
          <div class="visual-card"><span>條件一</span><b>${v.left}</b></div>
          <div class="visual-card"><span>條件二</span><b>${v.right}</b></div>
          <div class="visual-card"><span>關係</span><b>${v.relation}</b></div>
        </div>
      `;
    }

    return '';
  }

  async function checkAnswer(){
    if (state.battle.inputLocked) return;
    const q = state.battle.currentQuestion;
    const input = document.getElementById('battle-answer');
    const feedback = document.getElementById('battle-feedback');
    const raw = input ? input.value : '';
    if (!raw || !raw.trim()) {
      if (feedback) feedback.innerHTML = '請先輸入答案。';
      return;
    }
    if (!q || typeof q.validate !== 'function') return;

    if (q.validate(raw)) {
      state.battle.inputLocked = true;
      if (feedback) feedback.innerHTML = `<span class="ok">答對了！</span> ${q.successText}`;
      await app.services.firebase.addReward(q.rewardCoins, q.rewardExp);
      app.ui.toast(`獲得 ${q.rewardCoins} 金幣、${q.rewardExp} EXP`, 'good');
      setTimeout(() => app.runtime.closeBattle(true), 900);
    } else {
      if (feedback) feedback.innerHTML = `<span class="bad">再試一次。</span> ${q.feedbackLead}`;
      if (input) input.select();
    }
  }

  function renderBattle(){
    const battle = state.currentBattle;
    if (!battle) return;
    const q = state.battle.currentQuestion || app.data.chapter11.generateQuestion(battle.typeId, battle.mode, battle.slime);
    state.battle.currentQuestion = q;
    const typeMeta = app.data.chapter11.getTypeMeta(battle.typeId);
    const root = document.getElementById('overlay-root');

    root.innerHTML = `
      <div class="battle-overlay">
        <div class="battle-shell soft-card">
          <section class="battle-left soft-card">
            <div class="slime-stage">
              <div class="slime-blob" style="background:${gradientColor(battle.slime.color)}">
                ${slimeAccessory(battle.slime)}
                <div class="slime-face">
                  <div class="eye left"></div>
                  <div class="eye right"></div>
                  <div class="smile"></div>
                </div>
              </div>
            </div>
            <div>
              <div class="badge">${typeMeta.title}</div>
              <h3 style="margin-top:.8rem;font-size:1.25rem">${battle.slime.name}</h3>
              <p class="tiny" style="margin-top:.45rem;line-height:1.9">${battle.slime.aura}・一題一戰・答對離場</p>
            </div>
            <div class="battle-mini">
              <div class="mini-item"><span>模式</span><strong>${battle.mode === 'literacy' ? '素養題' : '課本標準題'}</strong></div>
              <div class="mini-item"><span>計時</span><strong id="battle-timer">${utils.formatTime(state.battle.seconds)}</strong></div>
              <div class="mini-item"><span>獎勵</span><strong>💰 ${q.rewardCoins} / EXP ${q.rewardExp}</strong></div>
              <div class="mini-item"><span>顏色</span><strong>${typeMeta.slug}</strong></div>
            </div>
          </section>

          <section class="battle-right soft-card">
            <div class="battle-head">
              <div>
                <div class="badge">${q.title}</div>
                <div class="battle-title" style="margin-top:.55rem">答對就回到 1-1 原野</div>
              </div>
              <div class="mode-lock">${battle.mode === 'literacy' ? '素養題' : '標準題'}</div>
            </div>

            <div class="question-card">
              ${q.prompt}
              ${renderVisual(q)}
            </div>

            <div class="feedback" id="battle-feedback">${q.feedbackLead}</div>

            <div>
              <div class="answer-row">
                <div>
                  <label for="battle-answer">輸入答案</label>
                  <input id="battle-answer" class="answer-input" placeholder="${q.placeholder || '請輸入答案'}" inputmode="${q.inputMode || 'text'}" autocomplete="off" />
                </div>
                <button class="primary-btn" id="submit-answer-btn">作答</button>
              </div>

              <div class="footer-actions" style="margin-top:1rem">
                <div class="tiny">此戰鬥不提供換題，也不能切換標準題或素養題。</div>
                <button class="secondary-btn" id="retreat-battle-btn">撤退回原野</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    const answerInput = document.getElementById('battle-answer');
    document.getElementById('submit-answer-btn').onclick = checkAnswer;
    document.getElementById('retreat-battle-btn').onclick = () => app.runtime.closeBattle(false);

    if (answerInput) {
      answerInput.focus();
      answerInput.onkeydown = (event) => {
        if (event.key === 'Enter') checkAnswer();
      };
    }

    startBattleTimer();
  }

  app.ui.renderOverlay = function(){
    if (state.overlay === 'title') {
      stopBattleTimer();
      renderTitle();
      return;
    }
    if (state.overlay === 'battle') {
      renderBattle();
      return;
    }
    stopBattleTimer();
    document.getElementById('overlay-root').innerHTML = '';
  };

  app.ui.renderAll = function(){
    app.ui.renderHUD();
    app.ui.renderOverlay();
    app.ui.renderTouch();
  };

  app.ui.openBattle = function(context){
    state.currentBattle = context;
    state.overlay = 'battle';
    state.battle.rewarded = false;
    state.battle.seconds = 0;
    state.battle.inputLocked = false;
    if (!state.battle.currentQuestion) {
      state.battle.currentQuestion = app.data.chapter11.generateQuestion(context.typeId, context.mode, context.slime);
    }
    app.ui.renderAll();
  };

  app.ui.closeBattleOverlay = function(){
    stopBattleTimer();
    state.currentBattle = null;
    state.battle.currentQuestion = null;
    state.battle.inputLocked = false;
    state.overlay = 'none';
    app.ui.renderAll();
  };
})(window.MathRPG);
