const config = {
    type: Phaser.WEBGL,
    width: 1920,
    height: 1080,
    parent: "game-container",
    pixelArt: true,
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    physics: {
        default: 'impact',
        impact: { gravity: 400 }
    },
  };
  
  var game = new Phaser.Game(config);
  let controls;
  var player;

  var tyabi = {direction_x:'right',direction_y:'up',sprite:null,min_x:100,max_x:1800,min_y:60,max_y:110};

  
  function preload() {
    this.load.image("tiles", "assets/sprites/spritesheet.png");
    this.load.tilemapTiledJSON("map", "assets/tilemap/gubongo_map.json");
    this.load.spritesheet('player', 'assets/sprites/kukacok.png',{ frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('tyabi', 'assets/sprites/tyabi_sp.png',{ frameWidth: 97, frameHeight: 120  });
  }
  
  function create() {

    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("ts", "tiles");
      
    const sky = map.createStaticLayer("sky", tileset, 0, 0);
    const bg = map.createStaticLayer("bg", tileset, 0, 0);
    const notcollidingitems = map.createStaticLayer("notcollidingitems", tileset, 0, 0);
    const ground = map.createStaticLayer("ground", tileset, 0, 0);

    ground.setCollisionByProperty({ collides: true });

    this.impact.world.setCollisionMapFromTilemapLayer(ground, { slopeProperty: 'slope' });

    tyabi.sprite = this.add.sprite(100, 100,'tyabi');
    
    this.anims.create({
      key: 'tyabi-turn-left',
      frames: [ { key: 'tyabi', frame: 2 } ],
      frameRate: 20
    });

    this.anims.create({
      key: 'tyabi-turn-right',
      frames: [ { key: 'tyabi', frame: 1 } ],
      frameRate: 20
    });

    player = this.impact.add.sprite(100, 32,'player');
    player.setMaxVelocity(300, 400).setFriction(800, 0);
    player.body.accelGround = 1200;
    player.body.accelAir = 600;
    player.body.jumpSpeed = 300;

    var style = { font: "12px Arial", fill: "#ff0044", wordWrap: true, wordWrapWidth: player.width, align: "center", backgroundColor: "#fff" };

    text = this.add.text(0, 0, "kukacka", style);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    //this.cameras.main.startFollow(player);

    cursors = this.input.keyboard.createCursorKeys();
    //camera.setBackgroundColor('rgba(208, 244, 247, 1)');
  
  }
  
  function update(time, delta) {

    update_tyabi();

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

    
/*var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    */
    //console.log(time);
  }

function update_tyabi(){

  var ty_xpos = Math.floor(tyabi.sprite.x);
  var ty_ypos = Math.floor(tyabi.sprite.y);


  if(tyabi.direction_x == 'right' && ty_xpos<=1800){
    tyabi.sprite.x = tyabi.sprite.x + 2;
  }else if(tyabi.direction_x == 'left' && ty_xpos>=100){
    tyabi.sprite.x = tyabi.sprite.x - 2;
  }

  if(tyabi.direction_y == 'up' && ty_ypos>=60){
    tyabi.sprite.y = tyabi.sprite.y - 1;
  }else if(tyabi.direction_y == 'down' && ty_ypos<=120){
    tyabi.sprite.y = tyabi.sprite.y + 1;
  }

  if(tyabi.direction_y == 'up' && ty_ypos<60){
    tyabi.direction_y = 'down';
  }

  if(tyabi.direction_y == 'down' && ty_ypos>120){
    tyabi.direction_y = 'up';
  }

  if(tyabi.direction_x == 'right' && ty_xpos>1800){
    tyabi.direction_x = 'left';
    tyabi.sprite.anims.play("tyabi-turn-right", true);
  }

  if(tyabi.direction_x == 'left' && ty_xpos<100){
    tyabi.direction_x = 'right';
    tyabi.sprite.anims.play("tyabi-turn-left", true);
  }

}