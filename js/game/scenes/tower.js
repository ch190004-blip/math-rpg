
(function(app){
  const state = app.state;

  app.scenes.TowerScene = class TowerScene extends Phaser.Scene{
    constructor(){ super('TowerScene'); }

    create(){
      state.sceneKey = 'TowerScene';
      state.currentHint = '左右移動、跳躍；站上升降台按 E 上下層，章節門按 E 進入';
      app.ui.renderHUD();

      this.cameras.main.setBackgroundColor('#d6f6ff');
      this.physics.world.setBounds(0, 0, 2600, 760);
      this.cameras.main.setBounds(0, 0, 2600, 760);
      this.physics.world.gravity.y = 1800;

      this.add.rectangle(1300, 380, 2600, 760, 0xdff8ff).setDepth(-5);
      for (let i = 0; i < 28; i++) {
        this.add.rectangle(50 + i * 95, 110, 56, 20, 0xffffff, 0.45).setDepth(-4);
      }

      this.platforms = this.physics.add.staticGroup();
      this.floorYs = [640, 430, 220];
      this.makeStaticPlatform(1300, 740, 2600, 40, 0xe8d3a6);
      this.floorYs.forEach((y) => {
        this.makeStaticPlatform(1320, y, 2250, 24, 0xe8d3a6);
      });

      this.add.rectangle(110, 380, 160, 760, 0xdcc99c).setDepth(-3);
      this.add.rectangle(2490, 380, 160, 760, 0xdcc99c).setDepth(-3);
      this.add.rectangle(320, 380, 200, 760, 0xf0deb7).setDepth(-3);
      this.add.rectangle(2240, 380, 200, 760, 0xf0deb7).setDepth(-3);
      this.add.text(320, 70, '七 上 之 塔', {
        fontFamily: 'Press Start 2P',
        fontSize: '18px',
        color: '#6e4e2b'
      }).setOrigin(0.5);

      this.add.text(520, 600, '第 1 區｜七上起點', {
        fontFamily: 'Noto Sans TC',
        fontSize: '24px',
        fontStyle: '900',
        color: '#6e4e2b'
      });
      this.add.text(520, 390, '第 2 區｜進階章節', {
        fontFamily: 'Noto Sans TC',
        fontSize: '24px',
        fontStyle: '900',
        color: '#6e4e2b'
      });
      this.add.text(520, 180, '第 3 區｜挑戰章節', {
        fontFamily: 'Noto Sans TC',
        fontSize: '24px',
        fontStyle: '900',
        color: '#6e4e2b'
      });

      this.player = this.physics.add.sprite(430, 580, 'player-side-active').setDepth(6);
      this.player.body.setSize(20, 30).setOffset(10, 34);
      this.player.setCollideWorldBounds(true);
      this.physics.add.collider(this.player, this.platforms);

      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.cameras.main.setDeadzone(140, 90);

      this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE,UP,LEFT,RIGHT');

      this.interactables = [];
      this.makeDoor(170, 586, '回大廳', () => app.runtime.gotoScene('LobbyScene', { entry: 'tower-exit' }));
      this.makeDoor(760, 586, '1-1', () => app.runtime.gotoScene('Field11Scene', { entry: 'entry' }));
      this.makeDoor(1120, 586, '1-2', null, true);
      this.makeDoor(980, 376, '1-3', null, true);
      this.makeDoor(1360, 376, '1-4', null, true);
      this.makeDoor(1260, 166, '敬請期待', null, true);

      this.makeLift(320, 622, '上樓', () => this.teleportToFloor(1));
      this.makeLift(320, 412, '上樓', () => this.teleportToFloor(2));
      this.makeLift(320, 242, '下樓', () => this.teleportToFloor(1));
      this.makeLift(320, 452, '下樓', () => this.teleportToFloor(0));
      this.makeLift(2240, 622, '上樓', () => this.teleportToFloor(1));
      this.makeLift(2240, 412, '上樓', () => this.teleportToFloor(2));
      this.makeLift(2240, 242, '下樓', () => this.teleportToFloor(1));
      this.makeLift(2240, 452, '下樓', () => this.teleportToFloor(0));

      this.add.text(320, 676, '左升降台', { fontFamily:'Noto Sans TC', fontSize:'16px', fontStyle:'900', color:'#6e4e2b' }).setOrigin(0.5);
      this.add.text(2240, 676, '右升降台', { fontFamily:'Noto Sans TC', fontSize:'16px', fontStyle:'900', color:'#6e4e2b' }).setOrigin(0.5);
    }

    makeStaticPlatform(x, y, width, height, color){
      const rect = this.add.rectangle(x, y, width, height, color).setDepth(-2);
      this.physics.add.existing(rect, true);
      this.platforms.add(rect);
    }

    makeDoor(x, y, label, onEnter, locked=false){
      this.add.image(x, y - 26, 'chapter-door').setScale(0.84).setDepth(2);
      this.add.text(x, y + 56, label, {
        fontFamily:'Noto Sans TC',
        fontSize:'18px',
        fontStyle:'900',
        color: locked ? '#79634f' : '#5b3b24',
        stroke:'#fff',
        strokeThickness:5
      }).setOrigin(0.5).setDepth(3);
      const zone = this.add.zone(x, y, 96, 132);
      this.physics.add.existing(zone, true);
      zone.label = label;
      zone.onEnter = onEnter;
      zone.locked = locked;
      zone.kind = 'door';
      this.interactables.push(zone);
    }

    makeLift(x, y, label, onEnter){
      this.add.image(x, y - 2, 'lift-pad').setDepth(2);
      this.add.text(x, y - 26, label, {
        fontFamily:'Noto Sans TC',
        fontSize:'16px',
        fontStyle:'900',
        color:'#134124',
        stroke:'#fff',
        strokeThickness:4
      }).setOrigin(0.5).setDepth(3);
      const zone = this.add.zone(x, y, 98, 54);
      this.physics.add.existing(zone, true);
      zone.label = label;
      zone.onEnter = onEnter;
      zone.locked = false;
      zone.kind = 'lift';
      this.interactables.push(zone);
    }

    teleportToFloor(index){
      const y = this.floorYs[index] - 44;
      const currentX = this.player.x < 1300 ? 320 : 2240;
      this.player.setPosition(currentX, y);
      this.player.body.setVelocity(0, 0);
    }

    consumeInteract(){
      const kb = Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
      const touch = state.input.interact;
      if (touch) state.input.interact = false;
      return kb || touch;
    }

    update(){
      if (state.overlay !== 'none') {
        this.player.body.setVelocity(0, 0);
        return;
      }

      const left = this.keys.LEFT.isDown || this.keys.A.isDown || state.input.left;
      const right = this.keys.RIGHT.isDown || this.keys.D.isDown || state.input.right;
      const jump = this.keys.UP.isDown || this.keys.W.isDown || state.input.jump;

      const speed = 210 * app.config.game.speedMultiplier;
      this.player.setVelocityX(left ? -speed : right ? speed : 0);

      if (jump && this.player.body.blocked.down) {
        this.player.setVelocityY(-820);
      }

      let nearest = null;
      let best = Infinity;
      this.interactables.forEach((zone) => {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
        if (d < 90 && d < best) {
          best = d;
          nearest = zone;
        }
      });

      let nextHint = '左右移動、跳躍；站上升降台按 E 上下層，章節門按 E 進入';
      if (nearest) {
        nextHint = nearest.kind === 'lift'
          ? `按 E ${nearest.label}`
          : (nearest.locked ? `${nearest.label} 尚未開放` : `按 E 進入 ${nearest.label}`);
        if (this.consumeInteract()) {
          if (nearest.locked || !nearest.onEnter) {
            app.ui.toast('這個章節稍後開放', 'bad');
          } else {
            nearest.onEnter();
            return;
          }
        }
      }
      if (nextHint !== state.currentHint) {
        state.currentHint = nextHint;
        app.ui.renderHUD();
      }
    }
  };
})(window.MathRPG);
