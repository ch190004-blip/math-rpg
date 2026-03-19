(function(app){
  const state = app.state;
  const world = () => app.data.world;

  function shuffled(list){
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  app.scenes.FieldScene = class FieldScene extends Phaser.Scene{
    constructor(){ super('FieldScene'); }

    init(data){
      this.chapterId = data?.chapterId || state.currentChapterId || '7up-1-1';
    }

    create(){
      this.chapter = world().getChapter(this.chapterId);
      this.bank = world().getBank(this.chapterId);
      state.sceneKey = 'FieldScene';
      state.currentChapterId = this.chapterId;
      state.currentHint = '靠近任何一隻史萊姆按 E 開戰；同區已混合多種題型，方便直接選題。';
      app.ui.renderHUD();

      const theme = this.chapter?.theme || { sky:'#c7f5ff', grass:'#79d38a', path:'#d9c08a' };
      const W = 2200;
      const H = 1450;
      this.cameras.main.setBackgroundColor(theme.sky);
      this.physics.world.setBounds(0, 0, W, H);
      this.cameras.main.setBounds(0, 0, W, H);

      const grassTint = Number('0x' + theme.grass.replace('#',''));
      const pathTint = Number('0x' + theme.path.replace('#',''));
      this.add.tileSprite(W/2, H/2, W, H, 'grass-tile').setTint(grassTint);
      this.add.rectangle(W/2, H - 180, W - 160, 200, pathTint, 0.38).setDepth(0).setStrokeStyle(3, 0xffffff, 0.18);
      this.add.rectangle(W/2, H/2, 1320, 760, 0xcff0be, 0.22).setDepth(0).setStrokeStyle(3, 0xffffff, 0.2);
      this.add.ellipse(W/2, H/2, 1360, 820, 0xe2f7d8, 0.22).setDepth(0.1);

      const forbidden = { x1: 460, x2: 1780, y1: 280, y2: 1160 };
      for (let i = 0; i < 34; i++) {
        let x = Phaser.Math.Between(40, W - 40);
        let y = Phaser.Math.Between(40, H - 40);
        if (x > forbidden.x1 && x < forbidden.x2 && y > forbidden.y1 && y < forbidden.y2) {
          i -= 1;
          continue;
        }
        this.add.image(x, y, 'tree')
          .setScale(Phaser.Math.FloatBetween(0.86, 1.14))
          .setDepth(1);
      }
      for (let i = 0; i < 90; i++) {
        let x = Phaser.Math.Between(20, W - 20);
        let y = Phaser.Math.Between(20, H - 20);
        if (x > 560 && x < 1660 && y > 360 && y < 1080) {
          i -= 1;
          continue;
        }
        this.add.image(x, y, 'flower')
          .setScale(Phaser.Math.FloatBetween(0.64, 1.18))
          .setDepth(1);
      }

      this.add.text(W/2, 108, this.chapter?.fieldTitle || this.chapter?.label || '章節原野', {
        fontFamily:'Noto Sans TC',
        fontSize:'30px',
        fontStyle:'900',
        color:'#16351a',
        stroke:'#fff',
        strokeThickness:6
      }).setOrigin(0.5).setDepth(5);

      this.add.text(W/2, 150, this.chapter?.fieldHint || '同題型同色；不同題型已混在同一區域活動。', {
        fontFamily:'Noto Sans TC',
        fontSize:'18px',
        fontStyle:'900',
        color:'#174425',
        stroke:'#fff',
        strokeThickness:5
      }).setOrigin(0.5).setDepth(5);

      this.add.text(W/2, 190, '中央混區史萊姆草原', {
        fontFamily:'Noto Sans TC',
        fontSize:'18px',
        fontStyle:'900',
        color:'#2f5a2e',
        backgroundColor:'rgba(255,255,255,.45)',
        padding:{ x:12, y:5 }
      }).setOrigin(0.5).setDepth(5);

      this.player = this.physics.add.sprite(300, H - 210, 'player-top-active').setDepth(8);
      const floorFromChapter = Number((this.chapterId.split('-')[1] || '1'));
      state.currentTowerFloor = floorFromChapter;
      this.player.body.setSize(20, 30).setOffset(10, 38);
      this.player.setCollideWorldBounds(true);
      this.player.invulnUntil = 0;

      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.keys = this.input.keyboard.addKeys('W,A,S,D,E,UP,DOWN,LEFT,RIGHT');

      this.backGate = this.add.image(160, H - 200, 'chapter-door').setScale(0.84).setDepth(4);
      this.backZone = this.add.zone(160, H - 190, 96, 128);
      this.physics.add.existing(this.backZone, true);
      this.add.text(160, H - 96, `回${world().getSemester(state.currentTowerId).label}`, {
        fontFamily:'Noto Sans TC',
        fontSize:'20px',
        fontStyle:'900',
        color:'#56391f',
        stroke:'#fff',
        strokeThickness:5
      }).setOrigin(0.5).setDepth(5);

      this.legendChips = [];
      const sampleTypes = (this.bank?.types || []).slice(0, 10);
      sampleTypes.forEach((meta, index) => {
        const x = 650 + index * 165;
        const y = H - 86;
        const colorNum = Number('0x' + meta.color.replace('#',''));
        this.add.circle(x - 46, y, 16, colorNum, 0.95).setDepth(4);
        this.add.text(x, y, `題型 ${meta.id}`, {
          fontFamily:'Noto Sans TC',
          fontSize:'15px',
          fontStyle:'900',
          color:'#254227',
          backgroundColor:'rgba(255,255,255,.52)',
          padding:{ x:10, y:4 }
        }).setOrigin(0.5).setDepth(4);
      });

      this.slimeGroup = this.physics.add.group();
      this.slimeMeta = {};
      this.spawnSlimes();
    }

    spawnSlimes(){
      const ring = [
        [780, 980], [930, 840], [1100, 720], [1280, 820], [1480, 700], [1650, 860],
        [1740, 1010], [1600, 1110], [1420, 980], [1230, 1080], [1020, 1150], [850, 1090],
        [760, 690], [930, 560], [1170, 500], [1420, 540], [1610, 620], [1760, 760],
        [1820, 930], [1710, 1180], [1480, 1240], [1220, 1260], [980, 1230], [780, 1170]
      ];
      const slimes = shuffled((this.bank?.slimeCatalog || []).filter(slime => !state.defeatedSlimes[slime.id]));
      slimes.forEach((slime, index) => {
        const pos = ring[index % ring.length];
        const sprite = this.physics.add.sprite(pos[0], pos[1], slime.textureKey).setDepth(4);
        sprite.setBounce(1, 1).setCollideWorldBounds(true);
        sprite.body.setCircle(22, 24, 18);
        sprite.setScale(1.05);
        sprite.slimeData = slime;
        const label = this.add.text(pos[0], pos[1] - 54, `T${slime.typeId}`, {
          fontFamily:'Press Start 2P',
          fontSize:'12px',
          color:'#10331e',
          stroke:'#ffffff',
          strokeThickness:4
        }).setOrigin(0.5).setDepth(5);
        sprite.labelText = label;
        sprite.wanderUntil = 0;
        sprite.roamHome = { x: pos[0], y: pos[1], radius: 110 + (index % 4) * 18 };
        this.slimeGroup.add(sprite);
        this.slimeMeta[slime.id] = sprite;
        this.setSlimeVelocity(sprite);
      });
    }

    setSlimeVelocity(sprite){
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(58, 108) * app.config.game.speedMultiplier * 0.6;
      sprite.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      sprite.wanderUntil = this.time.now + Phaser.Math.Between(1000, 1800);
    }

    keepSlimeInRoam(sprite){
      const home = sprite.roamHome;
      if (!home) return;
      const dx = sprite.x - home.x;
      const dy = sprite.y - home.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > home.radius) {
        const angle = Math.atan2(home.y - sprite.y, home.x - sprite.x);
        const speed = 120;
        sprite.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        sprite.wanderUntil = this.time.now + 700;
      }
    }

    consumeInteract(){
      const kb = Phaser.Input.Keyboard.JustDown(this.keys.E);
      const touch = state.input.interact;
      if (touch) state.input.interact = false;
      return kb || touch;
    }

    removeSlimeById(slimeId){
      const slime = this.slimeMeta[slimeId];
      if (!slime) return;
      if (slime.labelText) slime.labelText.destroy();
      slime.disableBody(true, true);
      delete this.slimeMeta[slimeId];
    }

    update(){
      if (state.overlay !== 'none' || state.modal !== 'none') {
        this.player.body.setVelocity(0);
        return;
      }

      let vx = 0, vy = 0;
      const left = this.keys.LEFT.isDown || this.keys.A.isDown || state.input.left;
      const right = this.keys.RIGHT.isDown || this.keys.D.isDown || state.input.right;
      const up = this.keys.UP.isDown || this.keys.W.isDown || state.input.up;
      const down = this.keys.DOWN.isDown || this.keys.S.isDown || state.input.down;
      const move = 172 * app.config.game.speedMultiplier;

      if (left) vx = -move;
      else if (right) vx = move;
      if (up) vy = -move;
      else if (down) vy = move;
      this.player.body.setVelocity(vx, vy);
      if (vx !== 0 || vy !== 0) this.player.body.velocity.normalize().scale(move);

      let nearby = null;
      if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.backZone.getBounds())) {
        nearby = { type:'exit', label:'返回學期之塔' };
      }

      this.slimeGroup.getChildren().forEach((sprite) => {
        if (!sprite.active) return;
        if (sprite.wanderUntil < this.time.now) this.setSlimeVelocity(sprite);
        this.keepSlimeInRoam(sprite);
        if (sprite.labelText) {
          sprite.labelText.setPosition(sprite.x, sprite.y - 54);
          sprite.labelText.setAlpha(0.9);
        }
        if (!nearby && this.time.now > (this.player.invulnUntil || 0) &&
            Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), sprite.getBounds())) {
          nearby = { type:'slime', sprite, label:`${sprite.slimeData.name}｜按 E 開戰` };
        }
      });

      const defaultHint = '靠近任何一隻史萊姆按 E 開戰；同區已混合多種題型，方便直接選題。';
      if (nearby) {
        state.currentHint = nearby.label;
        app.ui.renderHUD();
        if (this.consumeInteract()) {
          if (nearby.type === 'exit') {
            app.runtime.gotoTower(state.currentTowerId, state.currentTowerFloor);
            return;
          }
          if (nearby.type === 'slime') {
            app.runtime.openBattle({
              chapterId: this.chapterId,
              typeId: nearby.sprite.slimeData.typeId,
              mode: nearby.sprite.slimeData.mode,
              slime: nearby.sprite.slimeData,
              sourceScene: 'FieldScene'
            });
            return;
          }
        }
      } else if (state.currentHint !== defaultHint) {
        state.currentHint = defaultHint;
        app.ui.renderHUD();
      }
    }
  };
})(window.MathRPG);
