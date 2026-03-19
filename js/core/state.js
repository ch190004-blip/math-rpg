(function(app){
  app.state = {
    authReady: false,
    firebaseReady: true,
    user: null,
    profile: { name: '旅人', email: '', level: 1, exp: 0, coins: 100, avatarSkin: {} },
    sceneKey: 'LobbyScene',
    overlay: 'title',
    modal: 'none',
    loadingText: '世界生成中…',
    currentHint: '登入後進入世界',
    currentTowerId: '7up',
    currentChapterId: null,
    currentTowerFloor: 1,
    defeatedSlimes: {},
    currentBattle: null,
    input: {
      left: false,
      right: false,
      up: false,
      down: false,
      interact: false,
      jump: false
    },
    avatar: {
      head: 'head-basic',
      body: 'body-adventurer',
      hands: 'hands-basic',
      feet: 'feet-boots'
    },
    battle: {
      timerId: null,
      seconds: 0,
      rewarded: false,
      currentQuestion: null,
      inputLocked: false
    },
    feedback: {
      draft: null,
      submitting: false
    },
    install: {
      deferredPrompt: null,
      supported: false
    },
    profileSetup: {
      required: false,
      pendingName: ''
    },
    uiMenuOpen: false,
    transitioning: false,
    build: window.__MATH_RPG_BUILD__ || 'beta'
  };

  app.config.game = {
    speedMultiplier: 2,
    rewardCoins: 10,
    rewardExp: 50
  };

  app.config.firebase = {
    apiKey: "AIzaSyBjcI122qYfHW9ibPLz-XG8kleDq4r2pF8",
    authDomain: "math-rpg-test.firebaseapp.com",
    projectId: "math-rpg-test",
    storageBucket: "math-rpg-test.firebasestorage.app",
    messagingSenderId: "593199481365",
    appId: "1:593199481365:web:7ad8656ff4aef6d0ca841c"
  };
})(window.MathRPG);
