const config = {
    type: Phaser.AUTO,
    width: 1820,
    height: 1000,
    parent: "game-container",
    pixelArt: true,
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };
  
  const game = new Phaser.Game(config);
  let controls;
  
  function preload() {
    this.load.image("tiles", "assets/sprites/spritesheet.png");
    this.load.tilemapTiledJSON("map", "assets/tilemap/gubongo_map.json");
  }
  
  function create() {

    const map = this.make.tilemap({ key: "map" });
  
    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage("ts", "tiles");
  
    // Parameters: layer name (or index) from Tiled, tileset, x, y
    
    const sky = map.createStaticLayer("sky", tileset, 0, 0);
    const bg = map.createStaticLayer("bg", tileset, 0, 0);
    const notcollidingitems = map.createStaticLayer("notcollidingitems", tileset, 0, 0);
    const platforms = map.createStaticLayer("platforms", tileset, 0, 0);
    const ground = map.createStaticLayer("ground", tileset, 0, 0);

    // Phaser supports multiple cameras, but you can access the default camera like this:
    const camera = this.cameras.main;
  
    // Set up the arrows to control the camera
    const cursors = this.input.keyboard.createCursorKeys();
    controls = new Phaser.Cameras.Controls.FixedKeyControl({
      camera: camera,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      speed: 0.5
    });
  
    // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.setBackgroundColor('rgba(208, 244, 247, 1)');
  
  }
  
  function update(time, delta) {
    // Apply the controls to the camera each update tick of the game
    controls.update(delta);
  }