import 'pixi'
import 'p2'
import Phaser from 'phaser'

import BootState from './states/Boot'
import SplashState from './states/Splash'
import RoomState from './states/Room';
import GameState from './states/Game'

class Game extends Phaser.Game {

  constructor () {
    let width = 640;
    let height = 640;

    super(width, height, Phaser.AUTO, 'content', null)

    this.state.add('Boot', BootState, false)
    this.state.add('Splash', SplashState, false)
    this.state.add('Room', RoomState, false);
    this.state.add('Game', GameState, false)

    this.state.start('Boot')
  }
}

window.game = new Game()
