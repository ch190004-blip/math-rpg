
(function(app){
  app.state = {
    authReady: false,
    firebaseReady: true,
    user: null,
    profile: { name: '旅人', email: '', level: 1, exp: 0, coins: 100 },
    sceneKey: 'LobbyScene',
    overlay: 'title',
    loadingText: '世界生成中…',
    fieldReturnPoint: 'entry',
    defeatedSlimes: {},
    currentBattle: null,
    currentHint: '登入後進入世界',
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
    }
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
