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
    this.load.image('tile', 'assets/images/tile.png');
    this.load.image('ball', 'assets/images/ball.png');
    this.load.image('ring', 'assets/images/ring.png');
    this.load.image('dark-border', 'assets/images/dark-border.png');
    this.load.image('palm01', 'assets/images/isometric trees/palm01.png');
    this.load.image('palm02', 'assets/images/isometric trees/palm02.png');
    this.load.image('palm03', 'assets/images/isometric trees/palm03.png');
    this.load.image('palm04', 'assets/images/isometric trees/palm04.png');
    this.load.image('palm05', 'assets/images/isometric trees/palm05.png');
    this.load.image('palm06', 'assets/images/isometric trees/palm06.png');
  }

  create () {
    this.state.start('Game');
  }

}
