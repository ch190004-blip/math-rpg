
(function(app){
  const state = app.state;
  const world = () => app.data.world;

  app.scenes.LobbyScene = class LobbyScene extends Phaser.Scene{
    constructor(){ super('LobbyScene'); }

    create(){
      state.sceneKey = 'LobbyScene';
      state.currentChapterId = null;
      state.currentHint = '從數學中心出發，靠近任一學期之塔後按 E 進入';
      app.ui.renderHUD();

      const W = 1800;
      const H = 1220;
      this.worldSize = { W, H };
      this.cameras.main.setBackgroundColor('#d5f4ff');
      this.physics.world.setBounds(0, 0, W, H);
      this.cameras.main.setBounds(0, 0, W, H);

      this.add.tileSprite(W/2, H/2, W, H, 'grass-tile').setTint(0x90d773);
      this.add.circle(170, 140, 112, 0xffffff, 0.62).setDepth(0);
      this.add.circle(1630, 160, 100, 0xffffff, 0.38).setDepth(0);
      this.add.circle(1460, 110, 84, 0xffffff, 0.22).setDepth(0);
      this.add.rectangle(W/2, 170, 320, 78, 0xffffff, 0.55).setDepth(0).setStrokeStyle(3, 0xffffff, 0.75);

      this.add.rectangle(W/2, H - 88, W, 170, 0x8bca63, 0.9).setDepth(0);
      this.add.rectangle(W/2, H - 44, W, 82, 0x97d572, 1).setDepth(0);
      for (let i = 0; i < 12; i++){
        const x = 80 + i * 150;
        this.add.circle(x, H - 108, 22, 0xe6d08f, 0.95).setDepth(1);
      }

      // 數學中心建築
      const hallX = W / 2;
      const hallY = H - 180;
      this.add.rectangle(hallX, hallY, 360, 180, 0xf7f0df, 1).setDepth(1.5).setStrokeStyle(6, 0xb38d59);
      this.add.rectangle(hallX, hallY - 34, 210, 70, 0xf7f0df, 1).setDepth(1.6).setStrokeStyle(6, 0xb38d59);
      this.add.rectangle(hallX - 92, hallY - 22, 42, 68, 0x8acbff, 0.95).setDepth(1.6).setStrokeStyle(4, 0xb38d59);
      this.add.rectangle(hallX + 92, hallY - 22, 42, 68, 0x8acbff, 0.95).setDepth(1.6).setStrokeStyle(4, 0xb38d59);
      this.add.rectangle(hallX, hallY + 26, 44, 84, 0x8acbff, 0.95).setDepth(1.6).setStrokeStyle(4, 0xb38d59);
      this.add.rectangle(hallX, hallY + 92, 190, 96, 0x87592f, 1).setDepth(1.6);
      this.add.text(hallX, hallY - 10, '數學中心', {
        fontFamily:'Noto Sans TC', fontSize:'24px', fontStyle:'900', color:'#5b3b18'
      }).setOrigin(0.5).setDepth(2);

      this.add.text(W/2, 78, 'Math RPG｜數學中心', {
        fontFamily:'Press Start 2P', fontSize:'22px', color:'#3b54b8'
      }).setOrigin(0.5).setDepth(3);
      this.add.text(W/2, 122, '六座學期之塔依相對位置排列；靠近塔門按 E 進入', {
        fontFamily:'Noto Sans TC', fontSize:'18px', fontStyle:'900', color:'#315b2a', stroke:'#fff', strokeThickness:5
      }).setOrigin(0.5).setDepth(3);

      this.gates = [];
      world().semesters.forEach((semester) => this.createTowerGate(semester));

      this.player = this.physics.add.sprite(W/2, H - 128, 'player-top-active').setDepth(8);
      this.player.body.setSize(20, 30).setOffset(10, 38);
      this.player.setCollideWorldBounds(true);

      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
    }

    createTowerGate(semester){
      const { lobbyX:x, lobbyY:y } = semester;
      const colorNum = Number('0x' + semester.color.replace('#',''));
      const shadow = this.add.ellipse(x, y + 50, 140, 34, 0x000000, 0.14).setDepth(1);
      const body = this.add.polygon(x, y, [0,-56, 52,-18, 34, 42, -34, 42, -52,-18], colorNum, 0.94)
        .setDepth(2)
        .setStrokeStyle(5, 0x2a2516, 1);
      const door = this.add.rectangle(x, y + 20, 44, 54, 0xffffff, 0.96).setDepth(3).setStrokeStyle(4, 0x2a2516);
      const label = this.add.text(x, y + 10, semester.short, {
        fontFamily:'Noto Sans TC', fontSize:'22px', fontStyle:'900', color:'#2c2514'
      }).setOrigin(0.5).setDepth(4);
      const zone = this.add.zone(x, y + 20, 86, 92);
      this.physics.add.existing(zone, true);

      const gateContainer = this.add.container(0, 0, [shadow, body, door, label]).setDepth(2);
      this.tweens.add({
        targets:[body, door, label],
        y:'-=4',
        duration:1800 + Math.round(Math.random() * 400),
        yoyo:true,
        repeat:-1
      });

      this.gates.push({ semester, zone, gateContainer, x, y });
    }

    consumeInteract(){
      const kb = Phaser.Input.Keyboard.JustDown(this.keys.E);
      const touch = state.input.interact;
      if (touch) state.input.interact = false;
      return kb || touch;
    }

    update(){
      if (state.overlay !== 'none' || state.modal !== 'none') {
        this.player.body.setVelocity(0);
        return;
      }

      let vx = 0, vy = 0;
      const left = this.cursors.left.isDown || this.keys.A.isDown || state.input.left;
      const right = this.cursors.right.isDown || this.keys.D.isDown || state.input.right;
      const up = this.cursors.up.isDown || this.keys.W.isDown || state.input.up;
      const down = this.cursors.down.isDown || this.keys.S.isDown || state.input.down;
      const move = 178 * app.config.game.speedMultiplier;

      if (left) vx = -move;
      else if (right) vx = move;
      if (up) vy = -move;
      else if (down) vy = move;
      this.player.body.setVelocity(vx, vy);
      if (vx !== 0 || vy !== 0) this.player.body.velocity.normalize().scale(move);

      let nearGate = null;
      this.gates.forEach((item) => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), item.zone.getBounds())) nearGate = item;
      });

      const defaultHint = '從數學中心出發，靠近任一學期之塔後按 E 進入';
      if (nearGate) {
        state.currentHint = `${nearGate.semester.label}｜按 E 進入`;
        app.ui.renderHUD();
        if (this.consumeInteract()) app.runtime.gotoTower(nearGate.semester.id, 1);
      } else if (state.currentHint !== defaultHint) {
        state.currentHint = defaultHint;
        app.ui.renderHUD();
      }
    }
  };
})(window.MathRPG);
