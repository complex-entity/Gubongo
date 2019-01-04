var worms_cont = [];

var images = {
    'sprites_1_m': {'ul':'images/sprites/w1_ul.png','ur':'images/sprites/w1_ur.png','dl':'images/sprites/w1_dl.png','dr':'images/sprites/w1_dr.png'},
    'sprites_3_m': {'ul':'images/sprites/w3_ul.png','ur':'images/sprites/w3_ur.png','dl':'images/sprites/w3_dl.png','dr':'images/sprites/w3_dr.png'},
    'sprites_6_m': {'ul':'images/sprites/w6_ul.png','ur':'images/sprites/w6_ur.png','dl':'images/sprites/w6_dl.png','dr':'images/sprites/w6_dr.png'},
    'sprites_1_y': {'ul':'images/sprites/w1y_ul.png','ur':'images/sprites/w1y_ur.png','dl':'images/sprites/w1y_dl.png','dr':'images/sprites/w1y_dr.png'},
    'sprites_2_y': {'ul':'images/sprites/w2y_ul.png','ur':'images/sprites/w2y_ur.png','dl':'images/sprites/w2y_dl.png','dr':'images/sprites/w2y_dr.png'},
    'sprites_3_y': {'ul':'images/sprites/w3y_ul.png','ur':'images/sprites/w3y_ur.png','dl':'images/sprites/w3y_dl.png','dr':'images/sprites/w3y_dr.png'},
}

window.onresize = function(event) {
    c = document.getElementsByTagName('canvas');
    c.width = window.innerWidth;
    c.height = window.innerHeight;
};

window.onload = function(){
    preoload_images();
};

var ws_client = new WebSocket('ws://home.molnarmark.hu:8888');

var wall_or_ramp_category = 0x0001,
worm_category = 0x0002,
platform_category = 0x0004;

var Engine = Matter.Engine,
Render = Matter.Render,
World = Matter.World,
Events = Matter.Events,
Bodies = Matter.Bodies,
Body = Matter.Body;
 
var engine = Engine.create();

var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
        wireframeBackground: 'transparent'
    }
});

let elements_options = {
    collisionFilter: {
        category: wall_or_ramp_category
    },
    isStatic: true,
    render: {
        fillStyle: 'transparent',
        lineWidth: 0
    }
};

let platform_options = {
    collisionFilter: {
        category: platform_category
    },
    isStatic: true,
    render: {
        sprite: {
            texture: 'images/platform2.png'
        }
    }
};

var ground = Bodies.rectangle(window.innerWidth/2,window.innerHeight-20, window.innerWidth, 2,elements_options);
var l_wall = Bodies.rectangle(5,window.innerHeight/2, 10, window.innerHeight, elements_options);
var r_wall = Bodies.rectangle(window.innerWidth-5,window.innerHeight/2, 10, window.innerHeight, elements_options);
var sky = Bodies.rectangle(window.innerWidth/2,0, window.innerWidth, 40, elements_options);

var sensor_options = elements_options;
sensor_options.isSensor = true;
var l_wall_sensor = Bodies.rectangle(10,window.innerHeight/2, 10, window.innerHeight, sensor_options);
var r_wall_sensor = Bodies.rectangle(window.innerWidth-10,window.innerHeight/2, 10, window.innerHeight, sensor_options);

World.add(engine.world, [ground,l_wall, r_wall, sky, l_wall_sensor, r_wall_sensor]);

var platform_objects = [];


for (var row = 1; row < 4; ++row){
    // a platform img 384x18 pixel, szóval 192 és 9 pixel a közepe
    let pos_x = 192 + 80;
    if (row % 2 == 0){
        // páros sorokban legyenek eltolva egy kicsit
        pos_x += 192 + 20;
    }
    
    let pos_y = window.innerHeight + 20 - row * 160;
    while (pos_x < window.innerWidth - (192 + 40)){
        platform_objects.push(Bodies.rectangle(pos_x, pos_y, 384, 18, platform_options));
        pos_x += 384 + 200;
    }
}

World.add(engine.world, platform_objects);

Engine.run(engine);
Render.run(render);

