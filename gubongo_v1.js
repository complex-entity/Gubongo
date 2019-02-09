const config = {
    type: Phaser.WEBGL,
    width: 1820,
    height: 1020,
    parent: "game-container",
    pixelArt: true,
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    physics: {
        default: 'impact',
        impact: { gravity: 200 }
    },
  };
  
  const game = new Phaser.Game(config);
  let controls;
  
  function preload() {
    this.load.image("tiles", "assets/sprites/spritesheet.png");
    this.load.tilemapTiledJSON("map", "assets/tilemap/gubongo_map.json");
    this.load.spritesheet('player', 'assets/sprites/kukacok.png',{ frameWidth: 32, frameHeight: 32 });
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
    const ground = map.createStaticLayer("ground", tileset, 0, 0);

    ground.setCollisionByProperty({ collides: true });

    this.impact.world.setCollisionMapFromTilemapLayer(ground, { slopeProperty: 'slope' });

    player = this.impact.add.sprite(100, 32,'player');
    player.setMaxVelocity(300, 400).setFriction(800, 0);
    player.body.accelGround = 1200;
    player.body.accelAir = 600;
    player.body.jumpSpeed = 300;

    var style = { font: "12px Arial", fill: "#ff0044", wordWrap: true, wordWrapWidth: player.width, align: "center", backgroundColor: "transparent" };

    text = this.add.text(0, 0, "kukacka", style);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    //this.cameras.main.startFollow(player);

    cursors = this.input.keyboard.createCursorKeys();
    //camera.setBackgroundColor('rgba(208, 244, 247, 1)');
  
  }
  
  function update(time, delta) {
    var accel = player.body.standing ? player.body.accelGround : player.body.accelAir;

    if (cursors.left.isDown)
    {
        player.setAccelerationX(-accel);
    }
    else if (cursors.right.isDown)
    {
        player.setAccelerationX(accel);
    }
    else
    {
        player.setAccelerationX(0);
    }

    if (cursors.up.isDown && player.body.standing)
    {
        player.setVelocityY(-player.body.jumpSpeed);
    }

    text.x = Math.floor(player.x + player.width / 2);
    text.y = Math.floor(player.y + player.height / 2);
  }