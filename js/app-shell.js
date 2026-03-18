
export const STORAGE_KEYS = {
  sceneState: "mathRpgSceneState",
  battleResult: "mathRpgBattleResult",
  battleEntry: "mathRpgBattleEntry"
};

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.warn("service worker", error);
      });
    });
  }
}

export function getSceneState(sceneKey, fallback = {}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sceneState);
    if (!raw) return { ...fallback };
    const parsed = JSON.parse(raw);
    return { ...fallback, ...(parsed[sceneKey] || {}) };
  } catch (error) {
    return { ...fallback };
  }
}

export function saveSceneState(sceneKey, value) {
  let parsed = {};
  try {
    parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.sceneState) || "{}");
  } catch (error) {
    parsed = {};
  }
  parsed[sceneKey] = value;
  localStorage.setItem(STORAGE_KEYS.sceneState, JSON.stringify(parsed));
}

export function setBattleEntry(entry) {
  localStorage.setItem(STORAGE_KEYS.battleEntry, JSON.stringify(entry));
}

export function getBattleEntry() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.battleEntry) || "null");
  } catch (error) {
    return null;
  }
}

export function saveBattleResult(result) {
  localStorage.setItem(STORAGE_KEYS.battleResult, JSON.stringify(result));
}

export function consumeBattleResult() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.battleResult);
    localStorage.removeItem(STORAGE_KEYS.battleResult);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEYS.battleResult);
    return null;
  }
}

export function qs(name, fallback = "") {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || fallback;
}

export function escapeAttr(value) {
  return String(value).replace(/"/g, "&quot;");
}

export function transitionTo(url) {
  const overlay = document.getElementById("scene-fade");
  if (overlay) overlay.classList.add("active");
  setTimeout(() => { window.location.href = url; }, 280);
}

export function showToast(message, type = "normal", duration = 2200) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), duration);
}

export function updateHud(profile, sceneLabel = "") {
  const nameEl = document.getElementById("hud-name");
  const coinsEl = document.getElementById("hud-coins");
  const levelEl = document.getElementById("hud-level");
  const sceneEl = document.getElementById("hud-scene");
  if (sceneEl && sceneLabel) sceneEl.textContent = sceneLabel;
  if (!profile) {
    if (nameEl) nameEl.textContent = "訪客";
    if (coinsEl) coinsEl.textContent = "—";
    if (levelEl) levelEl.textContent = "Lv.—";
    return;
  }
  if (nameEl) nameEl.textContent = profile.name || "勇者";
  if (coinsEl) coinsEl.textContent = profile.coins ?? 0;
  if (levelEl) levelEl.textContent = `Lv.${profile.level ?? 1}`;
}

export function setupMenu({ onHome, onLogout, homeLabel = "首頁" } = {}) {
  const menuBtn = document.getElementById("menu-btn");
  const panel = document.getElementById("menu-panel");
  const homeBtn = document.getElementById("menu-home");
  const logoutBtn = document.getElementById("menu-logout");
  const fullBtn = document.getElementById("menu-fullscreen");
  if (homeBtn) homeBtn.textContent = homeLabel;
  if (menuBtn && panel) {
    menuBtn.addEventListener("click", () => panel.classList.toggle("open"));
    document.addEventListener("click", (event) => {
      if (!panel.contains(event.target) && !menuBtn.contains(event.target)) {
        panel.classList.remove("open");
      }
    });
  }
  if (homeBtn && onHome) homeBtn.addEventListener("click", onHome);
  if (logoutBtn && onLogout) logoutBtn.addEventListener("click", onLogout);
  if (fullBtn) {
    fullBtn.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.warn(error);
      }
    });
  }
}

export function createControlState() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false,
    jump: false
  };
}

function bindHoldButton(button, state, key) {
  if (!button) return;
  const set = (value) => {
    state[key] = value;
    button.classList.toggle("pressed", value);
  };
  ["pointerdown", "touchstart", "mousedown"].forEach((eventName) => {
    button.addEventListener(eventName, (event) => {
      event.preventDefault();
      set(true);
    }, { passive: false });
  });
  ["pointerup", "pointercancel", "touchend", "touchcancel", "mouseup", "mouseleave"].forEach((eventName) => {
    button.addEventListener(eventName, (event) => {
      event.preventDefault();
      set(false);
    }, { passive: false });
  });
}

export function bindControls(state) {
  bindHoldButton(document.querySelector("[data-key='up']"), state, "up");
  bindHoldButton(document.querySelector("[data-key='down']"), state, "down");
  bindHoldButton(document.querySelector("[data-key='left']"), state, "left");
  bindHoldButton(document.querySelector("[data-key='right']"), state, "right");
  bindHoldButton(document.querySelector("[data-key='action']"), state, "action");
  bindHoldButton(document.querySelector("[data-key='jump']"), state, "jump");
  return state;
}

export function setActionHint(text = "") {
  const pill = document.getElementById("action-pill");
  if (!pill) return;
  pill.textContent = text;
  pill.classList.toggle("show", Boolean(text));
}

export function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
}
