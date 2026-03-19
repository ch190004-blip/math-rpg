(function(app){
  const state = app.state;
  const world = () => app.data.world;

  app.scenes.TowerScene = class TowerScene extends Phaser.Scene{
    constructor(){ super('TowerScene'); }

    init(data){
      this.towerId = data?.towerId || state.currentTowerId || '7up';
      this.startFloor = data?.floor || state.currentTowerFloor || 1;
    }

    create(){
      state.sceneKey = 'TowerScene';
      state.currentTowerId = this.towerId;
      state.currentChapterId = null;
      state.currentTowerFloor = this.startFloor;
      state.currentHint = '左右移動，靠近左側下樓 / 右側上樓 / 中央章節門後按 E';
      app.ui.renderHUD();

      this.chapters = world().getChapters(this.towerId);
      this.semester = world().getSemester(this.towerId);

      this.floorSpacing = 260;
      this.worldWidth = 2200;
      this.worldHeight = this.chapters.length * this.floorSpacing + 260;

      this.cameras.main.setBackgroundColor('#d9f0ff');
      this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
      this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

      this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, this.worldWidth, this.worldHeight, 0xf4e8c7).setDepth(-8);
      this.add.rectangle(180, this.worldHeight / 2, 220, this.worldHeight, 0xd4ba8a).setDepth(-6);
      this.add.rectangle(this.worldWidth - 180, this.worldHeight / 2, 220, this.worldHeight, 0xd4ba8a).setDepth(-6);
      this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, 320, this.worldHeight, 0xf8efdb).setDepth(-7);

      for (let i = 0; i < this.chapters.length; i++) {
        const floor = i + 1;
        const y = this.floorY(floor);
        this.add.rectangle(this.worldWidth / 2, y + 34, this.worldWidth - 220, 180, 0xe8d7b1).setDepth(-4).setStrokeStyle(2, 0xeedfbf, 0.8);
        this.add.rectangle(this.worldWidth / 2, y, this.worldWidth - 280, 22, 0x7f6339).setDepth(-2);
        for (let j = 0; j < 7; j++) {
          this.add.rectangle(320 + j * 250, y - 68, 120, 12, 0xc7ab7c, 0.42).setDepth(-3);
        }
      }

      this.add.text(260, 74, this.semester.label, {
        fontFamily:'Press Start 2P',
        fontSize:'18px',
        color:'#6a4928'
      }).setDepth(5);

      this.add.text(this.worldWidth - 280, 74, '每章一層樓', {
        fontFamily:'Noto Sans TC',
        fontSize:'20px',
        fontStyle:'900',
        color:'#6a4928'
      }).setDepth(5);

      this.interactables = [];
      this.chapters.forEach((chapter, index) => {
        this.makeFloorDecor(chapter, index + 1, this.floorY(index + 1));
      });

      this.player = this.physics.add.sprite(420, this.floorY(this.startFloor) - 48, 'player-side-active').setDepth(8);
      this.player.body.setSize(20, 30).setOffset(10, 34);
      this.player.body.setAllowGravity(false);
      this.player.setCollideWorldBounds(true);

      this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
      this.cameras.main.setDeadzone(160, 120);

      this.keys = this.input.keyboard.addKeys('A,D,E,LEFT,RIGHT');
    }

    floorY(floor){
      const bottomY = this.worldHeight - 120;
      return bottomY - (floor - 1) * this.floorSpacing;
    }

    makeFloorDecor(chapter, floor, y){
      const isImplemented = !!chapter.implemented;

      this.add.text(290, y - 106, `${floor}F`, {
        fontFamily:'Press Start 2P',
        fontSize:'18px',
        color:'#6a4928'
      }).setDepth(4);

      this.add.text(this.worldWidth / 2, y - 118, chapter.label, {
        fontFamily:'Noto Sans TC',
        fontSize:'30px',
        fontStyle:'900',
        color:'#604123',
        stroke:'#fff',
        strokeThickness:6
      }).setOrigin(0.5).setDepth(4);

      this.add.text(this.worldWidth / 2, y - 84, chapter.subtitle || '', {
        fontFamily:'Noto Sans TC',
        fontSize:'16px',
        fontStyle:'900',
        color:'#7f6542',
        stroke:'#fff',
        strokeThickness:4
      }).setOrigin(0.5).setDepth(4);

      if (floor === 1) {
        this.makePad(220, y - 20, '回大廳', '#b9e6ff', () => app.runtime.gotoScene('LobbyScene', { entry:'tower-exit' }));
      } else {
        this.makePad(280, y - 20, '下樓', '#9fe4ff', () => this.teleportToFloor(floor - 1));
      }

      if (floor < this.chapters.length) {
        this.makePad(this.worldWidth - 280, y - 20, '上樓', '#ffe29a', () => this.teleportToFloor(floor + 1));
      }

      this.makeDoor(this.worldWidth / 2, y - 26, chapter.label, isImplemented ? '進入章節' : '施工中', isImplemented ? '#f7d774' : '#d3d3d3', () => {
        if (isImplemented) app.runtime.enterChapter(chapter.id);
        else app.ui.toast(`${chapter.label} 尚在建置中`, 'bad');
      });
    }

    makePad(x, y, label, color, onEnter){
      const colorNum = Number('0x' + color.replace('#', ''));
      const glow = this.add.rectangle(x, y + 28, 128, 24, colorNum, 0.32).setStrokeStyle(2, 0xffffff, 0.7).setDepth(2);
      const plate = this.add.image(x, y, 'lift-pad').setDepth(3);
      plate.setTint(colorNum);
      const text = this.add.text(x, y - 42, label, {
        fontFamily:'Noto Sans TC',
        fontSize:'18px',
        fontStyle:'900',
        color:'#5a3815',
        stroke:'#fff',
        strokeThickness:5
      }).setOrigin(0.5).setDepth(4);
      const zone = this.add.zone(x, y, 120, 84);
      this.physics.add.existing(zone, true);
      this.interactables.push({ zone, label, onEnter, floorBound:true });
      this.tweens.add({ targets:[glow, plate], alpha:{ from:.78, to:1 }, duration:1100, yoyo:true, repeat:-1 });
    }

    makeDoor(x, y, label, chipText, chipColor, onEnter){
      const chipNum = Number('0x' + chipColor.replace('#', ''));
      const door = this.add.image(x, y, 'chapter-door').setScale(0.92).setDepth(3);
      door.setTint(chipNum);
      const labelBg = this.add.rectangle(x, y - 78, 340, 32, 0xffffff, 0.46).setStrokeStyle(2, chipNum, 0.4).setDepth(3.5);
      this.add.text(x, y - 78, label, {
        fontFamily:'Noto Sans TC',
        fontSize:'20px',
        fontStyle:'900',
        color:'#5f3b17'
      }).setOrigin(0.5).setDepth(4);
      this.add.text(x, y + 72, chipText, {
        fontFamily:'Noto Sans TC',
        fontSize:'16px',
        fontStyle:'900',
        color:'#5f3b17',
        backgroundColor:'rgba(255,255,255,.7)',
        padding:{ x:12, y:5 }
      }).setOrigin(0.5).setDepth(4);
      const zone = this.add.zone(x, y + 8, 110, 126);
      this.physics.add.existing(zone, true);
      this.interactables.push({ zone, label, onEnter });
      this.tweens.add({ targets:door, y:y - 4, duration:1600, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
    }

    teleportToFloor(floor){
      const from = state.currentTowerFloor;
      state.currentTowerFloor = floor;
      const x = floor > from ? 380 : this.worldWidth - 380;
      this.player.setPosition(x, this.floorY(floor) - 48);
      this.player.setVelocity(0, 0);
      this.cameras.main.flash(120, 255, 255, 255, false);
      app.ui.renderHUD();
    }

    consumeInteract(){
      const kb = Phaser.Input.Keyboard.JustDown(this.keys.E);
      const touch = state.input.interact;
      if (touch) state.input.interact = false;
      return kb || touch;
    }

    update(){
      if (state.overlay !== 'none' || state.modal !== 'none') {
        this.player.setVelocity(0);
        return;
      }

      const left = this.keys.LEFT.isDown || this.keys.A.isDown || state.input.left;
      const right = this.keys.RIGHT.isDown || this.keys.D.isDown || state.input.right;
      const speed = 180 * app.config.game.speedMultiplier;
      if (left) this.player.setVelocityX(-speed);
      else if (right) this.player.setVelocityX(speed);
      else this.player.setVelocityX(0);

      this.player.setVelocityY(0);
      this.player.y = this.floorY(state.currentTowerFloor) - 48;

      let nearby = null;
      this.interactables.forEach((item) => {
        if (Math.abs(item.zone.y - this.player.y) < 90 &&
            Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), item.zone.getBounds())) {
          nearby = item;
        }
      });

      const defaultHint = '左右移動，靠近左側下樓 / 右側上樓 / 中央章節門後按 E';
      if (nearby) {
        state.currentHint = `${nearby.label}｜按 E 互動`;
        app.ui.renderHUD();
        if (this.consumeInteract()) nearby.onEnter();
      } else if (state.currentHint !== defaultHint) {
        state.currentHint = defaultHint;
        app.ui.renderHUD();
      }
    }
  };
})(window.MathRPG);
