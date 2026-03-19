(function(app){
  const state = app.state;
  const utils = app.utils;
  const world = () => app.data.world;

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

  function gradientColor(color){
    return `linear-gradient(180deg, ${color} 0%, rgba(255,255,255,.35) 8%, ${color} 100%)`;
  }

  function slimeAccessory(slime){
    if (slime?.feature === 'crystal') return '<div class="slime-crystal"></div>';
    return '';
  }

  function svgNumberLine(points, opts={}){
    const labelsTop = opts.labelsTop !== false;
    const labelsBottom = opts.labelsBottom !== false;
    const pad = 42;
    const width = 760;
    const height = 150;
    const minV = Math.min(...points.map(p => p.value));
    const maxV = Math.max(...points.map(p => p.value));
    const span = Math.max(1, maxV - minV);
    const scale = (value) => pad + ((value - minV) / span) * (width - pad * 2);

    const labelTopY = 34;
    const lineY = 78;
    const labelBottomY = 122;
    const pointEls = points.map((p) => {
      const x = scale(p.value);
      const size = p.size || 12;
      const stroke = p.stroke || '#ffffff';
      const fill = p.fill || '#ffd55d';
      const topText = p.topText || '';
      const bottomText = p.bottomText || '';
      return `
        ${labelsTop && topText ? `<text x="${x}" y="${labelTopY}" text-anchor="middle" class="svg-label top">${topText}</text>` : ''}
        <circle cx="${x}" cy="${lineY}" r="${size}" fill="${fill}" stroke="${stroke}" stroke-width="4"></circle>
        ${labelsBottom && bottomText ? `<text x="${x}" y="${labelBottomY}" text-anchor="middle" class="svg-label bottom">${bottomText}</text>` : ''}
      `;
    }).join('');

    return `
      <svg class="battle-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1="${pad}" y1="${lineY}" x2="${width - pad}" y2="${lineY}" class="svg-track"></line>
        ${pointEls}
      </svg>
    `;
  }

  function svgSegmentLine(segments, targetIndex, leftLabel, rightLabel){
    const width = 760;
    const height = 140;
    const pad = 52;
    const y = 66;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const x = pad + (i / segments) * (width - pad * 2);
      const big = i === targetIndex;
      points.push(`
        <circle cx="${x}" cy="${y}" r="${big ? 13 : 8}" class="${big ? 'svg-point target' : 'svg-point'}"></circle>
      `);
    }
    return `
      <svg class="battle-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}" class="svg-track"></line>
        ${points.join('')}
        <text x="${pad}" y="118" text-anchor="middle" class="svg-label bottom">${leftLabel}</text>
        <text x="${width/2}" y="28" text-anchor="middle" class="svg-label top">第 ${targetIndex} 個等分點</text>
        <text x="${width - pad}" y="118" text-anchor="middle" class="svg-label bottom">${rightLabel}</text>
      </svg>
    `;
  }

  function renderVisual(q){
    const v = q.visual;
    if (!v) return '';

    if (v.kind === 'relative-track') {
      return `
        <div class="visual-box">
          <div class="visual-title">相對位置示意</div>
          <div class="visual-copy">只標基準點與目前點，不再直接標出差值，避免把答案畫出來。</div>
          ${svgNumberLine([
            { value: v.baseline, topText:'基準點', bottomText:`${v.baseline}`, fill:'#ffd55d' },
            { value: v.actual, topText:'目前點', bottomText:`${v.actual}`, fill:'#7de7ff' }
          ])}
        </div>`;
    }

    if (v.kind === 'delta-cards') {
      return `<div class="visual-box visual-grid two">
        <div class="visual-card"><span>基準量</span><b>${v.base}</b></div>
        <div class="visual-card"><span>實際量</span><b>${v.actual}</b></div>
      </div>`;
    }

    if (v.kind === 'two-point-line') {
      return `
        <div class="visual-box">
          <div class="visual-title">數線位置示意</div>
          ${svgNumberLine([
            { value: v.left, topText:'A', bottomText:`${v.left}`, fill:'#ffd55d' },
            { value: 0, topText:'O', bottomText:'0', fill:'#dfe9f3' },
            { value: v.right, topText:'B', bottomText:`${v.right}`, fill:'#7de7ff' }
          ])}
        </div>`;
    }

    if (v.kind === 'segment-divisions') {
      return `
        <div class="visual-box">
          <div class="visual-title">等分示意圖</div>
          ${svgSegmentLine(v.segments, v.targetIndex, String(v.left), String(v.right))}
        </div>`;
    }

    if (v.kind === 'compare-cards') {
      return `<div class="visual-box visual-grid three">
        ${v.items.map(item => `<div class="visual-card"><span>${item.label}</span><b>${item.value}</b></div>`).join('')}
      </div>`;
    }

    if (v.kind === 'fraction-compare') {
      return `<div class="visual-box visual-grid two">
        <div class="visual-card big"><span>左式</span><b>${v.left}</b></div>
        <div class="visual-card big"><span>右式</span><b>${v.right}</b></div>
      </div>`;
    }

    if (v.kind === 'mirror-points') {
      return `
        <div class="visual-box">
          <div class="visual-title">原點對稱示意</div>
          <div class="visual-copy">左右兩點互為相反數，和原點距離相等。</div>
          ${svgNumberLine([
            { value:-1, topText:'相反數', bottomText:'?', fill:'#ffd55d' },
            { value:0, topText:'O', bottomText:'0', fill:'#dfe9f3' },
            { value:1, topText:'x', bottomText:'?', fill:'#7de7ff' }
          ])}
        </div>`;
    }

    if (v.kind === 'absolute-range') {
      return `
        <div class="visual-box">
          <div class="visual-title">距離限制示意</div>
          <div class="visual-copy">只提醒與 0 的距離限制，不直接標答案集合。</div>
          ${svgNumberLine([
            { value:-v.limit, topText:`${v.inclusive ? '≤' : '<'} ${v.limit}`, bottomText:`-${v.limit}`, fill:'#ffd55d' },
            { value:0, topText:'O', bottomText:'0', fill:'#dfe9f3' },
            { value:v.limit, topText:`${v.inclusive ? '≤' : '<'} ${v.limit}`, bottomText:`${v.limit}`, fill:'#7de7ff' }
          ])}
        </div>`;
    }

    if (v.kind === 'hidden-distance-line') {
      const entries = Object.entries(v.points || {});
      const enriched = entries.concat(entries.some(([key]) => key === 'O') ? [] : [['O', 0]]);
      return `
        <div class="visual-box">
          <div class="visual-title">位置判讀圖</div>
          <div class="visual-copy">圖上只給點位，不直接標距離答案。</div>
          ${svgNumberLine(enriched.map(([key, value], index) => ({
            value,
            topText:key,
            bottomText:key === 'O' ? '0' : '',
            fill:key === 'O' ? '#dfe9f3' : (index % 2 === 0 ? '#ffd55d' : '#7de7ff')
          })), { labelsBottom:true })}
        </div>`;
    }

    if (v.kind === 'pair-card') {
      return `<div class="visual-box visual-grid three">
        <div class="visual-card"><span>條件一</span><b>${v.left}</b></div>
        <div class="visual-card"><span>條件二</span><b>${v.right}</b></div>
        <div class="visual-card"><span>關係</span><b>${v.relation}</b></div>
      </div>`;
    }

    if (v.kind === 'sequence-terms') {
      return `<div class="visual-box">
        <div class="visual-title">數列觀察卡</div>
        <div class="visual-grid four">
          ${v.values.map((item, idx) => `<div class="visual-card"><span>第 ${idx + 1} 項</span><b>${item}</b></div>`).join('')}
        </div>
        ${v.highlight ? `<div class="visual-copy">${v.highlight}</div>` : ''}
      </div>`;
    }

    if (v.kind === 'formula-cards') {
      return `<div class="visual-box visual-grid three">
        ${v.items.map(item => `<div class="visual-card"><span>已知條件</span><b>${item}</b></div>`).join('')}
      </div>`;
    }

    if (v.kind === 'equation-cards') {
      return `<div class="visual-box visual-grid three">
        <div class="visual-card"><span>條件 A</span><b>${v.left}</b></div>
        <div class="visual-card"><span>條件 B</span><b>${v.right}</b></div>
        <div class="visual-card"><span>提問</span><b>${v.answer}</b></div>
      </div>`;
    }

    if (v.kind === 'poly-cards') {
      return `<div class="visual-box visual-grid three">
        ${v.items.map(item => `<div class="visual-card"><span>提示</span><b>${item}</b></div>`).join('')}
      </div>`;
    }

    return '';
  }


  function richText(html){
    return String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<b>(.*?)<\/b>/g, '<span class="math-chip">$1</span>')
      .replace(/\n+/g, '<br>');
  }

  function renderPrompt(prompt){
    return `<div class="prompt-body">${richText(prompt)}</div>`;
  }

  async function revealHint(){
    const q = state.battle.currentQuestion;
    const hintBox = document.getElementById('battle-hint-box');
    if (!q || !hintBox || state.battle.inputLocked) return;

    if (state.battle.hintUsed) {
      hintBox.innerHTML = `<span class="hint-ok">已使用提示：</span> ${richText(q.hintText || q.feedbackLead || '先找出關鍵條件。')}`;
      return;
    }

    const cost = Number(q.hintCost || state.battle.hintCost || 5);
    const ok = await app.services.firebase.spendCoins(cost);
    if (!ok) {
      app.ui.toast(`提示需要 ${cost} 金幣，目前金幣不足。`, 'bad');
      return;
    }
    state.battle.hintUsed = true;
    hintBox.innerHTML = `<span class="hint-ok">已扣 ${cost} 金幣：</span> ${richText(q.hintText || q.feedbackLead || '先找出關鍵條件。')}`;
    const btn = document.getElementById('battle-hint-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '提示已使用';
    }
    app.ui.renderHUD();
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
      if (feedback) feedback.innerHTML = `<span class="ok">答對了！</span> ${richText(q.successText)}`;
      await app.services.firebase.addReward(q.rewardCoins, q.rewardExp);
      app.ui.toast(`獲得 ${q.rewardCoins} 金幣、${q.rewardExp} EXP`, 'good');
      setTimeout(() => app.runtime.closeBattle(true), 880);
    } else {
      if (feedback) feedback.innerHTML = `<span class="bad">再試一次。</span> ${richText(q.feedbackLead)}`;
      if (input) input.select();
    }
  }


  function renderTitle(){
    const root = document.getElementById('overlay-root');
    const authCopy = !state.authReady
      ? '<span class="loading-pulse"></span>'
      : (state.user ? '已維持登入，可以直接繼續冒險。' : '請先用 Google 登入。');

    const profileBlock = state.user
      ? `<div class="status-item"><span>勇者</span><strong>${state.profile?.name || state.user.displayName || '旅人'}</strong></div>
         <div class="status-item"><span>進度</span><strong>Lv.${state.profile?.level || 1} ・ ${state.profile?.coins || 0} G</strong></div>`
      : `<div class="status-item"><span>登入狀態</span><strong>尚未登入</strong></div>`;

    const installBtn = app.utils.isMobile()
      ? `<button class="secondary-btn" id="install-btn">${state.install.deferredPrompt ? '下載 / 安裝 App' : '加入主畫面'}</button>`
      : '';

    const nameSetup = state.profileSetup.required ? `
      <div class="menu-block profile-setup-block">
        <div class="menu-title">第一次登入設定名稱</div>
        <div class="menu-copy">這個名稱會顯示在右下角狀態列與 BUG 回饋中。</div>
        <div class="button-stack">
          <input class="name-input" id="profile-name-input" maxlength="12" placeholder="輸入勇者名稱（最多 12 字）" value="${app.utils.safeHtml(state.profileSetup.pendingName || state.profile?.name || '').replace(/"/g, '&quot;')}">
          <button class="primary-btn" id="save-profile-name-btn">儲存名稱</button>
        </div>
      </div>
    ` : '';

    root.innerHTML = `
      <div class="overlay-screen">
        <div class="title-panel soft-card">
          <section class="hero-card soft-card">
            <div>
              <div class="brand-row">
                <div class="big-logo">∑</div>
                <div>
                  <div class="badge">單一網址・${state.build || window.__MATH_RPG_BUILD__ || 'beta'}</div>
                  <h1 class="hero-title">Math RPG<br>世界入口</h1>
                </div>
              </div>

              <p class="hero-sub compact">
                Google 登入後進入數學中心，從六座學期之塔探索章節原野與史萊姆戰鬥。重新整理只會回到入口，但登入狀態會保留。
              </p>

              <div class="hero-preview compact">
                <article class="preview-box">
                  <h4>目前上架</h4>
                  <p>七上 1-1 負數與數線、七下 1-1 二元一次方程式、八下 1-1 等差數列。</p>
                </article>
                <article class="preview-box">
                  <h4>版本更新</h4>
                  <p>修正六塔進場、優化七上之塔動線、加入首頁 / 登出選單、全場景 BUG 回饋、首次登入自訂名稱。</p>
                </article>
                <article class="preview-box">
                  <h4>封測提醒</h4>
                  <p>手機可加入主畫面；未來可再接 Capacitor / App Store / Google Play 包裝。</p>
                </article>
              </div>
            </div>
            <div class="tiny">Build ${state.build || window.__MATH_RPG_BUILD__ || 'beta'}｜固定單一 index.html 入口</div>
          </section>

          <aside class="menu-card soft-card">
            <div class="menu-block">
              <div class="menu-title">世界入口</div>
              <div class="menu-copy">${authCopy}</div>
              <div class="button-stack">
                ${state.user
                  ? '<button class="primary-btn" id="enter-world-btn">進入數學中心</button>'
                  : '<button class="primary-btn login-btn" id="login-btn"><span class="google-mark">G</span><span>Google 登入</span></button>'}
                ${installBtn}
                <button class="secondary-btn" id="offline-btn">離線試玩</button>
              </div>
            </div>

            <div class="menu-block">
              <div class="menu-title">版本摘要</div>
              <div class="status-list">
                <div class="status-item"><span>Build</span><strong>${state.build || window.__MATH_RPG_BUILD__ || 'beta'}</strong></div>
                <div class="status-item"><span>首頁</span><strong>精簡分頁式入口</strong></div>
                <div class="status-item"><span>選單</span><strong>回首頁 / BUG 回饋 / 登出</strong></div>
                ${profileBlock}
              </div>
            </div>
            ${nameSetup}
          </aside>
        </div>
      </div>
    `;

    const loginBtn = document.getElementById('login-btn');
    const enterBtn = document.getElementById('enter-world-btn');
    const offlineBtn = document.getElementById('offline-btn');
    const installBtnEl = document.getElementById('install-btn');
    const saveNameBtn = document.getElementById('save-profile-name-btn');
    const nameInput = document.getElementById('profile-name-input');

    if (loginBtn) loginBtn.onclick = () => app.services.firebase.signIn();
    if (enterBtn) enterBtn.onclick = () => {
      if (state.profileSetup.required) {
        app.ui.toast('先設定勇者名稱，再進入世界。', 'bad');
        return;
      }
      app.runtime.enterWorld();
    };
    if (offlineBtn) offlineBtn.onclick = () => {
      state.user = { uid:'offline-user', displayName:'離線旅人', email:'' };
      state.profile = app.services.firebase.getLocalProfile();
      state.authReady = true;
      app.ui.toast('已進入離線試玩', 'good');
      app.ui.maybePromptProfileName();
      app.ui.renderAll();
    };
    if (installBtnEl) installBtnEl.onclick = () => app.runtime.askInstall();

    if (nameInput) {
      nameInput.oninput = () => {
        state.profileSetup.pendingName = nameInput.value;
      };
      nameInput.onkeydown = (event) => {
        if (event.key === 'Enter' && saveNameBtn) saveNameBtn.click();
      };
    }

    if (saveNameBtn) {
      saveNameBtn.onclick = async () => {
        const value = app.utils.sanitizeName(state.profileSetup.pendingName || '');
        if (!value) {
          app.ui.toast('請輸入 1～12 字的勇者名稱', 'bad');
          if (nameInput) nameInput.focus();
          return;
        }
        try{
          await app.services.firebase.updateProfileName(value);
          state.profileSetup.required = false;
          app.ui.toast('勇者名稱已儲存', 'good');
          app.ui.renderAll();
        }catch(error){
          console.error(error);
          app.ui.toast('名稱儲存失敗，請稍後再試', 'bad');
        }
      };
    }
  }


  function renderBattle(){
    const battle = state.currentBattle;
    if (!battle) return;
    const bank = world().getBank(battle.chapterId);
    const q = state.battle.currentQuestion || bank.generateQuestion(battle.typeId, battle.mode, battle.slime);
    state.battle.currentQuestion = q;
    const typeMeta = bank.getTypeMeta(battle.typeId);
    const chapter = world().getChapter(battle.chapterId);
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
              <div class="badge">${chapter?.label || '章節戰鬥'}</div>
              <h3 style="margin-top:.8rem;font-size:1.25rem">${battle.slime.name}</h3>
              <p class="tiny" style="margin-top:.45rem;line-height:1.9">${battle.slime.aura}・一題一戰・答對離場</p>
            </div>

            <div class="battle-mini">
              <div class="mini-item"><span>題型</span><strong>${typeMeta.title}</strong></div>
              <div class="mini-item"><span>模式</span><strong>${battle.mode === 'literacy' ? '素養題' : '課本標準題'}</strong></div>
              <div class="mini-item"><span>計時</span><strong id="battle-timer">${utils.formatTime(state.battle.seconds)}</strong></div>
              <div class="mini-item"><span>獎勵</span><strong>💰 ${q.rewardCoins} / EXP ${q.rewardExp}</strong></div>
            </div>
          </section>

          <section class="battle-right soft-card">
            <div class="battle-head">
              <div>
                <div class="badge" style="margin-bottom:.55rem">${typeMeta.slug || typeMeta.title}</div>
                <div class="battle-title">${q.title}</div>
              </div>
              <div class="mode-lock">${battle.mode === 'literacy' ? '素養題' : '標準題'}</div>
            </div>

            <div class="question-card">
              ${renderPrompt(q.prompt)}
              ${q.visual ? renderVisual(q) : ''}
            </div>

            <div class="hint-row">
              <button class="secondary-btn hint-btn" id="battle-hint-btn" ${state.battle.hintUsed ? 'disabled' : ''}>${state.battle.hintUsed ? '提示已使用' : `提示 - ${q.hintCost || state.battle.hintCost || 5} G`}</button>
              <div class="hint-note">提示要花金幣，買過後本題只顯示一次。</div>
            </div>
            <div class="feedback hint-panel" id="battle-hint-box">${state.battle.hintUsed ? richText(q.hintText || q.feedbackLead || '先找出關鍵條件。') : '還沒使用提示。'}</div>

            <div class="feedback" id="battle-feedback">${richText(q.feedbackLead)}</div>

            <div class="answer-row">
              <div>
                <label for="battle-answer">輸入答案</label>
                <input id="battle-answer" class="answer-input" autocomplete="off" inputmode="${q.inputMode === 'numeric' ? 'numeric' : 'text'}" placeholder="${q.placeholder || '請輸入答案'}" />
              </div>
              <div class="footer-actions right-actions">
                <button class="primary-btn" id="submit-answer-btn">作答</button>
              </div>
            </div>

            <div class="footer-actions">
              <div class="tiny">題目與模式已鎖定；答對後直接領獎回原野。</div>
              <button class="secondary-btn" id="retreat-battle-btn">撤退回原野</button>
            </div>
          </section>
        </div>
      </div>
    `;

    const answerInput = document.getElementById('battle-answer');
    const hintBtn = document.getElementById('battle-hint-btn');
    document.getElementById('submit-answer-btn').onclick = checkAnswer;
    document.getElementById('retreat-battle-btn').onclick = () => app.runtime.closeBattle(false);
    if (hintBtn) hintBtn.onclick = () => revealHint();

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


  app.ui.maybePromptProfileName = function(){
    const profile = state.profile || {};
    const required = !!(state.user && !profile.customNameSet);
    state.profileSetup.required = required;
    if (!state.profileSetup.pendingName) {
      state.profileSetup.pendingName = profile.name || state.user?.displayName || '';
    }
  };

  app.ui.renderAll = function(){
    app.ui.renderHUD();
    app.ui.renderOverlay();
    if (app.ui.renderFeedback) app.ui.renderFeedback();
    app.ui.renderTouch();
  };

  app.ui.openBattle = function(context){
    state.currentBattle = context;
    state.overlay = 'battle';
    state.battle.rewarded = false;
    state.battle.seconds = 0;
    state.battle.inputLocked = false;
    state.battle.hintUsed = false;
    if (!state.battle.currentQuestion) {
      const bank = world().getBank(context.chapterId);
      state.battle.currentQuestion = bank.generateQuestion(context.typeId, context.mode, context.slime);
    }
    app.ui.renderAll();
  };

  app.ui.closeBattleOverlay = function(){
    stopBattleTimer();
    state.currentBattle = null;
    state.battle.currentQuestion = null;
    state.battle.inputLocked = false;
    state.battle.hintUsed = false;
    state.overlay = 'none';
    app.ui.renderAll();
  };
})(window.MathRPG);
