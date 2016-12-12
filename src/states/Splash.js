import Phaser from 'phaser';
import { centerGameObjects } from '../utils';

export default class extends Phaser.State {
  init () {}

  preload () {
    this.loaderBg = this.add.sprite(
      this.game.world.centerX, this.game.world.centerY, 'loaderBg');
    this.loaderBar = this.add.sprite(
      this.game.world.centerX, this.game.world.centerY, 'loaderBar');
    centerGameObjects([this.loaderBg, this.loaderBar]);

    this.load.setPreloadSprite(this.loaderBar);
    //
    // load your assets
    //
    this.load.image('room', 'assets/images/room.png');
    this.load.image('roommid', 'assets/images/room midground.png');
    this.load.image('roomfg', 'assets/images/room foreground.png');
    this.load.image('door', 'assets/images/door.png');
    this.load.spritesheet('wasd', 'assets/images/wasd.png', 128, 128);
    this.load.spritesheet(
      'shiftspace', 'assets/images/shiftspace.png', 128, 128);
    this.load.spritesheet(
      'audio toggle', 'assets/images/audio toggle.png', 128, 128);
    this.load.spritesheet(
      'animtile', 'assets/images/animtile.png', 64, 64);
    this.load.image('tile', 'assets/images/tile.png');
    this.load.image('crack1', 'assets/images/crack1.png');
    this.load.image('crack2', 'assets/images/crack2.png');
    this.load.image('crack3', 'assets/images/crack3.png');
    this.load.spritesheet(
      'ballfolk', 'assets/images/ballfolk.png',
      64, 96
    );
    this.load.spritesheet(
      'badnote1', 'assets/images/badnote1.png',
      32, 32
    );
    this.load.image('ring', 'assets/images/ring.png');
    this.load.image('stress pulse', 'assets/images/stress pulse.png');
    this.load.image('dark-border', 'assets/images/dark-border.png');
    this.load.image('tree', 'assets/images/tree.png');

    this.load.audio('calm music', 'assets/sound/calm track/Full mix.mp3');
    this.load.audio('chatter', 'assets/sound/warning audio/cutsy chatter.mp3');
    this.load.audio('annoying hum',
                    'assets/sound/get away audio/annoying hum/annoying hum.mp3');
    this.load.audio('footsteps', 'assets/sound/footsteps/footsteps 1.mp3');
    this.load.audio('scream', 'assets/sound/get away organic 2.mp3');
    this.load.audio('falling cry', 'assets/sound/falling cry.mp3');
    this.load.audio('crumble sound', 'assets/sound/floor crumble.mp3');
    this.load.audio('crack sound', 'assets/sound/floor crumble subtle.mp3');
    this.load.audio('panic sound', 'assets/sound/other characters running away.mp3');
  }

  create () {
    this.state.start('Room');
  }

}
