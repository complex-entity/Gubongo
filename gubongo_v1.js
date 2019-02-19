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
var worms_cont = [];
var update_speed = 12;
var last_update = 0;

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

    worms_cont.push(new Worm(this,1,tyabi.x,tyabi.y));
    
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

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    //this.cameras.main.startFollow(player);

    cursors = this.input.keyboard.createCursorKeys();
    //camera.setBackgroundColor('rgba(208, 244, 247, 1)');
  
}
  
function update(time, delta) {

    update_tyabi();

    if(time>=last_update+update_speed){
      if(worms_cont.length>0){
        worms_cont.forEach(function(worm,index){
          worm.update();
        })
      }
      last_update = time;
    }

   /* var accel = player.body.standing ? player.body.accelGround : player.body.accelAir;

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
    text.y = Math.floor(player.y + player.height / 2);*/

    
/*var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    */
    //console.log(time);
}

var Worm = new Phaser.Class({

  initialize:

  function Worm (scene, level, x, y)
  {
    this.speed = 200;

    this.sprite = scene.impact.add.sprite(100, 32,'player');
    this.sprite.setMaxVelocity(300, 400).setFriction(800, 0);
    this.sprite.body.accelGround = 1200;
    this.sprite.body.accelAir = 600;
    this.sprite.body.jumpSpeed = 300;

    var style = { font: "13px Arial", fill: "#ff0044", align: "center", backgroundColor: "#fff" };
    
    this.label_text = scene.add.text(0, 0, "kukacka akinek hosszú", style);
  },

  update: function (time)
  {
      this.label_text.x = Math.floor(this.sprite.x) - (this.label_text.width / 2) ;
      this.label_text.y = Math.floor(this.sprite.y + this.sprite.height / 2) - 50;

      return this.move(time);
  },

  move: function (time)
  {
      
      this.direction = this.heading;

      return true;
  }

});

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