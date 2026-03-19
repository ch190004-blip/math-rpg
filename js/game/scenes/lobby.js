
(function(app){
  const state = app.state;
  const world = () => app.data.world;

  function polyPoints(radius){
    const list = [];
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (Math.PI * 2 / 5) * i;
      list.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    return list;
  }

  app.scenes.LobbyScene = class LobbyScene extends Phaser.Scene{
    constructor(){ super('LobbyScene'); }

    create(){
      state.sceneKey = 'LobbyScene';
      state.currentChapterId = null;
      state.currentHint = '靠近六塔門口後按 E 進入';
      app.ui.renderHUD();
      this.lastHint = '';

      const W = 1800;
      const H = 1220;
      this.worldSize = { W, H };
      this.cameras.main.setBackgroundColor('#caeeff');
      this.physics.world.setBounds(0, 0, W, H);
      this.cameras.main.setBounds(0, 0, W, H);

      this.drawBackground(W, H);
      this.gates = [];
      world().semesters.forEach((semester) => this.createTowerGate(semester));
      this.drawMathCenter(W, H);

      this.player = this.physics.add.sprite(W/2, H - 126, 'player-top-active').setDepth(20);
      this.player.body.setSize(20, 30).setOffset(10, 38);
      this.player.setCollideWorldBounds(true);

      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.cameras.main.setDeadzone(160, 120);
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
      this.interactCooldownUntil = 0;
    }

    drawBackground(W, H){
      this.add.rectangle(W/2, H/2, W, H, 0xbfe8ff).setDepth(-10);
      this.add.circle(130, 120, 120, 0xffffff, 0.88).setDepth(-9);
      this.add.circle(W - 160, 160, 128, 0xffffff, 0.36).setDepth(-9);
      this.add.rectangle(W/2, H - 132, W, 200, 0x8fd36c, 1).setDepth(-8);
      this.add.rectangle(W/2, H - 58, W, 78, 0x97de74, 1).setDepth(-8);

      for (let i = 0; i < 5; i++) {
        const baseX = 120 + i * 320;
        this.add.polygon(baseX, H - 200, [0,0, 74,0, -50,124], 0x9dbdea, 0.9).setDepth(-7);
        this.add.polygon(baseX + 150, H - 146, [0,0, 100,0, -72,146], 0x9dbdea, 0.78).setDepth(-7);
      }
      for (let i = 0; i < 12; i++) {
        this.add.circle(80 + i * 152, H - 104, 22, 0xe6d08f, 0.96).setDepth(-6);
      }

      this.add.text(W/2, 72, 'MATH RPG', {
        fontFamily:'Press Start 2P', fontSize:'24px', color:'#3950b8'
      }).setOrigin(0.5).setDepth(10);

      this.add.text(W/2, 112, '數學中心', {
        fontFamily:'Noto Sans TC', fontSize:'30px', fontStyle:'900', color:'#204e29', stroke:'#fff', strokeThickness:6
      }).setOrigin(0.5).setDepth(10);
    }

    drawMathCenter(W, H){
      const hallX = W / 2;
      const hallY = H - 150;
      this.add.rectangle(hallX, hallY, 330, 168, 0xe6d8bf, 1).setDepth(4).setStrokeStyle(6, 0xc69b64);
      this.add.rectangle(hallX, hallY - 26, 176, 52, 0xf2e7d2, 1).setDepth(5).setStrokeStyle(6, 0xc69b64);
      this.add.rectangle(hallX - 88, hallY - 24, 38, 80, 0x8dcfff, 1).setDepth(5).setStrokeStyle(4, 0xb4854f);
      this.add.rectangle(hallX + 88, hallY - 24, 38, 80, 0x8dcfff, 1).setDepth(5).setStrokeStyle(4, 0xb4854f);
      this.add.rectangle(hallX, hallY + 40, 176, 88, 0x80522c, 1).setDepth(5);
      this.add.text(hallX, hallY - 8, '大廳入口', {
        fontFamily:'Noto Sans TC', fontSize:'24px', fontStyle:'900', color:'#5b3b18'
      }).setOrigin(0.5).setDepth(6);
    }

    createTowerGate(semester){
      const { lobbyX:x, lobbyY:y } = semester;
      const colorNum = Number('0x' + semester.color.replace('#',''));
      const shadow = this.add.ellipse(x, y + 68, 180, 40, 0x000000, 0.14).setDepth(1);
      const body = this.add.polygon(x, y, polyPoints(70), colorNum, 0.98)
        .setDepth(2)
        .setStrokeStyle(6, 0x2b2518, 1);
      const roof = this.add.polygon(x, y - 8, polyPoints(46), 0xffffff, 0.16).setDepth(3);
      const door = this.add.rectangle(x, y + 26, 44, 60, 0xffffff, 0.98)
        .setDepth(4)
        .setStrokeStyle(4, 0x2b2518);
      const label = this.add.text(x, y + 12, semester.short, {
        fontFamily:'Noto Sans TC', fontSize:'24px', fontStyle:'900', color:'#2c2514'
      }).setOrigin(0.5).setDepth(5);
      this.add.text(x, y - 86, semester.label, {
        fontFamily:'Noto Sans TC', fontSize:'18px', fontStyle:'900', color:'#204e29', stroke:'#fff', strokeThickness:5
      }).setOrigin(0.5).setDepth(6);

      this.tweens.add({
        targets:[body, roof, door, label],
        y:'-=4',
        duration:1750 + Math.round(Math.random() * 250),
        yoyo:true,
        repeat:-1,
        ease:'Sine.easeInOut'
      });

      const zone = this.add.zone(x, y + 26, 88, 96);
      this.physics.add.existing(zone, true);
      this.gates.push({ semester, zone, x, y });
    }

    consumeInteract(){
      if (this.time.now < this.interactCooldownUntil) return false;
      const kb = Phaser.Input.Keyboard.JustDown(this.keys.E);
      const touch = state.input.interact;
      if (touch) state.input.interact = false;
      const fired = kb || touch;
      if (fired) this.interactCooldownUntil = this.time.now + 250;
      return fired;
    }

    setHint(text){
      if (this.lastHint === text) return;
      this.lastHint = text;
      state.currentHint = text;
      app.ui.renderHUD();
    }

    update(){
      if (!this.player) return;
      if (state.overlay !== 'none' || state.modal !== 'none' || state.transitioning) {
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

      const defaultHint = '靠近六塔門口後按 E 進入';
      if (nearGate) {
        this.setHint(`${nearGate.semester.label}｜按 E 進入`);
        if (this.consumeInteract()) {
          this.player.body.setVelocity(0);
          app.runtime.gotoTower(nearGate.semester.id, 1);
        }
      } else {
        this.setHint(defaultHint);
      }
    }
  };
})(window.MathRPG);
