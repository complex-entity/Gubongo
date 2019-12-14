/// <reference path="node_modules/phaser/types/phaser.d.ts" />

const screen_width = 1920;
const screen_height = 1080;
const config: Phaser.Types.Core.GameConfig = {
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
        impact: { gravity: 400 }
    },
};

const game = new Phaser.Game(config);
let scene_obj: Phaser.Scene | null = null;
const worms_container: { [key: string]: Worm } = {}; // store worms indexed by their name
const update_speed = 12;
let last_update = 0;
let coin: Phaser.Physics.Impact.ImpactSprite | null = null;
let has_winner = false;

interface Tyabi {
    direction_x: boolean; // left: false, right: true
    sprite: Phaser.GameObjects.Sprite | null;
    min_x: number;
    max_x: number;
    start_y: number;
    radius_y: number;
    frame_index: number;
}

const tyabi: Tyabi = {
    direction_x: true,
    sprite: null,
    min_x: 100,
    max_x: screen_width - 100,
    start_y: 85,
    radius_y: 25,
    frame_index: 0
};

function preload(this: Phaser.Scene) {
    this.load.image("tiles", "assets/sprites/spritesheet_64x.png");
    this.load.image("bg", "assets/sprites/background.png");
    this.load.tilemapTiledJSON("map", "assets/tilemap/gubongo_64map.json");
    this.load.spritesheet('player', 'assets/sprites/kukacok_v2.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('coin', 'assets/sprites/coin_anim.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('tyabi', 'assets/sprites/tyabi_sp.png', { frameWidth: 97, frameHeight: 120 });
}

function create(this: Phaser.Scene) {

    scene_obj = this;

    this.add.image(960, 540, 'bg');

    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("spritesheet_64x", "tiles");

    //const sky = map.createStaticLayer("sky", tileset, 0, 0);
    //const bg = map.createStaticLayer("bg", tileset, 0, 0);
    const notcollidingitems = map.createStaticLayer("notcollidingitems", tileset, 0, 0);
    const ground = map.createStaticLayer("ground", tileset, 0, 0);

    //ground.setCollisionBetween(9, 16);
    const slopeMap = { 10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 8: 1, 18: 1 };
    ground.setCollisionByProperty({ collides: true, goal: true });
    //this.impact.world.setCollisionMapFromTilemapLayer(ground, { }); // slopeProperty: 'slope'
    this.impact.world.setCollisionMapFromTilemapLayer(ground, { slopeMap: slopeMap });

    /*
    this.impact.world.on('collide', function(event){
      alert('ok');
    });*/

    tyabi.sprite = this.add.sprite(100, 100, 'tyabi');
    coin = this.impact.add.sprite(990, 860, 'coin');
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

    //cursors = this.input.keyboard.createCursorKeys();
}

function update(this: Phaser.Scene, time: number, delta: number) {

    update_tyabi();

    if (time >= last_update + update_speed) {
        for (let worm_name in worms_container) {
            worms_container[worm_name].update(delta);
        }

        last_update = time;
    }
}

// chance: [0, 1] 
function random_chance(chance: number) {
    return Math.random() < chance;
}

class Worm {
    private level: number;
    private name: string;
    private name_color: string;

    private current_frame: number;
    private time_until_next_move: number;
    private move_freq_min: number;
    private move_freq_max: number;
    private chance_to_turn: number;
    private chance_to_jump: number;
    private direction: boolean; // left: false, right: true

    private sprite: Phaser.Physics.Impact.ImpactSprite;
    private label_text: Phaser.GameObjects.Text;

    constructor(level: number, name: string, color: string) {
        this.level = level;
        this.name = name;
        this.name_color = color;

        this.current_frame = 0;
        this.move_freq_min = 800;
        this.move_freq_max = 1200;
        this.time_until_next_move = Math.random() * (this.move_freq_max - this.move_freq_min) + this.move_freq_min;
        this.chance_to_turn = 0.1;
        this.chance_to_jump = 0.2;

        this.direction = Math.random() < 0.5;

        this.sprite = scene_obj!.impact.add.sprite(tyabi.sprite!.x, tyabi.sprite!.y, 'player');
        this.sprite.setMaxVelocity(300, 400)
        this.sprite.setFriction(800, 0);

        this.setFrame(this.level, this.direction)

        const style = { font: "14px Arial", fill: this.name_color, align: "center" };
        this.label_text = scene_obj!.add.text(tyabi.sprite!.x, tyabi.sprite!.y, " " + name + " ", style);
    }

    setFrame(level: number, direction: boolean) {
        const frame_by_level = 4 * level;
        let frame1, frame2;

        if (direction) {
            frame1 = frame_by_level + 1;
            frame2 = frame_by_level + 3;
        } else {
            frame1 = frame_by_level;
            frame2 = frame_by_level + 2;
        }

        this.current_frame = (this.current_frame === frame1) ? frame2 : frame1;

        this.sprite.setFrame(this.current_frame);
    }

    update(delta: number) {
        this.label_text.x = Math.floor(this.sprite.x) - (this.label_text.width / 2);
        this.label_text.y = Math.floor(this.sprite.y + this.sprite.height / 2) - 50;

        this.move(delta);
    }

    check_victory() {
        if ((this.sprite.x >= (coin!.x - 16) && this.sprite.x <= (coin!.x + 16))
            && (this.sprite.y >= (coin!.y - 16) && this.sprite.y <= (coin!.y + 16))) {
            if (!has_winner) {
                has_winner = true;
                document.getElementById('winner_name')!.textContent = this.name;
                document.getElementById('victory')!.className = 'fade_in';

                setTimeout(function () {
                    window.location.reload();
                }, 20000)
            }
        }
    }

    move(delta: number) {
        this.check_victory();

        if (this.should_move(delta)) {

            const border_size = 80;
            const jump = random_chance(this.chance_to_jump) ? Phaser.Math.Between(50, 300) : 0;

            let turn;
            if ((this.sprite.x <= border_size && !this.direction) || (this.sprite.x >= (screen_width - border_size) && this.direction)) {
                turn = true;
            } else {
                turn = random_chance(this.chance_to_turn);
            }

            if (turn) {
                this.direction = !this.direction;
            }

            let horizontal_velocity = Phaser.Math.Between(150, 300) * (this.direction ? 1 : -1);

            this.setFrame(this.level, this.direction);

            if (jump) {
                this.sprite.setVelocityY(-jump);
                horizontal_velocity += (Phaser.Math.Between(70, 200) * (this.direction ? 1 : -1));
            }

            this.sprite.setVelocityX(horizontal_velocity);
        }
    }

    should_move(delta: number) {
        this.time_until_next_move -= delta;

        if (this.time_until_next_move < 0) {
            this.time_until_next_move = Math.random() * (this.move_freq_max - this.move_freq_min) + this.move_freq_min;
            return true;
        }

        return false;
    }
}

function update_tyabi() {

    const sprite = tyabi.sprite!;
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
    } else if (!tyabi.direction_x) {
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

function get_worm_level(months: number) {
    // if months are less than 12, then we step by 3 months (0-2 months: 9, 3-5: 8, etc.)
    // else we step by 6 months (12-17 months: 5, 18-23: 4, etc., up until 41 months; after 42 months, we return 0) 
    return Math.max(0, (months < 12 ? 9 : 7) - (months / 3 | 0));
}

interface WSEventData {
    "badge-info"?: string;
    badges?: { [key: string]: string };
    "badges-raw"?: string;
    color?: string;
    "display-name": string;
    "emote-only"?: boolean
    emotes?: { [key: string]: Array<string> };
    "emotes-raw"?: string;
    flags: any;
    id: string;
    "message-type"?: string;
    "mod"?: boolean;
    "room-id"?: string;
    subscriber?: boolean;
    "tmi-sent-ts"?: string;
    "turbo"?: boolean;
    "user-id"?: string;
    "user-type?": any;
    username: string;

    bot_command?: string;
}

const ws_client = new WebSocket('ws://home.molnarmark.hu:8888');
ws_client.onmessage = function (event) {

    const ws_data: WSEventData = JSON.parse(event.data);

    if (ws_data.bot_command !== undefined && ws_data.bot_command === "refresh") {
        window.location.reload();
    }
    else {
        const display_name = ws_data['display-name'];

        if (!worms_container.hasOwnProperty(display_name)) {
            const name_color = ws_data.color ?? '#666666';
            const sub_months = Number(ws_data.badges?.subscriber || 0);

            add_worm(sub_months, display_name, name_color);
        }
    }
}

function add_worm(months: number, name: string, color: string) {
    worms_container[name] = new Worm(get_worm_level(months), name, color);
}

let test_worm_index = 0;
function spawn_test_worms(count: number) {
    for (let i = 0; i < count; ++i) {
        const name = 'Worm' + (test_worm_index++);
        worms_container[name] = new Worm(get_worm_level(Math.random() * 36 | 0), name, '#666666');
    }
}