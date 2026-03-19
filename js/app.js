(function(app){
  const state = app.state;
  const world = () => app.data.world;

  function createGame(){
    app.runtime.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game-root',
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#9ee7b8',
      physics: {
        default: 'arcade',
        arcade: { debug: false, gravity: { y: 0 } }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [
        app.scenes.BootScene,
        app.scenes.LobbyScene,
        app.scenes.TowerScene,
        app.scenes.FieldScene
      ]
    });
  }

  function sceneByKey(key){
    if (!app.runtime.game || !app.runtime.game.scene || !key) return null;
    try { return app.runtime.game.scene.getScene(key); } catch (_) { return null; }
  }

  function activeScene(){
    return sceneByKey(state.sceneKey);
  }

  function pauseForOverlay(){
    const scene = activeScene();
    if (scene && scene.scene && scene.scene.isActive()) scene.scene.pause();
  }

  function resumeAfterOverlay(){
    const scene = activeScene();
    if (scene && scene.scene && scene.scene.isPaused()) scene.scene.resume();
  }

  function forceStartScene(sceneKey, data){
    ['LobbyScene', 'TowerScene', 'FieldScene'].forEach((key) => {
      if (key !== sceneKey && app.runtime.game.scene.isActive(key)) app.runtime.game.scene.stop(key);
    });
    app.runtime.game.scene.start(sceneKey, data || {});
  }

  app.runtime.gotoScene = function(sceneKey, data){
    state.sceneKey = sceneKey;
    state.overlay = 'none';
    state.modal = 'none';
    forceStartScene(sceneKey, data);
    app.ui.renderAll();
  };

  app.runtime.enterWorld = function(){
    state.overlay = 'none';
    state.modal = 'none';
    state.currentHint = '方向鍵 / WASD 移動，靠近塔門後按 E 進入';
    forceStartScene('LobbyScene', { fresh:true });
    app.ui.renderAll();
  };

  app.runtime.returnToTitle = function(){
    state.overlay = 'title';
    state.modal = 'none';
    state.currentChapterId = null;
    state.currentHint = '登入後進入世界';
    forceStartScene('LobbyScene', { idle:true });
    app.ui.renderAll();
  };

  app.runtime.gotoTower = function(towerId, floor){
    state.currentTowerId = towerId;
    state.currentTowerFloor = floor || 1;
    state.currentChapterId = null;
    state.overlay = 'none';
    state.modal = 'none';
    forceStartScene('TowerScene', { towerId, floor: floor || 1 });
    app.ui.renderAll();
  };

  app.runtime.enterChapter = function(chapterId){
    const chapter = world().getChapter(chapterId);
    if (!chapter || !chapter.implemented) {
      app.ui.toast('此章節尚未上架', 'bad');
      return;
    }
    state.currentChapterId = chapterId;
    state.overlay = 'none';
    state.modal = 'none';
    forceStartScene('FieldScene', { chapterId });
    app.ui.renderAll();
  };

  app.runtime.openBattle = function(context){
    state.currentBattle = context;
    state.battle.rewarded = false;
    state.battle.inputLocked = false;
    state.battle.seconds = 0;
    const bank = world().getBank(context.chapterId);
    state.battle.currentQuestion = bank.generateQuestion(context.typeId, context.mode, context.slime);
    app.ui.openBattle(context);
    pauseForOverlay();
  };

  app.runtime.closeBattle = function(won){
    const battle = state.currentBattle;
    if (won && battle && battle.slime && battle.sourceScene === 'FieldScene') {
      state.defeatedSlimes[battle.slime.id] = true;
      const scene = sceneByKey('FieldScene');
      if (scene && scene.scene && (scene.scene.isActive() || scene.scene.isPaused())) {
        scene.removeSlimeById(battle.slime.id);
        if (scene.player && scene.time) scene.player.invulnUntil = scene.time.now + 1400;
      }
    }
    app.ui.closeBattleOverlay();
    state.currentHint = '靠近史萊姆按 E 開戰，答對後拿金幣與 EXP，然後回到原野';
    app.ui.renderHUD();
    resumeAfterOverlay();
  };

  window.addEventListener('resize', () => {
    if (app.runtime.game && app.runtime.game.scale) app.runtime.game.scale.resize(window.innerWidth, window.innerHeight);
  });

  document.addEventListener('DOMContentLoaded', async () => {
    createGame();
    app.ui.renderAll();
    await app.services.firebase.init();
    state.overlay = 'title';
    app.ui.renderAll();
  });
})(window.MathRPG);
