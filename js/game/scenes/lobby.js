(function(app){
  const state = app.state;
  const world = () => app.data.world;

  app.scenes.LobbyScene = class LobbyScene extends Phaser.Scene{
    constructor(){ super('LobbyScene'); }

    create(){
      state.sceneKey = 'LobbyScene';
      state.currentChapterId = null;
      state.currentHint = '方向鍵 / WASD 移動，靠近塔門後按 E 進入';
      app.ui.renderHUD();

      const W = 1800;
      const H = 1220;
      this.cameras.main.setBackgroundColor('#cff8ff');
      this.physics.world.setBounds(0, 0, W, H);
      this.cameras.main.setBounds(0, 0, W, H);

      this.add.tileSprite(W/2, H/2, W, H, 'grass-tile');
      this.add.rectangle(W/2, H/2, 560, 560, 0xe7d1a5, 0.88).setDepth(0).setStrokeStyle(6, 0xf7edd0, 0.9);
      this.add.rectangle(W/2, H/2, 240, H - 220, 0xe0be85, 0.64).setDepth(0);
      this.add.rectangle(W/2, H/2, W - 300, 240, 0xe0be85, 0.64).setDepth(0);
      this.add.rectangle(W/2, H/2, 180, 180, 0xf8efcc, 0.95).setDepth(0.1).setStrokeStyle(4, 0xffffff, 0.8);

      const decoZones = [
        [160, 160, 210, 150], [900, 110, 320, 110], [1640, 160, 210, 150],
        [160, 1060, 210, 150], [900, 1110, 320, 110], [1640, 1060, 210, 150]
      ];
      decoZones.forEach(([x, y, w, h], i) => {
        this.add.rectangle(x, y, w, h, i % 2 ? 0xb8eebd : 0xa7e2af, 0.28).setDepth(0);
      });

      for (let i = 0; i < 42; i++) {
        const x = Phaser.Math.Between(40, W - 40);
        const y = Phaser.Math.Between(40, H - 40);
        if (Math.abs(x - W / 2) < 320 || Math.abs(y - H / 2) < 180) continue;
        this.add.image(x, y, 'tree').setDepth(1).setScale(Phaser.Math.FloatBetween(0.88, 1.12));
      }
      for (let i = 0; i < 90; i++) {
        const x = Phaser.Math.Between(20, W - 20);
        const y = Phaser.Math.Between(20, H - 20);
        if (Math.abs(x - W / 2) < 260 && Math.abs(y - H / 2) < 260) continue;
        this.add.image(x, y, 'flower').setDepth(1).setScale(Phaser.Math.FloatBetween(0.72, 1.16));
      }

      this.add.text(W/2, 92, 'Math RPG｜六塔大廳原野', {
        fontFamily: 'Noto Sans TC',
        fontSize: '34px',
        fontStyle: '900',
        color: '#134226',
        stroke: '#ffffff',
        strokeThickness: 7
      }).setOrigin(0.5).setDepth(5);

      this.add.text(W/2, 136, '六座塔入口縮成明確幾格門口；進門很直覺，封測時不會迷路。', {
        fontFamily: 'Noto Sans TC',
        fontSize: '18px',
        fontStyle: '900',
        color: '#1c4d2c',
        stroke: '#ffffff',
        strokeThickness: 5
      }).setOrigin(0.5).setDepth(5);

      this.add.text(W/2, H/2, '中央廣場', {
        fontFamily:'Noto Sans TC',
        fontSize:'22px',
        fontStyle:'900',
        color:'#735220',
        stroke:'#fff',
        strokeThickness:5
      }).setOrigin(0.5).setDepth(4);

      this.player = this.physics.add.sprite(W/2, H/2 + 180, 'player-top-active').setDepth(8);
      this.player.body.setSize(20, 30).setOffset(10, 38);
      this.player.setCollideWorldBounds(true);

      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys('W,A,S,D,E');

      this.gates = [];
      world().semesters.forEach((semester) => this.createTowerGate(semester));

      this.centerGlow = this.add.circle(W/2, H/2, 92, 0xffffff, 0.16).setDepth(2);
      this.tweens.add({
        targets: this.centerGlow,
        alpha: { from: 0.08, to: 0.24 },
        duration: 1600,
        yoyo: true,
        repeat: -1
      });
    }

    createTowerGate(semester){
      const base = this.add.container(semester.lobbyX, semester.lobbyY).setDepth(4);
      const glowColor = Number('0x' + semester.color.replace('#', ''));
      const pad = this.add.rectangle(0, 40, 132, 34, glowColor, 0.3).setStrokeStyle(3, 0xffffff, .75);
      const gateBack = this.add.rectangle(0, -12, 112, 118, glowColor, 0.18).setStrokeStyle(3, 0xffffff, .55);
      const tower = this.add.image(0, -8, 'tower-gate').setScale(0.62);
      const labelBg = this.add.rectangle(0, 84, 152, 34, 0xffffff, 0.5).setStrokeStyle(2, glowColor, .5);
      const label = this.add.text(0, 84, semester.label, {
        fontFamily:'Noto Sans TC',
        fontSize:'21px',
        fontStyle:'900',
        color:'#163c24'
      }).setOrigin(0.5);
      const sub = this.add.text(0, 111, '碰門後按 E', {
        fontFamily:'Noto Sans TC',
        fontSize:'14px',
        fontStyle:'900',
        color:'#295032',
        stroke:'#fff',
        strokeThickness:4
      }).setOrigin(0.5);
      base.add([pad, gateBack, tower, labelBg, label, sub]);

      const zone = this.add.zone(semester.lobbyX, semester.lobbyY + 16, 96, 74);
      this.physics.add.existing(zone, true);
      this.gates.push({ semester, zone, base });

      this.tweens.add({
        targets: base,
        y: semester.lobbyY - 4,
        duration: Phaser.Math.Between(1800, 2300),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
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
      const move = 170 * app.config.game.speedMultiplier;

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

      if (nearGate) {
        state.currentHint = `已站在 ${nearGate.semester.label} 門口，按 E 進塔`;
        app.ui.renderHUD();
        if (this.consumeInteract()) app.runtime.gotoTower(nearGate.semester.id, 1);
      } else if (state.currentHint !== '方向鍵 / WASD 移動，靠近塔門後按 E 進入') {
        state.currentHint = '方向鍵 / WASD 移動，靠近塔門後按 E 進入';
        app.ui.renderHUD();
      }
    }
  };
})(window.MathRPG);
