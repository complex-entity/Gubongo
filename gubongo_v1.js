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
var scene_obj = null;
var worms_cont = [];
var worms_names = [];
var update_speed = 12;
var last_update = 0;
var coin = null;
var has_winner = false;

var tyabi = {direction_x:'right',direction_y:'up',sprite:null,min_x:100,max_x:1800,min_y:60,max_y:110};
  
function preload() {
    this.load.image("tiles", "assets/sprites/spritesheet_64x.png");
    this.load.image("bg", "assets/sprites/background.png");
    this.load.tilemapTiledJSON("map", "assets/tilemap/gubongo_64map.json");
    this.load.spritesheet('player', 'assets/sprites/kukacok_v2.png',{ frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('coin', 'assets/sprites/coin_anim.png',{ frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('tyabi', 'assets/sprites/tyabi_sp.png',{ frameWidth: 97, frameHeight: 120  });
}
  
function create() {

    scene_obj = this;

    this.add.image(960, 540, 'bg');

    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("spritesheet_64x", "tiles");
      
    //const sky = map.createStaticLayer("sky", tileset, 0, 0);
    //const bg = map.createStaticLayer("bg", tileset, 0, 0);
    const notcollidingitems = map.createStaticLayer("notcollidingitems", tileset, 0, 0);
    const ground = map.createStaticLayer("ground", tileset, 0, 0);

    //ground.setCollisionBetween(9, 16);
    var slopeMap = { 10: 1, 11: 1, 12: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16:1, 17:1, 8:1, 18:1 };
    ground.setCollisionByProperty({ collides: true, goal: true });
    //this.impact.world.setCollisionMapFromTilemapLayer(ground, { }); // slopeProperty: 'slope'
    this.impact.world.setCollisionMapFromTilemapLayer(ground, { slopeMap: slopeMap });
    
    /*
    this.impact.world.on('collide', function(event){
      alert('ok');
    });*/
    
    tyabi.sprite = this.add.sprite(100, 100,'tyabi');
    coin = this.impact.add.sprite(990, 860,'coin');
    //coin = this.impact.add.sprite(100, 100,'coin');

    this.anims.create({
      key: 'coin-flip',
      frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 16 }),
      frameRate: 20,
      repeat: -1
    });

    coin.anims.play('coin-flip');

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

    this.anims.create({
      key: 'worm-left-1',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
      frameRate: 1,
      repeat: -1
    });

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    //cursors = this.input.keyboard.createCursorKeys();
  
}
  
function update(time, delta) {

    update_tyabi();

    if(time>=last_update+update_speed){
      if(worms_cont.length>0){
        worms_cont.forEach(function(worm,index){
          worm.update(time);
        })
      }
      last_update = time;
    }

}

var Worm = new Phaser.Class({

  initialize:

  function Worm (level, name, color)
  {
    this.speed = 200;

    this.sprite = scene_obj.impact.add.sprite(tyabi.sprite.x, tyabi.sprite.y,'player');
    this.sprite.setMaxVelocity(300, 400).setFriction(800, 0);
    this.level = level;
    this.name = name;
    this.name_color = color;

    this.current_frame = 0;
    this.last_mooved = 0;
    this.move_freq = 1000;
    this.chace_to_turn = 10;
    this.chace_to_jump = 20;

    this.direction = Phaser.Math.Between(0,1)==1 ? 'left' : 'right';

    this.setFrame(this.level,this.direction)

    var style = { font: "14px Arial", fill: this.name_color, align: "center" };
    this.label_text = scene_obj.add.text(tyabi.sprite.x, tyabi.sprite.y, ' '+name+' ', style);

  },

  setFrame: function(level,direction)
  {
    var frame_by_level = 4 * level;
    var frame1,frame2;

    if(direction=='left'){
      frame1 = frame_by_level;
      frame2 = frame_by_level + 2;
    }else{
      frame1 = frame_by_level + 1;
      frame2 = frame_by_level + 3;
    }

    this.current_frame=(this.current_frame==frame1) ? frame2 : frame1;

    this.sprite.setFrame(this.current_frame);

  },

  update: function (time)
  {
      this.label_text.x = Math.floor(this.sprite.x) - (this.label_text.width / 2) ;
      this.label_text.y = Math.floor(this.sprite.y + this.sprite.height / 2) - 50;

      return this.move(time);
  },

  check_victory: function()
  {
      if(
        (this.sprite.x >= (coin.x - 16) && this.sprite.x <= (coin.x + 16))
        && (this.sprite.y >= (coin.y - 16) && this.sprite.y <= (coin.y + 16))
      )
      {
        if(has_winner==false)
        {
          has_winner = true;
          document.getElementById('winner_name').innerHTML = this.name;
          document.getElementById('victory').classList = 'fade_in';

          setTimeout(function(){
            window.location.reload();
          },20000)
        }
      }
  },

  move: function (time)
  {
    time = parseInt(time);

    this.check_victory();

    if(time>parseInt(this.move_freq)+parseInt(this.last_mooved) || this.last_mooved==0){

      var jump = (Phaser.Math.Between(0,100)<=this.chace_to_jump) ? Phaser.Math.Between(50,300) : 0;
      
      if ( (this.sprite.x <= 90 && this.direction==='left') || (this.sprite.x >= 1850 && this.direction==='right') ){
        var turn = true;
      }else{
        var turn = (Phaser.Math.Between(0,100)<=this.chace_to_turn) ? true : false;
      }

      if(turn){
        this.direction = (this.direction == 'left') ? 'right' : 'left';
      }

      var horosontal_velocity = Phaser.Math.Between(150,300) * ( (this.direction=='left') ? -1 : 1 );

      this.setFrame(this.level,this.direction);

      if(jump){ 
        this.sprite.setVelocityY(jump*-1);
        horosontal_velocity += (Phaser.Math.Between(70,200) * ( (this.direction=='left') ? -1 : 1 ));
      }

      this.sprite.setVelocityX(horosontal_velocity);


      this.last_mooved = time;

    }

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

function get_worm_level(level){

  var worm_key = 9;

  if(level>=3 && level<6) {
      worm_key = 8;
  } else if (level>=6 && level<9){
      worm_key = 7;
  }  else if (level>=9 && level<12){
      worm_key = 6;
  } else if (level>=12 && level<18){
      worm_key = 5;
  } else if (level>=18 && level<24){
      worm_key = 4;
  } else if (level>=24 && level<30){
      worm_key = 3;
  } else if (level>=30 && level<36){
      worm_key = 2;
  } else if (level>=36 && level<42){
      worm_key = 1;
  } else if(level>=42) {
      worm_key = 0;
  }

  return worm_key;
}

var ws_client = new WebSocket('ws://home.molnarmark.hu:8888');
ws_client.onmessage = function (event) {

    var ws_data = JSON.parse(event.data);

    if(ws_data.bot_command!=undefined){
        if(ws_data.bot_command=='refresh'){
            window.location.reload();
        }
    }else if(worms_cont[ws_data['display-name']]==undefined){

        if(!worms_names[ws_data['display-name']]){
          var name_color = (ws_data.color) ? ws_data.color : '#666666';
          var sub_num = (ws_data.badges!=null && ws_data.badges.subscriber!=undefined) ? ws_data.badges.subscriber :  0;
          worms_cont.push(new Worm(get_worm_level(sub_num),ws_data['display-name'],name_color));
          worms_names[ws_data['display-name']] = 1;
        }
    }
}

/*
window.addEventListener( 'load', function( event ) {
  for(var i=0;i<100;i++){
    worms_cont.push(new Worm(get_worm_level(2),'worm'+i,'#666666'));
    worms_names['worm'+i] = 1;
  }
})*/