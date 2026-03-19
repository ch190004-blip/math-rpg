(function(app){
  const state = app.state;

  function makeButton(label, key, extra=''){
    return `<button class="touch-btn ${extra}" data-key="${key}">${label}</button>`;
  }

  function bindHold(button){
    if (!button) return;
    const key = button.dataset.key;
    const press = (value) => {
      state.input[key] = value;
      button.classList.toggle('active', value);
    };
    const stop = () => press(false);
    button.addEventListener('pointerdown', (e) => { e.preventDefault(); press(true); });
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointercancel', stop);
    button.addEventListener('pointerleave', stop);
  }

  app.ui.renderTouch = function(){
    const root = document.getElementById('touch-root');
    const actionLabel = state.sceneKey === 'TowerScene' ? '進門 / 上下樓' : '互動';
    root.innerHTML = `
      <div class="touch-shell">
        <div class="dpad">
          <div></div>${makeButton('↑', 'up')}<div></div>
          ${makeButton('←', 'left')}${makeButton('•', 'down', 'hidden')}${makeButton('→', 'right')}
          <div></div>${makeButton('↓', 'down')}<div></div>
        </div>
        <div class="action-buttons">
          ${makeButton(actionLabel, 'interact')}
        </div>
      </div>
    `;
    root.querySelectorAll('.touch-btn').forEach(bindHold);
  };
})(window.MathRPG);
