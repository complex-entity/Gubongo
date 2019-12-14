"use strict";
/// <reference path="node_modules/phaser/types/phaser.d.ts" />
const screen_width = 1920;
const screen_height = 1080;
const border_size = 80;
const config = {
    type: Phaser.WEBGL,
    width: screen_width,
    height: screen_height,
    parent: "game-container",
    render: {
        pixelArt: true,
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'impact',
        impact: { gravity: 800 }
    },
};
const game = new Phaser.Game(config);
let scene_obj = null;
const worms_container = {}; // store worms indexed by their name
const update_speed = 12;
let last_update = 0;
let coin = null;
let has_winner = false;
const tyabi = {
    direction_x: true,
    sprite: null,
    min_x: 100,
    max_x: screen_width - 100,
    start_y: 85,
    radius_y: 25,
    frame_index: 0
};
const coin_size = 32;
const worm_size = 32;
function preload() {
    this.load.image("tiles", "assets/sprites/spritesheet_64x.png");
    this.load.image("bg", "assets/sprites/background.png");
    this.load.tilemapTiledJSON("map", "assets/tilemap/gubongo_64map.json");
    this.load.spritesheet('player', 'assets/sprites/kukacok_v2.png', { frameWidth: worm_size, frameHeight: worm_size });
    this.load.spritesheet('coin', 'assets/sprites/coin_anim.png', { frameWidth: coin_size, frameHeight: coin_size });
    this.load.spritesheet('tyabi', 'assets/sprites/tyabi_sp.png', { frameWidth: 97, frameHeight: 120 });
}
function create() {
    scene_obj = this;
    this.add.image(960, 540, 'bg');
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("spritesheet_64x", "tiles");
    map.createStaticLayer("notcollidingitems", tileset, 0, 0);
    const ground = map.createStaticLayer("ground", tileset, 0, 0);
    const slopeMap = { 10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 8: 1, 18: 1 };
    ground.setCollisionByProperty({ collides: true, goal: true });
    this.impact.world.setCollisionMapFromTilemapLayer(ground, { slopeMap: slopeMap });
    tyabi.sprite = this.add.sprite(100, 100, 'tyabi');
    coin = this.add.sprite(990, 860, 'coin');
    this.anims.create({
        key: 'coin-flip',
        frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 16 }),
        frameRate: 20,
        repeat: -1
    });
    coin.anims.play('coin-flip');
    this.anims.create({
        key: 'tyabi-turn-left',
        frames: [{ key: 'tyabi', frame: 1 }],
        frameRate: 20
    });
    this.anims.create({
        key: 'tyabi-turn-right',
        frames: [{ key: 'tyabi', frame: 0 }],
        frameRate: 20
    });
    this.anims.create({
        key: 'worm-left-1',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
        frameRate: 1,
        repeat: -1
    });
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
}
function update(time, delta) {
    update_tyabi();
    if (time >= last_update + update_speed) {
        for (let worm_name in worms_container) {
            worms_container[worm_name].update(delta);
        }
        last_update = time;
    }
}
// chance: [0, 1] 
function random_chance(chance) {
    return Math.random() < chance;
}
class Worm {
    constructor(level, name, color) {
        this.level = level;
        this.name = name;
        this.name_color = color;
        this.current_frame = 0;
        this.move_freq_min = 800;
        this.move_freq_max = 1200;
        this.time_until_next_move = Math.random() * (this.move_freq_max - this.move_freq_min) + this.move_freq_min;
        this.chance_to_turn = 0.1;
        this.chance_to_jump = 0.2;
        this.falling = true;
        this.horizontal_velocity = 0;
        this.direction = Math.random() < 0.5;
        this.sprite = scene_obj.impact.add.sprite(tyabi.sprite.x, tyabi.sprite.y, "player");
        this.sprite.setMaxVelocity(300, 800);
        // this.sprite.setFriction(800, 0);
        this.setFrame(this.direction);
        const style = { font: "14px Arial", fill: this.name_color, align: "center" };
        this.label_text = scene_obj.add.text(tyabi.sprite.x, tyabi.sprite.y, " " + name + " ", style);
    }
    setFrame(direction) {
        const frame_by_level = 4 * this.level;
        let frame1, frame2;
        if (direction) {
            frame1 = frame_by_level + 1;
            frame2 = frame_by_level + 3;
        }
        else {
            frame1 = frame_by_level;
            frame2 = frame_by_level + 2;
        }
        this.current_frame = (this.current_frame === frame1) ? frame2 : frame1;
        this.sprite.setFrame(this.current_frame);
    }
    update(delta) {
        this.label_text.x = Math.floor(this.sprite.x) - (this.label_text.width / 2);
        this.label_text.y = Math.floor(this.sprite.y + this.sprite.height / 2) - 50;
        this.move(delta);
    }
    check_victory() {
        if (!has_winner &&
            Math.abs(this.sprite.x - coin.x) <= (coin_size * 0.5 + worm_size * 0.5) &&
            Math.abs(this.sprite.y - coin.y) <= (coin_size * 0.5 + worm_size * 0.5)) {
            has_winner = true;
            document.getElementById('winner_name').textContent = this.name;
            document.getElementById('victory').className = 'fade_in';
            setTimeout(function () {
                window.location.reload();
            }, 20000);
        }
    }
    move(delta) {
        this.check_victory();
        const velocity = this.sprite.vel;
        const was_falling = this.falling;
        this.falling = velocity.y !== 0;
        if (was_falling != this.falling) {
            if (was_falling) {
                // just landed
                this.sprite.setFrictionX(800);
                this.sprite.setVelocityX(velocity.x * 0.6); // slow down when landing
            }
            else {
                // just jumped
                this.sprite.setFrictionX(0);
            }
        }
        if (this.falling) {
            // preserve some of the horizontal velocity if hitting a wall
            if (velocity.x === 0) {
                this.horizontal_velocity *= 0.95;
                this.sprite.setVelocityX(this.horizontal_velocity);
            }
        }
        const at_border = (this.sprite.x < border_size && !this.direction) || (this.sprite.x > (screen_width - border_size) && this.direction);
        if (at_border) {
            // bounce off the sides
            this.direction = !this.direction;
            this.setFrame(this.direction);
            this.sprite.setVelocityX(-velocity.x * 0.5);
        }
        if (this.should_move(delta)) {
            const turn = random_chance(this.chance_to_turn);
            if (turn) {
                this.direction = !this.direction;
            }
            this.setFrame(this.direction);
            const jump = random_chance(this.chance_to_jump);
            if (jump) {
                const jump_angle = Phaser.Math.Between(30, 60) * Phaser.Math.DEG_TO_RAD;
                const jump_velocity = Phaser.Math.Between(200, 450);
                this.horizontal_velocity = jump_velocity * Math.cos(jump_angle) * (this.direction ? 1 : -1);
                this.sprite.setVelocityX(this.horizontal_velocity);
                this.sprite.setVelocityY(jump_velocity * -Math.sin(jump_angle));
            }
            else {
                this.sprite.setVelocityX(Phaser.Math.Between(150, 300) * (this.direction ? 1 : -1));
            }
        }
    }
    should_move(delta) {
        this.time_until_next_move -= delta;
        if (this.time_until_next_move < 0) {
            this.time_until_next_move = Math.random() * (this.move_freq_max - this.move_freq_min) + this.move_freq_min;
            // only move if not jumping or falling
            return this.sprite.vel.y === 0;
        }
        return false;
    }
}
function update_tyabi() {
    const sprite = tyabi.sprite;
    const ty_xpos = Math.floor(sprite.x);
    if (tyabi.direction_x) {
        if (ty_xpos <= tyabi.max_x) {
            // move right
            sprite.x += 2;
        }
        else {
            // turn left
            tyabi.direction_x = !tyabi.direction_x;
            sprite.anims.play("tyabi-turn-left", true);
        }
    }
    else if (!tyabi.direction_x) {
        if (ty_xpos >= tyabi.min_x) {
            // move left
            sprite.x -= 2;
        }
        else {
            // turn right
            tyabi.direction_x = !tyabi.direction_x;
            sprite.anims.play("tyabi-turn-right", true);
        }
    }
    sprite.y = tyabi.start_y + tyabi.radius_y * Math.sin(tyabi.frame_index * 0.05);
    ++tyabi.frame_index;
}
function get_worm_level(months) {
    // if months are less than 12, then we step by 3 months (0-2 months: 9, 3-5: 8, etc.)
    // else we step by 6 months (12-17 months: 5, 18-23: 4, etc., up until 41 months; after 42 months, we return 0) 
    return Math.max(0, (months < 12 ? 9 : 7) - (months / 3 | 0));
}
const ws_client = new WebSocket('ws://home.molnarmark.hu:8888');
ws_client.onmessage = function (event) {
    var _a, _b;
    const ws_data = JSON.parse(event.data);
    if (ws_data.bot_command !== undefined && ws_data.bot_command === "refresh") {
        window.location.reload();
    }
    else {
        const display_name = ws_data['display-name'];
        if (!worms_container.hasOwnProperty(display_name)) {
            const name_color = (_a = ws_data.color, (_a !== null && _a !== void 0 ? _a : '#666666'));
            const sub_months = Number(((_b = ws_data.badges) === null || _b === void 0 ? void 0 : _b.subscriber) || 0);
            add_worm(sub_months, display_name, name_color);
        }
    }
};
function add_worm(months, name, color) {
    worms_container[name] = new Worm(get_worm_level(months), name, color);
}
let test_worm_index = 0;
function spawn_test_worms(count) {
    for (let i = 0; i < count; ++i) {
        const name = 'Worm' + (test_worm_index++);
        worms_container[name] = new Worm(get_worm_level(Math.random() * 36 | 0), name, '#666666');
    }
}
