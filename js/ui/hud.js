(function(app){
  const state = app.state;
  const world = () => app.data.world;

  app.ui.renderHUD = function(){
    const root = document.getElementById('hud-root');
    if (state.overlay === 'title') {
      root.innerHTML = `
        <button class="feedback-fab" id="feedback-fab" aria-label="回饋與 BUG">BUG / 回饋</button>
      `;
      const fabOnly = document.getElementById('feedback-fab');
      if (fabOnly) fabOnly.onclick = () => app.ui.openFeedback();
      return;
    }
    const profile = state.profile || {};
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
            <span class="stat-pill">Lv.${profile.level || 1}</span>
            <span class="stat-pill">EXP ${profile.exp || 0}</span>
            <span class="stat-pill">💰 ${profile.coins || 0}</span>
            <button class="icon-btn" id="feedback-fab">BUG / 回饋</button>
            <button class="icon-btn" id="back-to-title-btn">入口</button>
            ${state.user ? '<button class="icon-btn" id="logout-btn">登出</button>' : ''}
          </div>
        </div>
      </div>
      <div class="scene-hint">${state.currentHint || ''}</div>
    `;
    const feedbackBtn = document.getElementById('feedback-fab');
    if (feedbackBtn) feedbackBtn.onclick = () => app.ui.openFeedback();
    const backBtn = document.getElementById('back-to-title-btn');
    if (backBtn) backBtn.onclick = () => app.runtime.returnToTitle();
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await app.services.firebase.signOut();
        app.runtime.returnToTitle();
      };
    }
  };

  app.ui.sceneLabel = function(){
    if (state.sceneKey === 'LobbyScene') return '大廳原野｜六塔大世界';
    if (state.sceneKey === 'TowerScene') {
      const semester = world().getSemester(state.currentTowerId);
      return `${semester.label}｜每章一層樓`;
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
