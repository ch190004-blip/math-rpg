
(function(app){
  const state = app.state;
  const world = () => app.data.world;

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
      state.currentHint = '左下入口、左側樓梯區、右側章節門；靠近後按 E';
      app.ui.renderHUD();

      this.semester = world().getSemester(this.towerId);
      this.floorGroups = world().getFloorGroups(this.towerId);
      this.maxFloor = Math.max(...this.floorGroups.map(g => g.floor), 3);

      this.worldWidth = 1680;
      this.floorSpacing = 270;
      this.baseY = 1120;
      this.worldHeight = this.baseY + 160;

      this.cameras.main.setBackgroundColor('#f0f0ef');
      this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
      this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

      this.drawTowerShell();
      this.drawFloors();
      this.interactables = [];
      this.createFloorInteractions();

      this.player = this.physics.add.sprite(160, this.floorY(this.startFloor) - 44, 'player-side-active').setDepth(12);
      this.player.body.setSize(20, 30).setOffset(10, 34);
      this.player.body.setAllowGravity(false);
      this.player.setCollideWorldBounds(true);

      this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
      this.cameras.main.setDeadzone(170, 120);
      this.keys = this.input.keyboard.addKeys('A,D,E,LEFT,RIGHT');
    }

    floorY(floor){
      return this.baseY - (floor - 1) * this.floorSpacing;
    }

    drawTowerShell(){
      const W = this.worldWidth;
      const H = this.worldHeight;
      this.add.rectangle(W/2, H/2, W, H, 0xf2f2f2).setDepth(-10);
      this.add.rectangle(110, H/2, 12, H - 110, 0x111111).setDepth(-1);
      this.add.rectangle(W - 110, H/2, 12, H - 110, 0x111111).setDepth(-1);

      this.add.text(160, 126, this.semester.label, {
        fontFamily:'Noto Sans TC', fontSize:'34px', fontStyle:'900', color:'#222'
      }).setDepth(5);
      this.add.text(W - 180, 126, '傳送回入口', {
        fontFamily:'Noto Sans TC', fontSize:'26px', fontStyle:'900', color:'#222'
      }).setOrigin(0.5).setDepth(5);

      // stairs beams
      this.drawStair(1, 2);
      this.drawStair(2, 3);
    }

    drawStair(fromFloor, toFloor){
      const y1 = this.floorY(fromFloor);
      const y2 = this.floorY(toFloor);
      const startX = 150;
      const endX = 310;
      const g = this.add.graphics().setDepth(0);
      g.lineStyle(7, 0x111111, 1);
      g.beginPath();
      g.moveTo(startX, y1);
      g.lineTo(endX, y2);
      g.strokePath();
      g.lineBetween(startX - 10, y1, startX + 30, y1);
      g.lineBetween(endX - 25, y2, endX + 20, y2);
    }

    drawFloors(){
      const W = this.worldWidth;
      this.floorGroups.forEach((group) => {
        const y = this.floorY(group.floor);
        this.add.line(0, 0, 360, y, W - 180, y, 0x111111).setLineWidth(7).setDepth(0);
        this.add.text(1020, y - 78, `${group.items[0]?.id.split('-')[1]}-1~${group.items[group.items.length - 1]?.id.split('-')[1]}-${group.items[group.items.length - 1]?.id.split('-')[2]}`, {
          fontFamily:'Noto Sans TC', fontSize:'26px', fontStyle:'900', color:'#202020'
        }).setOrigin(0.5).setDepth(3);

        this.add.text(66, y - 42, group.floor === 1 ? '入口' : '', {
          fontFamily:'Noto Sans TC', fontSize:'22px', fontStyle:'900', color:'#222'
        }).setOrigin(0.5).setDepth(3);

        const doorXs = group.items.length === 4 ? [850, 980, 1130, 1280] : [920, 1060, 1200];
        group.items.forEach((chapter, index) => {
          const x = doorXs[index] || (860 + index * 130);
          this.add.rectangle(x, y - 34, 54, 110, 0xffffff).setDepth(2).setStrokeStyle(6, 0x111111);
          const caption = chapter.label.split(' ')[0];
          this.add.text(x, y - 98, caption, {
            fontFamily:'Noto Sans TC', fontSize:'18px', fontStyle:'900', color:'#222'
          }).setOrigin(0.5).setDepth(3);

          const zone = this.add.zone(x, y - 10, 74, 130);
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

      // return portal on 3F right
      const topY = this.floorY(this.maxFloor);
      this.add.rectangle(this.worldWidth - 180, topY - 34, 70, 116, 0xeaf6ff).setDepth(2).setStrokeStyle(6, 0x111111);
      const portalZone = this.add.zone(this.worldWidth - 180, topY - 10, 86, 132);
      this.physics.add.existing(portalZone, true);
      this.interactables.push({
        zone: portalZone,
        label: '傳送回入口',
        floor: this.maxFloor,
        onEnter: () => app.runtime.gotoScene('LobbyScene', { entry:'tower-exit' })
      });
    }

    createFloorInteractions(){
      // 1F प्रवेश/回大廳
      const y1 = this.floorY(1);
      const entryZone = this.add.zone(160, y1 - 14, 86, 126);
      this.physics.add.existing(entryZone, true);
      this.interactables.push({
        zone: entryZone, label:'回數學中心', floor:1,
        onEnter: () => app.runtime.gotoScene('LobbyScene', { entry:'tower-exit' })
      });

      // stairs separate on 2F
      this.makeStairPad(220, this.floorY(2) - 14, 2, '下樓至 1F', () => this.teleportToFloor(1));
      this.makeStairPad(430, this.floorY(2) - 14, 2, '上樓至 3F', () => this.teleportToFloor(3));
      this.makeStairPad(220, this.floorY(3) - 14, 3, '下樓至 2F', () => this.teleportToFloor(2));
      this.makeStairPad(220, this.floorY(1) - 14, 1, '上樓至 2F', () => this.teleportToFloor(2));
    }

    makeStairPad(x, y, floor, label, onEnter){
      const g = this.add.graphics().setDepth(2);
      g.fillStyle(0xefefef, 1);
      g.lineStyle(6, 0x111111, 1);
      g.fillRect(x - 28, y - 50, 56, 88);
      g.strokeRect(x - 28, y - 50, 56, 88);
      const zone = this.add.zone(x, y - 8, 74, 120);
      this.physics.add.existing(zone, true);
      this.interactables.push({ zone, label, floor, onEnter });
    }

    teleportToFloor(floor){
      const targetX = floor === 1 ? 220 : 260;
      state.currentTowerFloor = floor;
      this.player.setPosition(targetX, this.floorY(floor) - 44);
      this.player.setVelocity(0, 0);
      this.cameras.main.flash(100, 255, 255, 255, false);
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

      const defaultHint = '左下入口、左側樓梯區、右側章節門；靠近後按 E';
      if (nearby) {
        state.currentHint = `${nearby.label}｜按 E`;
        app.ui.renderHUD();
        if (this.consumeInteract()) nearby.onEnter();
      } else if (state.currentHint !== defaultHint) {
        state.currentHint = defaultHint;
        app.ui.renderHUD();
      }
    }
  };
})(window.MathRPG);
