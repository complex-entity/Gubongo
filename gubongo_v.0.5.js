var zsak_x, zsak_y;

function resized()
{
    var background_div = document.getElementById("background-image");
    
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;
    var ratio = width / height;
    
    var style_object = background_div.style;
    if (ratio > 16 / 9)
    {
        style_object.top = "0px";
        style_object.left = (width - height / 9 * 16) / 2 + "px";
        style_object.height = "100%";
        style_object.width = "";
        
        zsak_y = height * 0.44;
        zsak_x = (width - height / 9 * 16) / 2 + height / 9 * 16 * 0.385;
    }
    else
    {
        style_object.top = (height - width / 16 * 9) / 2 + "px";
        style_object.left = "0px";
        style_object.width = "100%";
        style_object.height = "";
        
        zsak_x = width * 0.385;
        zsak_y = (height - width / 16 * 9) / 2 + width / 16 * 9 * 0.44;
    }
}

window.addEventListener("resize", resized);
resized();

var ws_client = new WebSocket('ws://home.molnarmark.hu:8888');
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
        Engine.addBody(worm.matter_obj);
    }
}

var nameCacheCanvas = document.createElement("canvas");
nameCacheCanvas.width = 256;
nameCacheCanvas.height = 20;
var nameCacheCanvasCtx = nameCacheCanvas.getContext("2d");

var worms_cont = [];

var images = {
    'sprites_1_m': {'ul':'images/sprites/w1_ul.png','ur':'images/sprites/w1_ur.png','dl':'images/sprites/w1_dl.png','dr':'images/sprites/w1_dr.png'},
    'sprites_3_m': {'ul':'images/sprites/w3_ul.png','ur':'images/sprites/w3_ur.png','dl':'images/sprites/w3_dl.png','dr':'images/sprites/w3_dr.png'},
    'sprites_6_m': {'ul':'images/sprites/w6_ul.png','ur':'images/sprites/w6_ur.png','dl':'images/sprites/w6_dl.png','dr':'images/sprites/w6_dr.png'},
    'sprites_1_y': {'ul':'images/sprites/w1y_ul.png','ur':'images/sprites/w1y_ur.png','dl':'images/sprites/w1y_dl.png','dr':'images/sprites/w1y_dr.png'},
    'sprites_2_y': {'ul':'images/sprites/w2y_ul.png','ur':'images/sprites/w2y_ur.png','dl':'images/sprites/w2y_dl.png','dr':'images/sprites/w2y_dr.png'},
    'sprites_3_y': {'ul':'images/sprites/w3y_ul.png','ur':'images/sprites/w3y_ur.png','dl':'images/sprites/w3y_dl.png','dr':'images/sprites/w3y_dr.png'},
}

var image_cache = {};
preload_images();


var platform_objects = [];
var platform_sprite = new Image();
platform_sprite.onload = function(){
    for (var row = 1; row < 4; ++row){
        let pos_x = 80;
        if (row % 2 == 0){
            // páros sorokban legyenek eltolva egy kicsit
            pos_x += 192 + 20;
        }
        
        let pos_y = window.innerHeight + 20 - row * 160;
        while (pos_x < window.innerWidth - (192 + 40)){
            platform_objects.push(Engine.addBody({
                position: {
                    x: pos_x,
                    y: pos_y
                },
                sprite: platform_sprite,
                width: 384,
                height: 18,
                isStatic: true,
                collisionMask: 0x01
            }));
            pos_x += 384 + 200;
        }
    }
}
platform_sprite.src = 'images/platform2.png';


