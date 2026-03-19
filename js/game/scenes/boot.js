(function(app){
  app.scenes.BootScene = class BootScene extends Phaser.Scene{
    constructor(){ super('BootScene'); }

    create(){
      this.makeTextures();
      if (app.avatar && app.avatar.compose) app.avatar.compose(this);
      this.scene.start('LobbyScene');
    }

    makeTextures(){
      const g = this.add.graphics();

      g.clear();
      g.fillStyle(0x7ad77e, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x93e398, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillRect(32, 32, 32, 32);
      g.fillStyle(0xb8f0ba, .28);
      g.fillCircle(14, 14, 4);
      g.fillCircle(46, 20, 5);
      g.fillCircle(38, 48, 4);
      g.generateTexture('grass-tile', 64, 64);

      g.clear();
      g.fillStyle(0xdbb97e, 1);
      g.fillRoundedRect(0, 0, 64, 64, 18);
      g.fillStyle(0xcba468, .5);
      g.fillRect(0, 18, 64, 8);
      g.fillRect(0, 40, 64, 8);
      g.generateTexture('path-tile', 64, 64);

      g.clear();
      g.fillStyle(0x3f8a4b, 1);
      g.fillCircle(24, 18, 18);
      g.fillCircle(44, 28, 15);
      g.fillCircle(10, 30, 14);
      g.fillStyle(0x7b4d25, 1);
      g.fillRect(20, 30, 10, 30);
      g.generateTexture('tree', 56, 64);

      g.clear();
      g.fillStyle(0xf8d964, 1);
      g.fillCircle(12, 12, 10);
      g.fillStyle(0x8e4d2c, 1);
      g.fillRect(10, 21, 4, 14);
      g.fillStyle(0x4db96c, 1);
      g.fillCircle(12, 21, 9);
      g.generateTexture('flower', 24, 36);

      g.clear();
      g.fillStyle(0xead4ac, 1);
      g.fillRoundedRect(0, 0, 112, 96, 24);
      g.fillStyle(0xffffff, .28);
      g.fillRoundedRect(10, 10, 92, 18, 12);
      g.fillStyle(0x7c5731, 1);
      g.fillRoundedRect(18, 28, 76, 58, 14);
      g.fillStyle(0x5e3918, 1);
      g.fillRoundedRect(40, 36, 32, 50, 10);
      g.fillStyle(0x85e2ff, 1);
      g.fillRect(24, 38, 12, 14);
      g.fillRect(76, 38, 12, 14);
      g.generateTexture('tower-gate', 112, 96);

      g.clear();
      g.fillStyle(0x9263dc, 1);
      g.fillRoundedRect(0, 0, 84, 114, 16);
      g.fillStyle(0xf6de84, 1);
      g.fillRoundedRect(12, 14, 60, 88, 10);
      g.fillStyle(0x6f4b23, 1);
      g.fillRoundedRect(30, 48, 24, 54, 7);
      g.generateTexture('chapter-door', 84, 114);

      g.clear();
      g.fillStyle(0xb9f4ff, 1);
      g.fillRoundedRect(0, 0, 110, 28, 12);
      g.fillStyle(0xffffff, .4);
      g.fillRoundedRect(10, 5, 90, 8, 5);
      g.generateTexture('lift-pad', 110, 28);

      const banks = Object.keys(app.data)
        .filter(key => app.data[key] && app.data[key].types && app.data[key].slimeCatalog);
      banks.forEach((bankKey) => {
        const bank = app.data[bankKey];
        bank.types.forEach((meta) => {
          ['standard', 'literacy'].forEach((mode) => {
            const textureKey = bank.slimeCatalog.find(item => item.typeId === meta.id && item.mode === mode)?.textureKey;
            if (!textureKey || this.textures.exists(textureKey)) return;
            const color = Number('0x' + meta.color.replace('#', ''));
            g.clear();
            g.fillStyle(color, 1);
            g.fillEllipse(46, 40, 60, 40);
            g.fillStyle(0xffffff, 0.22);
            g.fillEllipse(34, 30, 22, 10);
            g.fillStyle(0xffffff, 0.12);
            g.fillEllipse(52, 24, 26, 12);
            g.fillStyle(0x111111, 1);
            g.fillCircle(31, 39, 5);
            g.fillCircle(58, 39, 5);
            g.fillStyle(0xffffff, 1);
            g.fillCircle(29, 36, 2);
            g.fillCircle(56, 36, 2);
            g.lineStyle(3, 0x111111, 1);
            g.beginPath();
            g.arc(45, 47, 10, 0.35, 2.79, false);
            g.strokePath();

            if (mode === 'literacy') {
              g.fillStyle(0x7df0ff, 1);
              g.fillTriangle(45, 3, 36, 18, 54, 18);
              g.fillStyle(0xffffff, 0.9);
              g.fillCircle(45, 10, 2);
            }

            g.generateTexture(textureKey, 92, 74);
          });
        });
      });

      g.destroy();
    }
  };
})(window.MathRPG);