var worm_obj = function(name,level,text_color){

    this.direction = (get_random_int(0,2) % 2 == 0) ? 'l' : 'r';
    this.state = 'u';
    this.matter_obj = {};
    this.name = name;
    this.force_direction_change = false;

    var that = this;

    this.create_matter_obj = function(){

        let random_start = get_random_int(20,window.innerWidth-20);

        that.matter_obj = Bodies.rectangle(random_start,window.innerHeight - 40,32,32,{
            render: {
                sprite: {
                    texture: images['sprites_'+level][this.state+this.direction]
                },
                text:{
                    content:this.name,
                    color:text_color,
                    size:12,
                    y_offset: -26,
                    font_weight: 'bold'
                }
            },
            collisionFilter: {
                category: worm_category,
                mask: wall_or_ramp_category | platform_category
            },            
            friction: 1,
            frictionStatic: 1,
            inertia: Infinity
        });
    }

    this.last_update = new Date();
    this.next_update = 750;
    this.falling = false;
    this.check_collisions = false;
    
    this.update_function = function(){
        
        window.requestAnimationFrame(this.update_function.bind(this));
        
        let velocity_y = this.matter_obj.velocity.y;
        if (Math.abs(velocity_y) < 0.01){
            this.falling = false;
        }
        else if (velocity_y < 0){
            this.falling = false;
            this.matter_obj.collisionFilter.mask = wall_or_ramp_category;
        }
        else{
            if (!this.falling){
                this.falling = true;
                this.check_collisions = true;
            }
            
            if (this.check_collisions){
                let nothing_collides = true;
                for (let i = 0; i < platform_objects.length; ++i){
                    if (Matter.SAT.collides(this.matter_obj,platform_objects[i]).collided){
                        nothing_collides = false;
                        break;
                    }
                }
                
                if (nothing_collides){
                    this.check_collisions = false;
                    this.matter_obj.collisionFilter.mask = wall_or_ramp_category | platform_category;
                }
            }
        }
        
        if (this.falling){
            return;
        }
        
        let now = new Date();
        if(now - this.last_update < this.next_update){
            return;
        }
        
        this.last_update = now;
        this.next_update = Math.random() * 200 + 750;
        
        let random_to_jump = get_random_int(0,100);
        let random_to_turn = get_random_int(0,100);

        //jump
        let random_force_y = get_random_int(1,5) / 100 * -1;
        let force_y = random_to_jump > 82 ? random_force_y : 0;
        let change_direction = random_to_turn > 80 ? true : false;

        if(that.force_direction_change){
            change_direction=true;
            that.force_direction_change = false;
        }

        if(change_direction){
            that.direction = (that.direction=='l') ? 'r' : 'l';
        }

        let x_force_multipler = (force_y>0) ? 10000 : 1000;

        let random_force_x = get_random_int(15,25) / x_force_multipler;
        let force_x = ((that.direction=='l') ? -1 : 1) * random_force_x;

        that.state = (that.state=='u') ? 'd' : 'u';
        that.matter_obj.render.sprite.texture = images['sprites_'+level][that.state+that.direction];

        Body.applyForce( that.matter_obj, {x: that.matter_obj.position.x, y: that.matter_obj.position.y}, {x: force_x, y: force_y});
    }

    worms_cont[name] = this;

    this.create_matter_obj();
    this.update_function();
}

Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    
    for (var i = 0, j = pairs.length; i != j; ++i) {
        
        var pair = pairs[i];
        var wall_hit = 0;

        if (pair.bodyA === l_wall_sensor || pair.bodyA === r_wall_sensor) {
            var wall_hit = pair.bodyB;
        } else if (pair.bodyB === l_wall_sensor || pair.bodyB === r_wall_sensor) {
            var wall_hit = pair.bodyA;
        }

        if(wall_hit!==0){
            if(wall_hit.render.text && wall_hit.render.text.content){
                if(worms_cont[wall_hit.render.text.content]){
                    worms_cont[wall_hit.render.text.content].force_direction_change=true;
                }
            }
        }
    }
});

ws_client.onmessage = function (event) {

    var ws_data = JSON.parse(event.data);

    if(ws_data.bot_command!=undefined){
        if(ws_data.bot_command=='refresh'){
            window.location.reload();
        }
    }else if(worms_cont[ws_data['display-name']]==undefined){

        var name_color = (ws_data.color) ? ws_data.color : '#d8ff7f';
        var sub_num = (ws_data.badges!=null && ws_data.badges.subscriber!=undefined) ? ws_data.badges.subscriber :  0;
        let worm = new worm_obj(ws_data['display-name'],get_worm_level(sub_num),name_color);
        World.add(engine.world, [worm.matter_obj]);

    }
}

function get_worm_level(level){

    var worm_key = '1_m';

    if(level>=3 && level<6) {
        worm_key = '3_m';
    } else if (level>=6 && level<12){
        worm_key = '6_m';
    } else if (level>=12 && level<24){
        worm_key = '1_y';
    } else if (level>=24 && level<36){
        worm_key = '2_y';
    } else if(level>=36) {
        worm_key = '3_y';
    }

    return worm_key;
}

function get_random_int(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; 
}

function preload_image(url){
    var img=new Image();
    img.src=url;
}

function preoload_images(){

    for (var key in images) {
        if(typeof(images[key])=='object'){
            for (var image_type in images[key]) {
                preload_image(images[key][image_type]);
            }
        }
    }
}
