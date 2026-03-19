
(function(app){
  const state = app.state;

  app.scenes.LobbyScene = class LobbyScene extends Phaser.Scene{
    constructor(){ super('LobbyScene'); }

    create(){
      state.sceneKey = 'LobbyScene';
      state.currentHint = '方向鍵 / WASD 移動，靠近塔門後按 E 進入';
      app.ui.renderHUD();

      this.cameras.main.setBackgroundColor('#b9efff');
      this.physics.world.setBounds(0,0,2400,1600);
      this.cameras.main.setBounds(0,0,2400,1600);

      this.add.tileSprite(1200, 800, 2400, 1600, 'grass-tile');
      this.add.tileSprite(1200, 800, 340, 1600, 'path-tile').setAlpha(0.92);

      for(let i=0;i<44;i++){
        this.add.image(Phaser.Math.Between(60, 2340), Phaser.Math.Between(80, 1540), 'tree')
          .setDepth(2)
          .setScale(Phaser.Math.FloatBetween(0.85, 1.2));
      }
      for(let i=0;i<80;i++){
        this.add.image(Phaser.Math.Between(30, 2370), Phaser.Math.Between(30, 1570), 'flower')
          .setDepth(1.2)
          .setScale(Phaser.Math.FloatBetween(0.7, 1.2));
      }

      this.tower = this.add.image(1200, 285, 'tower-gate').setDepth(3).setScale(0.95);
      this.towerDoorGlow = this.add.rectangle(1200, 350, 72, 56, 0xfff1b2, 0.18).setDepth(2.5);
      this.towerDoorGlow.setStrokeStyle(2, 0xffffff, 0.5);
      this.add.text(1200, 404, '七上之塔', {
        fontFamily: 'Noto Sans TC',
        fontSize: '28px',
        fontStyle: '900',
        color: '#18351a',
        stroke: '#ffffff',
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(4);

      this.player = this.physics.add.sprite(1200, 1250, 'player-top-active').setDepth(5);
      this.player.body.setSize(20, 30).setOffset(10, 38);
      this.player.setCollideWorldBounds(true);

      this.portalZone = this.add.zone(1200, 350, 86, 72);
      this.physics.add.existing(this.portalZone, true);
      this.portalHint = false;

      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE');

      this.physics.add.overlap(this.player, this.portalZone, () => {
        this.portalHint = true;
        state.currentHint = '已靠近七上之塔，按 E 進入';
        app.ui.renderHUD();
      });

      this.add.text(1200, 1460, '世界入口草原', {
        fontFamily: 'Press Start 2P',
        fontSize: '18px',
        color: '#234c1f'
      }).setOrigin(0.5).setDepth(4);

      this.hasEntered = false;
    }

    consumeInteract(){
      const kb = Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
      const touch = state.input.interact;
      if (touch) state.input.interact = false;
      return kb || touch;
    }

    update(){
      if (state.overlay !== 'none') {
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
      if (vx !== 0 || vy !== 0) {
        this.player.body.velocity.normalize().scale(move);
      }

      const isNearDoor = Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.portalZone.getBounds());
      if (isNearDoor) {
        if (this.consumeInteract() && !this.hasEntered) {
          this.hasEntered = true;
          app.runtime.gotoScene('TowerScene', { entry: 'lobby' });
          return;
        }
      } else if (state.currentHint !== '方向鍵 / WASD 移動，靠近塔門後按 E 進入') {
        state.currentHint = '方向鍵 / WASD 移動，靠近塔門後按 E 進入';
        app.ui.renderHUD();
      }
    }
  };
})(window.MathRPG);
