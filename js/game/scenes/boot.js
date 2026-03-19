
(function(app){
  app.scenes.BootScene = class BootScene extends Phaser.Scene{
    constructor(){ super('BootScene'); }

    create(){
      this.makeTextures();
      if (app.avatar && app.avatar.compose) {
        app.avatar.compose(this);
      }
      this.scene.start('LobbyScene');
    }

    makeTextures(){
      const g = this.add.graphics();

      g.clear();
      g.fillStyle(0x6fd37c, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x75db84, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillRect(32, 32, 32, 32);
      g.fillStyle(0x91e19a, 0.35);
      g.fillCircle(14, 14, 3);
      g.fillCircle(50, 20, 4);
      g.fillCircle(38, 50, 3);
      g.generateTexture('grass-tile', 64, 64);

      g.clear();
      g.fillStyle(0xd9c08a, 1);
      g.fillRoundedRect(0, 0, 64, 64, 20);
      g.fillStyle(0xc6ab70, .45);
      g.fillRect(0, 22, 64, 8);
      g.fillRect(0, 42, 64, 8);
      g.generateTexture('path-tile', 64, 64);

      g.clear();
      g.fillStyle(0xf7d65e, 1);
      g.fillCircle(12, 12, 10);
      g.fillStyle(0x5b3b1f, 1);
      g.fillRect(10, 22, 4, 16);
      g.fillStyle(0x4bb368, 1);
      g.fillCircle(12, 22, 8);
      g.generateTexture('flower', 24, 40);

      g.clear();
      g.fillStyle(0x3d7d42, 1);
      g.fillCircle(24, 20, 20);
      g.fillCircle(46, 30, 16);
      g.fillCircle(14, 34, 16);
      g.fillStyle(0x7a4c24, 1);
      g.fillRect(22, 34, 10, 26);
      g.generateTexture('tree', 60, 64);

      g.clear();
      g.fillStyle(0xe6d4ac, 1);
      g.fillRoundedRect(20, 32, 90, 70, 12);
      g.fillStyle(0xc2ab7c, 1);
      g.fillRoundedRect(26, 36, 78, 60, 10);
      g.fillStyle(0x9e7749, 1);
      g.fillTriangle(10, 44, 38, 10, 66, 44);
      g.fillTriangle(46, 44, 66, 2, 86, 44);
      g.fillTriangle(70, 44, 92, 12, 118, 44);
      g.fillStyle(0x6e4e2b, 1);
      g.fillRoundedRect(48, 58, 32, 38, 7);
      g.fillStyle(0x84ddff, 1);
      g.fillRect(28, 52, 18, 18);
      g.fillRect(82, 52, 18, 18);
      g.generateTexture('tower-gate', 128, 110);

      g.clear();
      g.fillStyle(0x8f65d0, 1);
      g.fillRoundedRect(0, 0, 82, 112, 16);
      g.fillStyle(0xf1d477, 1);
      g.fillRoundedRect(11, 12, 60, 88, 10);
      g.fillStyle(0x6f4e23, 1);
      g.fillRoundedRect(29, 46, 24, 54, 7);
      g.generateTexture('chapter-door', 82, 112);

      g.clear();
      g.fillStyle(0x7de7ff, 1);
      g.fillRoundedRect(0, 0, 88, 20, 10);
      g.fillStyle(0xffffff, 0.35);
      g.fillRoundedRect(8, 4, 72, 6, 4);
      g.generateTexture('lift-pad', 88, 20);

      const colors = app.data.chapter11.types.map(item => item.color);
      colors.forEach((hex, index) => {
        const keyBase = `slime-t${index + 1}`;
        const color = Number('0x' + hex.replace('#', ''));
        ['standard', 'literacy'].forEach((mode) => {
          g.clear();
          g.fillStyle(color, 1);
          g.fillEllipse(46, 40, 58, 38);
          g.fillStyle(0xffffff, 0.18);
          g.fillEllipse(36, 31, 22, 10);
          g.fillStyle(0xffffff, 0.1);
          g.fillEllipse(50, 25, 28, 14);
          g.fillStyle(0x111111, 1);
          g.fillCircle(32, 38, 5);
          g.fillCircle(58, 38, 5);
          g.fillStyle(0xffffff, 1);
          g.fillCircle(30, 36, 2);
          g.fillCircle(56, 36, 2);
          g.lineStyle(3, 0x111111, 1);
          g.beginPath();
          g.arc(45, 46, 10, 0.35, 2.79, false);
          g.strokePath();

          if (mode === 'literacy') {
            g.fillStyle(0x7df0ff, 1);
            g.fillTriangle(44, 4, 36, 18, 52, 18);
            g.fillStyle(0xffffff, 0.8);
            g.fillCircle(44, 11, 2);
          }

          g.generateTexture(`${keyBase}-${mode}`, 92, 74);
        });
      });

      g.destroy();
    }
  };
})(window.MathRPG);
