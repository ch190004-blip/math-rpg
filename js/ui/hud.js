(function(app){
  const state = app.state;
  const world = () => app.data.world;

  function buildLabel(){
    return state.build || window.__MATH_RPG_BUILD__ || 'beta';
  }

  function profileSummary(){
    const profile = state.profile || {};
    return `
      <span class="stat-pill">Lv.${profile.level || 1}</span>
      <span class="stat-pill">EXP ${profile.exp || 0}</span>
      <span class="stat-pill">💰 ${profile.coins || 0}</span>
    `;
  }

  function menuMarkup(){
    return `
      <div class="hud-menu-wrap ${state.uiMenuOpen ? 'open' : ''}">
        <button class="menu-trigger soft-card" id="hud-menu-trigger" aria-label="主選單" aria-expanded="${state.uiMenuOpen ? 'true' : 'false'}">☰</button>
        <div class="hud-menu-panel soft-card" id="hud-menu-panel">
          <div class="hud-menu-title">Math RPG 選單</div>
          <button class="menu-item" id="menu-home-btn">回首頁</button>
          <button class="menu-item" id="menu-feedback-btn">BUG / 回饋</button>
          ${state.user ? '<button class="menu-item danger" id="menu-logout-btn">登出</button>' : ''}
          <div class="menu-build">Build ${buildLabel()}</div>
        </div>
      </div>
    `;
  }

  function bindMenuHandlers(){
    const trigger = document.getElementById('hud-menu-trigger');
    if (trigger) {
      trigger.onclick = (ev) => {
        ev.stopPropagation();
        state.uiMenuOpen = !state.uiMenuOpen;
        app.ui.renderHUD();
      };
    }

    const closeMenu = () => {
      if (!state.uiMenuOpen) return;
      state.uiMenuOpen = false;
      app.ui.renderHUD();
    };

    const homeBtn = document.getElementById('menu-home-btn');
    if (homeBtn) homeBtn.onclick = () => {
      state.uiMenuOpen = false;
      app.runtime.returnToTitle();
    };

    const feedbackBtn = document.getElementById('menu-feedback-btn');
    if (feedbackBtn) feedbackBtn.onclick = () => {
      state.uiMenuOpen = false;
      app.ui.openFeedback();
    };

    const logoutBtn = document.getElementById('menu-logout-btn');
    if (logoutBtn) logoutBtn.onclick = async () => {
      state.uiMenuOpen = false;
      await app.services.firebase.signOut();
      app.runtime.returnToTitle();
    };

    setTimeout(() => {
      document.onclick = (ev) => {
        const wrap = document.querySelector('.hud-menu-wrap');
        if (state.uiMenuOpen && wrap && !wrap.contains(ev.target)) closeMenu();
      };
    }, 0);
  }

  app.ui.renderHUD = function(){
    const root = document.getElementById('hud-root');
    const profile = state.profile || {};
    if (state.overlay === 'title') {
      root.innerHTML = `
        <div class="hud-shell title-hud">
          <div class="hud-left">
            <div class="brand soft-card compact">
              <div class="hud-logo">∑</div>
              <div class="hud-title-wrap">
                <div class="hud-title">Math RPG</div>
                <div class="hud-sub">封測版｜${buildLabel()}</div>
              </div>
            </div>
          </div>
          <div class="hud-right">
            <div class="stats soft-card compact title-stats">
              ${state.user ? profileSummary() : '<span class="stat-pill">尚未登入</span>'}
              ${menuMarkup()}
            </div>
          </div>
        </div>
        <button class="feedback-fab" id="feedback-fab" aria-label="回饋與 BUG">BUG / 回饋</button>
      `;
      const fabOnly = document.getElementById('feedback-fab');
      if (fabOnly) fabOnly.onclick = () => app.ui.openFeedback();
      bindMenuHandlers();
      return;
    }

    root.innerHTML = `
      <div class="hud-shell">
        <div class="hud-left">
          <div class="brand soft-card">
            <div class="hud-logo">∑</div>
            <div class="hud-title-wrap">
              <div class="hud-title">${app.ui.sceneLabel()}</div>
              <div class="hud-sub">${state.currentHint || '探索中'}</div>
            </div>
          </div>
        </div>
        <div class="hud-right">
          <div class="stats soft-card">
            ${profileSummary()}
            ${menuMarkup()}
          </div>
        </div>
      </div>
      <div class="scene-hint">${state.currentHint || ''}</div>
      <button class="feedback-fab" id="feedback-fab" aria-label="回饋與 BUG">BUG / 回饋</button>
    `;

    const feedbackBtn = document.getElementById('feedback-fab');
    if (feedbackBtn) feedbackBtn.onclick = () => app.ui.openFeedback();
    bindMenuHandlers();
  };

  app.ui.sceneLabel = function(){
    if (state.sceneKey === 'LobbyScene') return '大廳原野｜六塔大世界';
    if (state.sceneKey === 'TowerScene') {
      const semester = world().getSemester(state.currentTowerId);
      return `${semester.label}｜3 層章節塔`;
    }
    if (state.sceneKey === 'FieldScene') {
      const chapter = world().getChapter(state.currentChapterId);
      return chapter ? `${chapter.label}｜史萊姆原野` : '章節原野';
    }
    return 'Math RPG';
  };

  app.ui.toast = function(message, tone='good'){
    const root = document.getElementById('toast-root');
    const div = document.createElement('div');
    div.className = `toast ${tone}`;
    div.textContent = message;
    root.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transform = 'translateY(8px)';
      div.style.transition = 'all .3s ease';
      setTimeout(() => div.remove(), 300);
    }, 2200);
  };
})(window.MathRPG);
