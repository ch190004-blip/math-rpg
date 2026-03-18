
function makeTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics({ x: 0, y: 0 });
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

export function ensureSharedTextures(scene) {
  makeTexture(scene, "grass-tile", 64, 64, (g) => {
    g.fillStyle(0x73d261, 1).fillRect(0, 0, 64, 64);
    g.fillStyle(0x6bc157, 1);
    for (let i = 0; i < 80; i += 1) g.fillRect((i * 17) % 64, (i * 23) % 64, 3, 3);
    g.fillStyle(0x83de73, 1);
    for (let i = 0; i < 40; i += 1) g.fillRect((i * 11) % 64, (i * 7) % 64, 2, 2);
  });

  makeTexture(scene, "path-tile", 64, 64, (g) => {
    g.fillStyle(0xd9c097, 1).fillRect(0, 0, 64, 64);
    g.fillStyle(0xc7ab80, 1);
    for (let i = 0; i < 60; i += 1) g.fillRect((i * 13) % 64, (i * 9) % 64, 4, 2);
    g.fillStyle(0xe8d5b0, 0.9);
    for (let i = 0; i < 24; i += 1) g.fillRect((i * 19) % 64, (i * 5) % 64, 3, 2);
  });

  makeTexture(scene, "water-tile", 64, 64, (g) => {
    g.fillStyle(0x5fa8ff, 1).fillRect(0, 0, 64, 64);
    g.fillStyle(0x8dc4ff, 1);
    for (let i = 0; i < 32; i += 1) g.fillRect((i * 9) % 64, (i * 13) % 64, 12, 3);
    g.fillStyle(0x2c79dd, 0.8);
    for (let i = 0; i < 20; i += 1) g.fillRect((i * 17) % 64, (i * 7) % 64, 6, 2);
  });

  makeTexture(scene, "tree", 64, 84, (g) => {
    g.fillStyle(0x8f5a2f, 1).fillRect(26, 52, 12, 24);
    g.fillStyle(0x2f9143, 1).fillRect(12, 26, 40, 20);
    g.fillStyle(0x3dbf58, 1).fillRect(6, 18, 52, 18);
    g.fillStyle(0x47cc5f, 1).fillRect(14, 8, 36, 14);
    g.fillStyle(0x245f31, 0.7).fillRect(16, 44, 32, 8);
  });

  makeTexture(scene, "flower", 24, 24, (g) => {
    g.fillStyle(0x2f9143, 1).fillRect(10, 14, 4, 8);
    g.fillStyle(0xff88d0, 1).fillRect(6, 8, 12, 8);
    g.fillStyle(0xffda57, 1).fillRect(10, 10, 4, 4);
  });

  makeTexture(scene, "rock", 32, 22, (g) => {
    g.fillStyle(0x8ca0b3, 1).fillRoundedRect(2, 4, 28, 16, 6);
    g.fillStyle(0xbdd0df, 1).fillRect(8, 6, 10, 4);
  });

  makeTexture(scene, "portal", 72, 88, (g) => {
    g.fillStyle(0x7046ff, 1).fillRoundedRect(10, 8, 52, 72, 12);
    g.fillStyle(0xa58bff, 1).fillRoundedRect(18, 16, 36, 56, 10);
    g.fillStyle(0xffffff, 0.35).fillRect(24, 24, 24, 36);
    g.lineStyle(4, 0xe6dcff, 0.9).strokeRoundedRect(10, 8, 52, 72, 12);
  });

  makeTexture(scene, "stairs", 110, 88, (g) => {
    g.fillStyle(0xc8b494, 1).fillRect(0, 0, 110, 88);
    g.fillStyle(0x9a8468, 1);
    for (let i = 0; i < 8; i += 1) {
      g.fillRect(i * 14, 88 - (i + 1) * 11, 110 - i * 14, 7);
    }
  });

  makeTexture(scene, "tower-wall", 64, 64, (g) => {
    g.fillStyle(0xe3d6c2, 1).fillRect(0, 0, 64, 64);
    g.lineStyle(2, 0xc3b49d, 1);
    for (let y = 0; y < 64; y += 16) g.lineBetween(0, y, 64, y);
    for (let x = 0; x < 64; x += 21) g.lineBetween(x, 0, x, 64);
  });

  makeTexture(scene, "window", 52, 84, (g) => {
    g.fillStyle(0x95d8ff, 1).fillRoundedRect(8, 8, 36, 60, 10);
    g.fillStyle(0xffffff, 0.25).fillRect(14, 14, 10, 36);
    g.lineStyle(4, 0xb48352, 1).strokeRoundedRect(8, 8, 36, 60, 10);
    g.fillStyle(0xb48352, 1).fillRect(24, 8, 4, 60);
    g.fillRect(8, 34, 36, 4);
  });

  makeTexture(scene, "door-open", 62, 90, (g) => {
    g.fillStyle(0x7a4c27, 1).fillRoundedRect(6, 6, 50, 78, 10);
    g.fillStyle(0xa76a38, 1).fillRoundedRect(12, 12, 38, 66, 8);
    g.fillStyle(0xffd267, 1).fillCircle(42, 44, 4);
    g.lineStyle(4, 0xdcc7aa, 1).strokeRoundedRect(6, 6, 50, 78, 10);
  });

  makeTexture(scene, "hero-top-idle", 24, 28, (g) => {
    g.fillStyle(0x5b3d24, 1).fillRect(7, 0, 10, 4);
    g.fillStyle(0xffd7ae, 1).fillRect(6, 4, 12, 8);
    g.fillStyle(0x2e5bd6, 1).fillRect(4, 12, 16, 10);
    g.fillStyle(0x6fcbff, 1).fillRect(8, 12, 8, 5);
    g.fillStyle(0x5f4030, 1).fillRect(5, 22, 5, 6);
    g.fillRect(14, 22, 5, 6);
  });

  makeTexture(scene, "hero-top-step", 24, 28, (g) => {
    g.fillStyle(0x5b3d24, 1).fillRect(7, 0, 10, 4);
    g.fillStyle(0xffd7ae, 1).fillRect(6, 4, 12, 8);
    g.fillStyle(0x2e5bd6, 1).fillRect(4, 12, 16, 10);
    g.fillStyle(0x6fcbff, 1).fillRect(8, 12, 8, 5);
    g.fillStyle(0x5f4030, 1).fillRect(4, 22, 4, 6);
    g.fillRect(15, 22, 5, 6);
  });

  makeTexture(scene, "hero-side-idle", 22, 32, (g) => {
    g.fillStyle(0x5b3d24, 1).fillRect(6, 0, 9, 4);
    g.fillStyle(0xffd7ae, 1).fillRect(5, 4, 10, 8);
    g.fillStyle(0x2e5bd6, 1).fillRect(4, 12, 14, 11);
    g.fillStyle(0x6fcbff, 1).fillRect(8, 12, 6, 5);
    g.fillStyle(0x5f4030, 1).fillRect(6, 23, 4, 9);
    g.fillRect(13, 23, 4, 9);
  });

  makeTexture(scene, "hero-side-run", 22, 32, (g) => {
    g.fillStyle(0x5b3d24, 1).fillRect(6, 0, 9, 4);
    g.fillStyle(0xffd7ae, 1).fillRect(5, 4, 10, 8);
    g.fillStyle(0x2e5bd6, 1).fillRect(4, 12, 14, 11);
    g.fillStyle(0x6fcbff, 1).fillRect(8, 12, 6, 5);
    g.fillStyle(0x5f4030, 1).fillRect(4, 23, 4, 9);
    g.fillRect(14, 23, 4, 7);
  });

  const slimeColors = {
    green: [0x89f66a, 0x4fa63f],
    blue: [0x78d4ff, 0x3f7fc9],
    pink: [0xff8de3, 0xc55ab0],
    gold: [0xffdd6e, 0xc99322],
    purple: [0xa98cff, 0x5c45b0],
    red: [0xff8a7a, 0xc45144],
    aqua: [0x7af7f0, 0x2d9f99],
    orange: [0xffb86d, 0xcf7a1d],
    teal: [0x87f0ca, 0x2c9d73],
    silver: [0xe0e7f3, 0x8a97ad]
  };

  Object.entries(slimeColors).forEach(([name, [main, shadow]]) => {
    makeTexture(scene, `slime-${name}`, 28, 22, (g) => {
      g.fillStyle(main, 1).fillRoundedRect(2, 4, 24, 16, 8);
      g.fillStyle(0xffffff, 0.25).fillRect(6, 8, 8, 4);
      g.fillStyle(0x2b2140, 1).fillRect(9, 12, 3, 3);
      g.fillRect(16, 12, 3, 3);
      g.fillStyle(shadow, 1).fillRect(4, 18, 20, 2);
    });
  });
}

export function createTopdownWorld(scene, worldWidth, worldHeight) {
  ensureSharedTextures(scene);
  scene.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, "grass-tile");
}

export function sprinkleNature(scene, amount, width, height) {
  for (let i = 0; i < amount; i += 1) {
    const tree = scene.add.image(
      Phaser.Math.Between(90, width - 90),
      Phaser.Math.Between(90, height - 90),
      Phaser.Math.Between(0, 10) > 2 ? "tree" : "rock"
    );
    tree.setDepth(tree.y);
    if (tree.texture.key === "tree") tree.setScale(Phaser.Math.FloatBetween(0.9, 1.15));
  }
}