var worm_obj = function(name,level,text_color){

    this.direction = (get_random_int(0,2) % 2 == 0) ? 'l' : 'r';
    this.state = 'u';
    this.matter_obj = {};
    this.name = name;
    this.force_direction_change = false;
    
    nameCacheCanvasCtx.font = "bold 12pt sans-serif"; // ez azert kell ide ele is hogy jo legyen a betumeret
    nameCacheCanvas.width = nameCacheCanvasCtx.measureText(name).width;
    nameCacheCanvasCtx.textAlign = "left";
    nameCacheCanvasCtx.textBaseline = "top";
    nameCacheCanvasCtx.font = "bold 12pt sans-serif";
    nameCacheCanvasCtx.fillStyle = text_color;
    nameCacheCanvasCtx.fillText(name, 0, 0);
    var name_image = new Image();
    name_image.src = nameCacheCanvas.toDataURL("image/png");

    var that = this;

    this.create_matter_obj = function(){

        that.matter_obj = {
            position: {
                x: zsak_x,
                y: zsak_y
            },
            velocity: {
                x: get_random_float(200, 300) * ((that.direction=='l') ? -1 : 1) * Engine.windowWidth / 1920,
                y: get_random_float(-1000, -300) * Engine.windowHeight / 1080
            },
            sprite: image_cache[images['sprites_'+level][this.state+this.direction]],
            text: {
                content: name_image,
                y_offset: -10
            },
            width: 32,
            height: 32,
            isStatic: false,
            collisionMask: 0x01
        };
    }

    this.last_update = performance.now();
    this.next_update = 750;
    this.falling = true;
    this.check_collisions = false;
    
    this.update_function = function(){
        let velocity_y = that.matter_obj.velocity.y;
        if (Math.abs(velocity_y) < 0.01){
            this.falling = false;
        }
        else if (velocity_y < 0){
            this.falling = true;
            this.matter_obj.collisionMask = 0x00;
        }
        else{
            if (this.falling){
                this.check_collisions = true;
            }
            
            if (this.check_collisions && !this.matter_obj.isColliding){
                this.check_collisions = false;
                this.matter_obj.collisionMask = 0x01;
            }
        }
        
        if (this.falling){
            return;
        }
        
        let now = performance.now();
        if(now - this.last_update < this.next_update){
            return;
        }
        
        this.last_update = now;
        this.next_update = Math.random() * 200 + 750;
        
        // ha magasabban vannak akkor kiseb esellyel ugranak
        let random_to_jump = get_random_int(0,100) * Math.min(that.matter_obj.position.y / Engine.windowHeight + 0.2, 1) > 75;
        let random_to_turn = get_random_int(0,100) > 80;
        
        //jump
        let force_y = random_to_jump ? get_random_float(-700,-300) : 0;
        let change_direction = random_to_turn;
        
        if(that.matter_obj.position.x < 2 || that.matter_obj.position.x > Engine.windowWidth - that.matter_obj.width - 2){
            change_direction=true;
        }

        if(change_direction){
            that.direction = (that.direction=='l') ? 'r' : 'l';
        }

        let random_force_x = get_random_float(180,300);
        let force_x = ((that.direction=='l') ? -1 : 1) * random_force_x;

        that.state = (that.state=='u') ? 'd' : 'u';
        that.matter_obj.sprite = image_cache[images['sprites_'+level][that.state+that.direction]];
        
        Engine.applyForce(that.matter_obj, force_x, force_y);
    }

    this.create_matter_obj();
    worms_cont[name] = this;
}

function updateWorms()
{
    for (var worm in worms_cont)
        worms_cont[worm].update_function();
    
    window.requestAnimationFrame(updateWorms);
}

updateWorms();

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

function get_random_float(min, max) {
    return Math.random() * (max - min) + min;
}

function preload_image(url){
    var img=new Image();
    img.src=url;
    image_cache[url] = img;
}

function preload_images(){
    for (var key in images) {
        if(typeof(images[key])=='object'){
            for (var image_type in images[key]) {
                preload_image(images[key][image_type]);
            }
        }
    }
}

// debug
/*
for (let i = 0; i < 30; ++i)
{
    var name_color = '#d8ff7f';
    var sub_num = Math.random() * 40;
    let worm = new worm_obj("Féreg " + i, get_worm_level(sub_num), name_color);
    Engine.addBody(worm.matter_obj);
}
*/