
(function(app){
  app.avatar = {
    catalog: {
      head: ['head-basic', 'head-hood'],
      body: ['body-adventurer', 'body-crimson'],
      hands: ['hands-basic', 'hands-gloves'],
      feet: ['feet-boots', 'feet-iron']
    },

    buildPartTextures(scene){
      const g = scene.add.graphics();

      const save = (key, drawFn, w, h) => {
        if (scene.textures.exists(key)) return;
        g.clear();
        drawFn(g);
        g.generateTexture(key, w, h);
      };

      save('head-basic', (g2) => {
        g2.fillStyle(0xf7e3cf, 1);
        g2.fillCircle(16, 16, 12);
        g2.fillStyle(0x5a331b, 1);
        g2.fillRoundedRect(5, 3, 22, 10, 6);
      }, 32, 32);

      save('head-hood', (g2) => {
        g2.fillStyle(0x1f3d80, 1);
        g2.fillRoundedRect(4, 2, 24, 22, 10);
        g2.fillStyle(0xf7e3cf, 1);
        g2.fillCircle(16, 16, 10);
      }, 32, 32);

      save('body-adventurer', (g2) => {
        g2.fillStyle(0x2b70d3, 1);
        g2.fillRoundedRect(4, 0, 24, 24, 8);
        g2.fillStyle(0xffffff, 1);
        g2.fillRect(8, 4, 16, 5);
      }, 32, 24);

      save('body-crimson', (g2) => {
        g2.fillStyle(0xd44a4a, 1);
        g2.fillRoundedRect(4, 0, 24, 24, 8);
        g2.fillStyle(0xffd55d, 1);
        g2.fillRect(8, 4, 16, 5);
      }, 32, 24);

      save('hands-basic', (g2) => {
        g2.fillStyle(0x5f3b24, 1);
        g2.fillRoundedRect(0, 10, 10, 8, 4);
        g2.fillRoundedRect(22, 10, 10, 8, 4);
      }, 32, 28);

      save('hands-gloves', (g2) => {
        g2.fillStyle(0xeecb8d, 1);
        g2.fillRoundedRect(0, 10, 10, 8, 4);
        g2.fillRoundedRect(22, 10, 10, 8, 4);
        g2.fillStyle(0x1f3d80, 1);
        g2.fillRoundedRect(1, 10, 8, 4, 3);
        g2.fillRoundedRect(23, 10, 8, 4, 3);
      }, 32, 28);

      save('feet-boots', (g2) => {
        g2.fillStyle(0x17356b, 1);
        g2.fillRoundedRect(6, 0, 8, 18, 4);
        g2.fillRoundedRect(18, 0, 8, 18, 4);
        g2.fillStyle(0x4a2e19, 1);
        g2.fillRoundedRect(4, 14, 12, 6, 3);
        g2.fillRoundedRect(16, 14, 12, 6, 3);
      }, 32, 22);

      save('feet-iron', (g2) => {
        g2.fillStyle(0x343f56, 1);
        g2.fillRoundedRect(6, 0, 8, 18, 4);
        g2.fillRoundedRect(18, 0, 8, 18, 4);
        g2.fillStyle(0x888fa2, 1);
        g2.fillRoundedRect(4, 14, 12, 6, 3);
        g2.fillRoundedRect(16, 14, 12, 6, 3);
      }, 32, 22);

      g.destroy();
    },

    compose(scene){
      this.buildPartTextures(scene);
      const topKey = 'player-top-active';
      const sideKey = 'player-side-active';
      [topKey, sideKey].forEach((key) => {
        if (scene.textures.exists(key)) scene.textures.remove(key);
      });

      const rtTop = scene.make.renderTexture({ width: 40, height: 70, add: false });
      rtTop.draw(app.state.avatar.feet || 'feet-boots', 4, 44);
      rtTop.draw(app.state.avatar.body || 'body-adventurer', 4, 24);
      rtTop.draw(app.state.avatar.hands || 'hands-basic', 4, 26);
      rtTop.draw(app.state.avatar.head || 'head-basic', 4, 0);
      rtTop.saveTexture(topKey);
      rtTop.destroy();

      const rtSide = scene.make.renderTexture({ width: 40, height: 68, add: false });
      rtSide.draw(app.state.avatar.feet || 'feet-boots', 4, 42);
      rtSide.draw(app.state.avatar.body || 'body-adventurer', 4, 22);
      rtSide.draw(app.state.avatar.hands || 'hands-basic', 4, 26);
      rtSide.draw(app.state.avatar.head || 'head-basic', 4, 2);
      rtSide.saveTexture(sideKey);
      rtSide.destroy();
    }
  };
})(window.MathRPG);
