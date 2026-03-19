
(function(app){
  const state = app.state;
  const world = () => app.data.world;

  function floorCaption(group){
    if (!group?.items?.length) return '';
    const first = group.items[0].id.split('-').slice(1).join('-');
    const last = group.items[group.items.length - 1].id.split('-').slice(1).join('-');
    return `${first} ～ ${last}`;
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
      state.currentHint = '左下是入口；左側樓梯上下樓；右側章節門；靠近後按 E';
      app.ui.renderHUD();
      this.lastHint = '';

      this.semester = world().getSemester(this.towerId);
      this.floorGroups = world().getFloorGroups(this.towerId);
      this.maxFloor = Math.max(...this.floorGroups.map(g => g.floor), 3);

      this.worldWidth = 1760;
      this.floorSpacing = 290;
      this.baseY = 1130;
      this.worldHeight = this.baseY + 180;

      this.cameras.main.setBackgroundColor('#eef1f5');
      this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
      this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

      this.drawTowerShell();
      this.interactables = [];
      this.drawFloorsAndDoors();
      this.makeStairsAndPortals();

      this.player = this.physics.add.sprite(180, this.floorY(this.startFloor) - 44, 'player-side-active').setDepth(12);
      this.player.body.setSize(20, 30).setOffset(10, 34);
      this.player.body.setAllowGravity(false);
      this.player.setCollideWorldBounds(true);

      this.cameras.main.startFollow(this.player, true, 0.16, 0.16);
      this.cameras.main.setDeadzone(180, 120);
      this.keys = this.input.keyboard.addKeys('A,D,E,LEFT,RIGHT');
      this.interactCooldownUntil = 0;
    }

    floorY(floor){
      return this.baseY - (floor - 1) * this.floorSpacing;
    }

    drawTowerShell(){
      const W = this.worldWidth;
      const H = this.worldHeight;
      const tint = Number('0x' + this.semester.color.replace('#', ''));

      this.add.rectangle(W/2, H/2, W, H, 0xf5f4f2).setDepth(-10);
      this.add.rectangle(W/2, H/2, W - 160, H - 90, 0xe6ebf0).setDepth(-9).setStrokeStyle(12, 0x98a3ae, 1);
      this.add.rectangle(120, H/2, 16, H - 120, 0x31414d).setDepth(-8);
      this.add.rectangle(W - 120, H/2, 16, H - 120, 0x31414d).setDepth(-8);

      this.add.polygon(W/2, 90, [0,-46, 70,-8, 44,54, -44,54, -70,-8], tint, 0.98)
        .setStrokeStyle(6, 0x2b2518, 1)
        .setDepth(-7);
      this.add.text(W/2, 94, this.semester.short, {
        fontFamily:'Noto Sans TC', fontSize:'34px', fontStyle:'900', color:'#2c2514'
      }).setOrigin(0.5).setDepth(-6);
      this.add.text(180, 120, this.semester.label, {
        fontFamily:'Noto Sans TC', fontSize:'34px', fontStyle:'900', color:'#2f3d49'
      }).setDepth(5);
      this.add.text(W - 180, 120, '傳送回數學中心', {
        fontFamily:'Noto Sans TC', fontSize:'24px', fontStyle:'900', color:'#2f3d49'
      }).setOrigin(0.5).setDepth(5);
    }

    drawFloorsAndDoors(){
      const W = this.worldWidth;
      this.floorGroups.forEach((group) => {
        const y = this.floorY(group.floor);
        this.add.rectangle(W/2, y + 6, W - 560, 12, 0x3d4650, 1).setDepth(0);
        this.add.rectangle(W/2, y - 20, W - 660, 60, 0xffffff, 0.1).setDepth(-1);
        this.add.text(980, y - 92, floorCaption(group), {
          fontFamily:'Noto Sans TC', fontSize:'24px', fontStyle:'900', color:'#34404b'
        }).setOrigin(0.5).setDepth(3);

        this.add.text(92, y - 36, group.floor === 1 ? '入口' : `${group.floor}F`, {
          fontFamily:'Noto Sans TC', fontSize:'22px', fontStyle:'900', color:'#35404a'
        }).setOrigin(0.5).setDepth(3);

        const doorXs = group.items.length === 4 ? [860, 1010, 1160, 1310] : [940, 1090, 1240];
        group.items.forEach((chapter, index) => {
          const x = doorXs[index] || (860 + index * 140);
          this.add.rectangle(x, y - 34, 64, 116, 0xfbf9f4).setDepth(2).setStrokeStyle(6, 0x2d2b26);
          this.add.rectangle(x, y - 34, 44, 72, 0x8fd2ff, 0.92).setDepth(2.5).setStrokeStyle(3, 0xb4854f);
          this.add.text(x, y - 102, chapter.id.split('-').slice(1).join('-'), {
            fontFamily:'Noto Sans TC', fontSize:'18px', fontStyle:'900', color:'#2d2b26'
          }).setOrigin(0.5).setDepth(3);
          this.add.text(x, y + 30, chapter.implemented ? '開放' : '建置中', {
            fontFamily:'Noto Sans TC', fontSize:'14px', fontStyle:'900', color: chapter.implemented ? '#295427' : '#7a5537',
            backgroundColor:'rgba(255,255,255,.82)',
            padding:{ x:8, y:2 }
          }).setOrigin(0.5).setDepth(3);

          const zone = this.add.zone(x, y - 10, 84, 132);
          this.physics.add.existing(zone, true);
          this.interactables.push({
            zone,
            label: chapter.label,
            floor: group.floor,
            onEnter: () => {
              if (chapter.implemented) app.runtime.enterChapter(chapter.id);
              else app.ui.toast(`${chapter.label} 尚未上架`, 'bad');
            }
          });
        });
      });

      const topY = this.floorY(this.maxFloor);
      this.add.rectangle(this.worldWidth - 190, topY - 34, 80, 120, 0xeaf6ff).setDepth(2).setStrokeStyle(6, 0x2d2b26);
      this.add.rectangle(this.worldWidth - 190, topY - 18, 48, 72, 0xbce0ff).setDepth(2.5);
      const portalZone = this.add.zone(this.worldWidth - 190, topY - 10, 96, 136);
      this.physics.add.existing(portalZone, true);
      this.interactables.push({
        zone: portalZone,
        label: '傳送回數學中心',
        floor: this.maxFloor,
        onEnter: () => app.runtime.gotoScene('LobbyScene', { entry:'tower-exit' })
      });
    }

    makeStairsAndPortals(){
      this.makeEntryZone();
      this.makeStairPad(222, this.floorY(1) - 14, 1, '上樓至 2F', () => this.teleportToFloor(2), 'up');
      this.makeStairPad(222, this.floorY(2) - 14, 2, '下樓至 1F', () => this.teleportToFloor(1), 'down');
      this.makeStairPad(404, this.floorY(2) - 14, 2, '上樓至 3F', () => this.teleportToFloor(3), 'up');
      this.makeStairPad(222, this.floorY(3) - 14, 3, '下樓至 2F', () => this.teleportToFloor(2), 'down');
    }

    makeEntryZone(){
      const y1 = this.floorY(1);
      const zone = this.add.zone(170, y1 - 14, 86, 126);
      this.physics.add.existing(zone, true);
      this.interactables.push({
        zone, label:'回數學中心', floor:1,
        onEnter: () => app.runtime.gotoScene('LobbyScene', { entry:'tower-exit' })
      });
    }

    makeStairPad(x, y, floor, label, onEnter, direction){
      const pad = this.add.container(0, 0).setDepth(2);
      const g = this.add.graphics().setDepth(2);
      g.fillStyle(0xf1ebe0, 1);
      g.lineStyle(6, 0x2d2b26, 1);
      g.fillRoundedRect(x - 34, y - 54, 68, 94, 16);
      g.strokeRoundedRect(x - 34, y - 54, 68, 94, 16);
      g.fillStyle(0xc9d6e3, 1);
      for (let i = 0; i < 4; i++) {
        g.fillRoundedRect(x - 24 + i * 8, y - 42 + i * 14, 42 - i * 10, 10, 6);
      }
      pad.add(g);
      this.add.text(x, y + 44, direction === 'up' ? '▲' : '▼', {
        fontFamily:'Noto Sans TC', fontSize:'18px', fontStyle:'900', color:'#2d2b26'
      }).setOrigin(0.5).setDepth(3);

      const zone = this.add.zone(x, y - 8, 88, 120);
      this.physics.add.existing(zone, true);
      this.interactables.push({ zone, label, floor, onEnter });
    }

    teleportToFloor(floor){
      const targetX = floor === 1 ? 250 : 272;
      state.currentTowerFloor = floor;
      this.player.setPosition(targetX, this.floorY(floor) - 44);
      this.player.setVelocity(0, 0);
      this.cameras.main.flash(90, 255, 255, 255, false);
      this.setHint(`已切換到 ${floor}F`);
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
        this.player.setVelocity(0);
        return;
      }

      const left = this.keys.LEFT.isDown || this.keys.A.isDown || state.input.left;
      const right = this.keys.RIGHT.isDown || this.keys.D.isDown || state.input.right;
      const speed = 188 * app.config.game.speedMultiplier;
      if (left) this.player.setVelocityX(-speed);
      else if (right) this.player.setVelocityX(speed);
      else this.player.setVelocityX(0);

      this.player.setVelocityY(0);
      this.player.y = this.floorY(state.currentTowerFloor) - 44;

      let nearby = null;
      this.interactables.forEach((item) => {
        if (item.floor !== state.currentTowerFloor) return;
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), item.zone.getBounds())) nearby = item;
      });

      const defaultHint = '左下是入口；左側樓梯上下樓；右側章節門；靠近後按 E';
      if (nearby) {
        this.setHint(`${nearby.label}｜按 E`);
        if (this.consumeInteract()) nearby.onEnter();
      } else {
        this.setHint(defaultHint);
      }
    }
  };
})(window.MathRPG);
