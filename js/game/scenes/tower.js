
(function(app){
  const state = app.state;
  const world = () => app.data.world;

  function addStaticRect(scene, x, y, w, h, color, alpha=1, strokeColor=null, strokeWidth=0, depth=0){
    const rect = scene.add.rectangle(x, y, w, h, color, alpha).setDepth(depth);
    if (strokeColor != null && strokeWidth) rect.setStrokeStyle(strokeWidth, strokeColor, 1);
    scene.physics.add.existing(rect, true);
    return rect;
  }

  app.scenes.TowerScene = class TowerScene extends Phaser.Scene{
    constructor(){ super('TowerScene'); }

    init(data){
      this.towerId = data?.towerId || state.currentTowerId || '7up';
      this.startFloor = Number(data?.floor || state.currentTowerFloor || 1);
    }

    create(){
      state.sceneKey = 'TowerScene';
      state.currentTowerId = this.towerId;
      state.currentChapterId = null;
      state.currentTowerFloor = this.startFloor;
      state.currentHint = 'A/D 或 ←/→ 移動，Space 跳躍，E 進門';
      app.ui.renderHUD();
      this.lastHint = '';

      this.semester = world().getSemester(this.towerId);
      this.floorGroups = world().getFloorGroups(this.towerId);
      this.maxFloor = Math.max(...this.floorGroups.map(g => g.floor), 3);

      this.worldWidth = 1820;
      this.worldHeight = 1240;
      this.floorLevels = { 1: 1070, 2: 780, 3: 490 };

      this.cameras.main.setBackgroundColor('#31424d');
      this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
      this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

      this.platforms = [];
      this.interactables = [];

      this.drawTowerBackdrop();
      this.buildTowerGeometry();
      this.buildDoors();
      this.buildExit();

      const startY = this.floorLevels[this.startFloor] - 48;
      const startX = this.startFloor === 1 ? 178 : 240;
      this.player = this.physics.add.sprite(startX, startY, 'player-side-active').setDepth(20);
      this.player.body.setSize(20, 30).setOffset(10, 34);
      this.player.body.setAllowGravity(true);
      this.player.body.setGravityY(1500);
      this.player.body.setMaxVelocity(300, 980);
      this.player.body.setDragX(1800);
      this.player.setCollideWorldBounds(true);

      this.platforms.forEach((platform) => this.physics.add.collider(this.player, platform));
      this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
      this.cameras.main.setDeadzone(190, 120);

      this.keys = this.input.keyboard.addKeys({
        left:'LEFT', right:'RIGHT', a:'A', d:'D', jump:'SPACE', e:'E'
      });
      this.interactCooldownUntil = 0;
      this.jumpLatch = false;
    }

    floorY(floor){
      return this.floorLevels[floor] || this.floorLevels[1];
    }

    addPlatform(x, y, w, h, visible=true){
      const rect = addStaticRect(this, x, y, w, h, visible ? 0x5e6d78 : 0xffffff, visible ? 1 : 0.001, visible ? 0xeff7ff : null, visible ? 2 : 0, 2);
      this.platforms.push(rect);
      return rect;
    }

    drawTowerBackdrop(){
      const W = this.worldWidth;
      const H = this.worldHeight;
      const tint = Number('0x' + this.semester.color.replace('#', ''));
      this.add.rectangle(W/2, H/2, W, H, 0xf1ece4).setDepth(-20);
      this.add.rectangle(W/2, H/2, W - 80, H - 80, 0xd8d2c8).setDepth(-19).setStrokeStyle(8, 0x6f6658, 1);
      this.add.rectangle(W/2, H/2, W - 180, H - 140, 0xefe8db).setDepth(-18).setStrokeStyle(6, 0x8e8372, 1);

      for (let x = 180; x <= W - 180; x += 220) {
        for (let y = 150; y <= H - 140; y += 120) {
          this.add.rectangle(x, y, 80, 44, 0xffffff, 0.18).setDepth(-17);
        }
      }

      this.add.rectangle(130, H/2, 20, H - 140, 0x495964).setDepth(-16);
      this.add.rectangle(W - 130, H/2, 20, H - 140, 0x495964).setDepth(-16);

      this.add.polygon(W/2, 112, [0,-54, 80,-6, 52,62, -52,62, -80,-6], tint, 0.98)
        .setStrokeStyle(8, 0x44331e, 1).setDepth(-14);
      this.add.text(W/2, 120, this.semester.short, {
        fontFamily:'Noto Sans TC', fontSize:'36px', fontStyle:'900', color:'#2c2514'
      }).setOrigin(0.5).setDepth(-13);

      this.add.text(220, 110, this.semester.label, {
        fontFamily:'Noto Sans TC', fontSize:'34px', fontStyle:'900', color:'#273640', stroke:'#ffffff', strokeThickness:6
      }).setDepth(-12);

      // Decorative banners
      [480, 1340].forEach((x, idx) => {
        this.add.rectangle(x, 178, 20, 88, 0x60493b).setDepth(-12);
        this.add.rectangle(x + 24, 218, 74, 90, tint, 0.96).setDepth(-11).setStrokeStyle(5, 0x2d2416);
        this.add.text(x + 24, 220, idx === 0 ? '章節' : '探索', {
          fontFamily:'Noto Sans TC', fontSize:'18px', fontStyle:'900', color:'#2d2416'
        }).setOrigin(0.5).setDepth(-10);
      });

      // Windows
      const windowXs = [760, 920, 1080, 1240];
      [260, 560, 860].forEach((y) => {
        windowXs.forEach((x) => {
          this.add.rectangle(x, y, 58, 88, 0x87c9f5, 0.92).setDepth(-12).setStrokeStyle(6, 0x9f7748);
          this.add.rectangle(x, y, 12, 88, 0xffffff, 0.28).setDepth(-11);
        });
      });
    }

    buildTowerGeometry(){
      const W = this.worldWidth;
      const floor1 = this.floorY(1);
      const floor2 = this.floorY(2);
      const floor3 = this.floorY(3);

      // Main floors
      this.addPlatform(W/2, floor1 + 6, W - 320, 18, true);
      this.addPlatform((W + 440) / 2, floor2 + 6, W - 760, 18, true);
      this.addPlatform((W + 620) / 2, floor3 + 6, W - 920, 18, true);

      this.add.rectangle(W/2, floor1 - 10, W - 320, 46, 0xffffff, 0.08).setDepth(1);
      this.add.rectangle((W + 440) / 2, floor2 - 10, W - 760, 46, 0xffffff, 0.08).setDepth(1);
      this.add.rectangle((W + 620) / 2, floor3 - 10, W - 920, 46, 0xffffff, 0.08).setDepth(1);

      // Walls and arch
      this.addPlatform(94, this.worldHeight/2, 28, this.worldHeight - 140, false);
      this.addPlatform(W - 94, this.worldHeight/2, 28, this.worldHeight - 140, false);

      const graphics = this.add.graphics().setDepth(1.5);
      graphics.lineStyle(8, 0x31414d, 1);
      graphics.strokeRect(130, 120, W - 260, this.worldHeight - 200);

      this.drawStaircase(250, floor1, 12, 32, 24, '一樓樓梯');
      this.drawStaircase(470, floor2, 12, 32, 24, '二樓樓梯');

      this.add.text(190, floor1 - 58, '入口', {
        fontFamily:'Noto Sans TC', fontSize:'22px', fontStyle:'900', color:'#2f3d49'
      }).setOrigin(0.5).setDepth(6);
      this.add.text(380, floor2 - 78, '通往 2F', {
        fontFamily:'Noto Sans TC', fontSize:'18px', fontStyle:'900', color:'#2f3d49'
      }).setOrigin(0.5).setDepth(6);
      this.add.text(600, floor3 - 78, '通往 3F', {
        fontFamily:'Noto Sans TC', fontSize:'18px', fontStyle:'900', color:'#2f3d49'
      }).setOrigin(0.5).setDepth(6);

      [1,2,3].forEach((floor) => {
        this.add.text(1580, this.floorY(floor) - 78, `${floor}F`, {
          fontFamily:'Press Start 2P',
          fontSize:'18px',
          color:'#2c2514'
        }).setOrigin(0.5).setDepth(6);
      });
    }

    drawStaircase(startX, fromFloorY, steps, run, rise){
      const graphics = this.add.graphics().setDepth(1.8);
      for (let i = 0; i < steps; i++) {
        const x = startX + i * run;
        const y = fromFloorY - i * rise - 8;
        this.addPlatform(x, y, 42, 18, true);
        graphics.fillStyle(0x7a8b95, 1);
        graphics.fillRoundedRect(x - 20, y - 9, 40, 18, 4);
        graphics.lineStyle(2, 0xf3fbff, .24);
        graphics.strokeRoundedRect(x - 20, y - 9, 40, 18, 4);
      }
    }

    buildDoors(){
      const floorDoorXs = {
        1: [910, 1065, 1220, 1375],
        2: [910, 1065, 1220, 1375],
        3: [1000, 1160, 1320]
      };

      this.floorGroups.forEach((group) => {
        const y = this.floorY(group.floor);
        const xs = floorDoorXs[group.floor] || [];
        group.items.forEach((chapter, index) => {
          const x = xs[index] || (900 + index * 150);
          this.createDoor(x, y, chapter, group.floor);
        });
      });
    }

    createDoor(x, floorY, chapter, floor){
      const tint = chapter.implemented ? 0x8dd6ff : 0xd5c2aa;
      this.add.rectangle(x, floorY - 58, 76, 122, 0xfaf7f2).setDepth(4).setStrokeStyle(6, 0x3d2d1e);
      this.add.rectangle(x, floorY - 58, 44, 76, tint, chapter.implemented ? 1 : 0.6).setDepth(4.2).setStrokeStyle(4, 0xb4854f);
      this.add.rectangle(x, floorY - 6, 84, 18, 0x5d6b77).setDepth(3);
      this.add.text(x, floorY - 136, chapter.id.split('-').slice(1).join('-'), {
        fontFamily:'Noto Sans TC', fontSize:'18px', fontStyle:'900', color:'#2d2b26'
      }).setOrigin(0.5).setDepth(5);
      this.add.text(x, floorY + 32, chapter.implemented ? '進入章節' : '建置中', {
        fontFamily:'Noto Sans TC', fontSize:'14px', fontStyle:'900',
        color: chapter.implemented ? '#1f5227' : '#7a5537',
        backgroundColor:'rgba(255,255,255,.82)',
        padding:{ x:8, y:2 }
      }).setOrigin(0.5).setDepth(5);

      const zone = this.add.zone(x, floorY - 48, 96, 130);
      this.physics.add.existing(zone, true);
      this.interactables.push({
        zone,
        label: chapter.label,
        floor,
        onEnter: () => {
          if (chapter.implemented) app.runtime.enterChapter(chapter.id);
          else app.ui.toast(`${chapter.label} 尚未上架`, 'bad');
        }
      });
    }

    buildExit(){
      const floorY = this.floorY(1);
      this.add.rectangle(190, floorY - 48, 88, 128, 0xe9d4b4, 1).setDepth(4).setStrokeStyle(6, 0x7c5731);
      this.add.rectangle(190, floorY - 22, 48, 84, 0x835225, 1).setDepth(4.2);
      this.add.text(190, floorY - 138, '數學中心出口', {
        fontFamily:'Noto Sans TC', fontSize:'20px', fontStyle:'900', color:'#2f3d49'
      }).setOrigin(0.5).setDepth(5);

      const zone = this.add.zone(190, floorY - 48, 100, 136);
      this.physics.add.existing(zone, true);
      this.interactables.push({
        zone,
        label: '返回數學中心',
        floor: 1,
        onEnter: () => app.runtime.gotoScene('LobbyScene', { entry:'tower-exit' })
      });
    }

    consumeInteract(){
      if (this.time.now < this.interactCooldownUntil) return false;
      const kb = Phaser.Input.Keyboard.JustDown(this.keys.e);
      const touch = state.input.interact;
      if (touch) state.input.interact = false;
      const fired = kb || touch;
      if (fired) this.interactCooldownUntil = this.time.now + 240;
      return fired;
    }

    consumeJump(){
      const kb = Phaser.Input.Keyboard.JustDown(this.keys.jump);
      let touch = false;
      if (state.input.jump && !this.jumpLatch) touch = true;
      this.jumpLatch = !!state.input.jump;
      return kb || touch;
    }

    setHint(text){
      if (this.lastHint === text) return;
      this.lastHint = text;
      state.currentHint = text;
      app.ui.renderHUD();
    }

    updateCurrentFloor(){
      const footY = this.player.y + this.player.displayHeight * 0.18;
      let nearest = 1;
      let dist = Infinity;
      [1,2,3].forEach((floor) => {
        const d = Math.abs(footY - this.floorY(floor));
        if (d < dist) {
          dist = d;
          nearest = floor;
        }
      });
      state.currentTowerFloor = nearest;
    }

    update(){
      if (!this.player) return;
      if (state.overlay !== 'none' || state.modal !== 'none' || state.transitioning) {
        this.player.setVelocityX(0);
        return;
      }

      const left = this.keys.left.isDown || this.keys.a.isDown || state.input.left;
      const right = this.keys.right.isDown || this.keys.d.isDown || state.input.right;
      const speed = 220 * app.config.game.speedMultiplier * 0.8;

      if (left) this.player.setVelocityX(-speed);
      else if (right) this.player.setVelocityX(speed);
      else this.player.setVelocityX(0);

      const grounded = this.player.body.blocked.down || this.player.body.touching.down;
      if (grounded && this.consumeJump()) {
        this.player.setVelocityY(-620);
      }

      this.updateCurrentFloor();

      let nearby = null;
      this.interactables.forEach((item) => {
        if (Math.abs(item.floor - state.currentTowerFloor) > 0) return;
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), item.zone.getBounds())) nearby = item;
      });

      const defaultHint = 'A/D 或 ←/→ 移動，Space 跳躍，E 進門';
      if (nearby) {
        this.setHint(`${nearby.label}｜按 E`);
        if (this.consumeInteract()) nearby.onEnter();
      } else {
        this.setHint(defaultHint);
      }
    }
  };
})(window.MathRPG);
