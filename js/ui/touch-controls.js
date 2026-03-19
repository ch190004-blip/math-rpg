
(function(app){
  const state = app.state;

  function isTouchDevice(){
    return window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
  }

  function makeButton(label, key, extra=''){
    return `<button class="touch-btn ${extra}" data-key="${key}">${label}</button>`;
  }

  function resetDirections(){
    state.input.left = false;
    state.input.right = false;
    state.input.up = false;
    state.input.down = false;
  }

  function bindActionButton(button){
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

  function bindJoystick(root){
    if (!root) return;
    const thumb = root.querySelector('.stick-thumb');
    const radius = 34;
    let activePointerId = null;

    const setThumb = (dx, dy) => {
      thumb.style.transform = `translate(${dx}px, ${dy}px)`;
      const threshold = 12;
      if (state.sceneKey === 'TowerScene') {
        state.input.left = dx < -threshold;
        state.input.right = dx > threshold;
        state.input.up = false;
        state.input.down = false;
      } else {
        state.input.left = dx < -threshold;
        state.input.right = dx > threshold;
        state.input.up = dy < -threshold;
        state.input.down = dy > threshold;
      }
    };

    const stop = () => {
      const pid = activePointerId;
      activePointerId = null;
      resetDirections();
      thumb.style.transform = 'translate(0px, 0px)';
      root.classList.remove('active');
      try{ if (pid != null) root.releasePointerCapture?.(pid); }catch(_){}
    };

    const move = (event) => {
      if (activePointerId !== event.pointerId) return;
      const rect = root.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = event.clientX - cx;
      let dy = event.clientY - cy;
      const len = Math.hypot(dx, dy) || 1;
      if (len > radius) {
        dx = dx / len * radius;
        dy = dy / len * radius;
      }
      setThumb(dx, dy);
    };

    root.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      activePointerId = event.pointerId;
      root.setPointerCapture?.(event.pointerId);
      root.classList.add('active');
      move(event);
    });
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerup', stop);
    root.addEventListener('pointercancel', stop);
    root.addEventListener('pointerleave', (event) => {
      if (activePointerId === event.pointerId) stop();
    });
  }

  app.ui.renderTouch = function(){
    const root = document.getElementById('touch-root');
    if (!root) return;
    if (!isTouchDevice() || state.overlay === 'title') {
      root.innerHTML = '';
      resetDirections();
      state.input.interact = false;
      state.input.jump = false;
      return;
    }

    root.innerHTML = `
      <div class="touch-shell">
        <div class="touch-joystick" id="touch-joystick" aria-label="虛擬搖桿">
          <div class="stick-base"></div>
          <div class="stick-ring"></div>
          <div class="stick-thumb"></div>
        </div>
        <div class="action-buttons">
          ${makeButton('E', 'interact', 'action-key')}
          ${state.sceneKey === 'TowerScene' ? makeButton('跳', 'jump', 'jump-key') : ''}
        </div>
      </div>
    `;

    bindJoystick(document.getElementById('touch-joystick'));
    root.querySelectorAll('.touch-btn').forEach(bindActionButton);
  };
})(window.MathRPG);
