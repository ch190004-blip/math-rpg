
(function(app){
  const state = app.state;
  const bank = () => app.data.chapter11;

  app.scenes.Field11Scene = class Field11Scene extends Phaser.Scene{
    constructor(){ super('Field11Scene'); }

    create(){
      state.sceneKey = 'Field11Scene';
      state.currentHint = '靠近史萊姆按 E 開戰，答對後會拿金幣再回到原野';
      app.ui.renderHUD();

      this.cameras.main.setBackgroundColor('#c7f5ff');
      this.physics.world.setBounds(0,0,2800,1800);
      this.cameras.main.setBounds(0,0,2800,1800);

      this.add.tileSprite(1400, 900, 2800, 1800, 'grass-tile');
      this.add.tileSprite(980, 900, 280, 1800, 'path-tile').setAlpha(0.62);
      this.add.tileSprite(1920, 900, 220, 1800, 'path-tile').setAlpha(0.45);
      this.add.tileSprite(1450, 1450, 1400, 220, 'path-tile').setAlpha(0.38);

      for(let i=0;i<55;i++){
        this.add.image(Phaser.Math.Between(70,2730), Phaser.Math.Between(70,1730), 'tree')
          .setScale(Phaser.Math.FloatBetween(0.8,1.18))
          .setDepth(1);
      }
      for(let i=0;i<110;i++){
        this.add.image(Phaser.Math.Between(20,2780), Phaser.Math.Between(20,1780), 'flower')
          .setScale(Phaser.Math.FloatBetween(.6, 1.22))
          .setDepth(1);
      }

      this.player = this.physics.add.sprite(360, 1450, 'player-top-active').setDepth(6);
      this.player.body.setSize(20, 30).setOffset(10, 38);
      this.player.setCollideWorldBounds(true);
      this.player.invulnUntil = 0;

      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

      this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE,UP,DOWN,LEFT,RIGHT');

      this.backGate = this.add.image(220, 1540, 'chapter-door').setScale(0.88).setDepth(4);
      this.backZone = this.add.zone(220, 1530, 96, 128);
      this.physics.add.existing(this.backZone, true);
      this.add.text(220, 1624, '回七上之塔', {
        fontFamily:'Noto Sans TC',
        fontSize:'20px',
        fontStyle:'900',
        color:'#56391f',
        stroke:'#fff',
        strokeThickness:5
      }).setOrigin(0.5).setDepth(5);

      this.add.text(1400, 110, '1-1｜負數與數線・十系史萊姆原野', {
        fontFamily:'Noto Sans TC',
        fontSize:'30px',
        fontStyle:'900',
        color:'#16351a',
        stroke:'#fff',
        strokeThickness:6
      }).setOrigin(0.5).setDepth(5);

      this.add.text(1400, 154, '同題型同色；頭上晶角的是素養題史萊姆', {
        fontFamily:'Noto Sans TC',
        fontSize:'18px',
        fontStyle:'900',
        color:'#153b22',
        stroke:'#fff',
        strokeThickness:5
      }).setOrigin(0.5).setDepth(5);

      this.slimeGroup = this.physics.add.group();
      this.slimeMeta = {};
      this.spawnSlimes();
    }

    spawnSlimes(){
      const positions = [
        [700, 1410], [880, 1140], [1020, 700], [1260, 1310], [1440, 920],
        [1680, 620], [1900, 1330], [2140, 980], [2380, 720], [2510, 1280],
        [760, 510], [980, 1510], [1180, 480], [1380, 640], [1600, 1510],
        [1820, 1140], [2080, 560], [2260, 1450], [2460, 980], [2620, 600]
      ];
      bank().slimeCatalog.forEach((slime, index) => {
        const pos = positions[index];
        if (!pos || state.defeatedSlimes[slime.id]) return;
        const sprite = this.physics.add.sprite(pos[0], pos[1], slime.textureKey).setDepth(4);
        sprite.setBounce(1,1).setCollideWorldBounds(true);
        sprite.body.setCircle(22, 24, 18);
        sprite.slimeData = slime;
        sprite.wanderUntil = 0;
        sprite.wanderSpeed = Phaser.Math.Between(80, 180);
        this.slimeGroup.add(sprite);
        this.slimeMeta[slime.id] = sprite;
        this.setSlimeVelocity(sprite);
      });
    }

    setSlimeVelocity(sprite){
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(80, 180);
      sprite.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      sprite.wanderUntil = this.time.now + Phaser.Math.Between(1100, 2200);
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

      const left = this.keys.LEFT.isDown || this.keys.A.isDown || state.input.left;
      const right = this.keys.RIGHT.isDown || this.keys.D.isDown || state.input.right;
      const up = this.keys.UP.isDown || this.keys.W.isDown || state.input.up;
      const down = this.keys.DOWN.isDown || this.keys.S.isDown || state.input.down;

      let vx = 0, vy = 0;
      const move = 175 * app.config.game.speedMultiplier;
      if (left) vx = -move;
      else if (right) vx = move;
      if (up) vy = -move;
      else if (down) vy = move;

      this.player.body.setVelocity(vx, vy);
      if (vx !== 0 || vy !== 0) {
        this.player.body.velocity.normalize().scale(move);
      }

      this.slimeGroup.getChildren().forEach((sprite) => {
        if (this.time.now > sprite.wanderUntil) this.setSlimeVelocity(sprite);
      });

      let nextHint = '靠近史萊姆按 E 開戰，答對後會拿金幣再回到原野';
      let nearest = null;
      let best = Infinity;

      this.slimeGroup.getChildren().forEach((sprite) => {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
        if (d < 112 && d < best && this.time.now > (this.player.invulnUntil || 0)) {
          best = d;
          nearest = sprite;
        }
      });

      if (nearest) {
        const typeMeta = bank().getTypeMeta(nearest.slimeData.typeId);
        nextHint = `按 E 挑戰 ${nearest.slimeData.name}｜${typeMeta.slug}`;
        if (this.consumeInteract()) {
          app.runtime.openBattle({
            chapter: '1-1',
            typeId: nearest.slimeData.typeId,
            mode: nearest.slimeData.mode,
            slime: nearest.slimeData,
            sourceScene: 'Field11Scene'
          });
          return;
        }
      } else if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.backZone.getBounds())) {
        nextHint = '按 E 回七上之塔';
        if (this.consumeInteract()) {
          app.runtime.gotoScene('TowerScene', { from: 'field11' });
          return;
        }
      }

      if (nextHint !== state.currentHint) {
        state.currentHint = nextHint;
        app.ui.renderHUD();
      }
    }

    removeSlimeById(slimeId){
      const sprite = this.slimeMeta[slimeId];
      if (sprite) {
        sprite.destroy();
        delete this.slimeMeta[slimeId];
      }
    }
  };
})(window.MathRPG);
