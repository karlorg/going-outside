/* globals __DEV__ */
import Phaser from 'phaser';

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    // this.palms = ["palm01", "palm02", "palm03", "palm04", "palm05", "palm06"];

    this.stage.backgroundColor = '#000000';

    this.playerSpeed = 80;  // pix/sec
    this.playerRadius = 10;
    this.darknessMaxDist = 240;
    this.darknessMinDist = 160;
    this.treeRadius = 6;
    this.trees = [];
    this.enemies = [];

    for (let row = 0; row < 32; row++) {
      for (let col = 0; col < 9; col++) {
        let x = col * 64;
        const y = row * 16;
        if (row % 2 === 1) { x += 32; }
        this.game.add.sprite(x, y, "tile");
      }
    }
    this.zGroup = this.game.add.group();
    for (let row = 0; row < 32; row++) {
      for (let col = 0; col < 9; col++) {
        let x = col * 64;
        const y = row * 16;
        if (row % 2 === 1) { x += 32; }
        // maybe spawn a tree
        if (this.game.rnd.frac() < 0.1) {
          const tree = this.game.add.sprite(x + 32, y + 16,
                                            "palm01");
          tree.anchor.setTo(130 / tree.width, 104 / tree.height);
          this.zGroup.add(tree);
          this.trees.push(tree);
        }
      }
    }

    // spawn enemies
    {
      const enemy = this.game.add.sprite(160, 160, "ball");
      this.enemies.push(enemy);
    }

    // create player
    this.player = this.game.add.sprite(320, 320);
    const ring = this.game.add.sprite(0, 0, "ring");
    this.player.addChild(ring);
    ring.anchor.setTo(32 / ring.width, 64 / ring.height);
    const ball = this.game.add.sprite(0, 0, "ball");
    this.player.addChild(ball);
    ball.anchor.setTo(32 / ball.width, 64 / ball.height);
    this.zGroup.add(this.player);

    this.darkBorder = this.game.add.sprite(0, 0, "dark-border");
    this.darkBorder.fixedToCamera = true;
    this.darkBorder.alpha = 0;

    this.game.input.gamepad.start();
  }

  update () {
    const pad = this.game.input.gamepad.pad1;
    const keyb = this.game.input.keyboard;
    let targetX = 0;
    let targetY = 0;
    if (pad.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) ||
        keyb.isDown(Phaser.Keyboard.A) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1) {
      targetX -= 1;
    }
    if (pad.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) ||
        keyb.isDown(Phaser.Keyboard.D) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1) {
      targetX += 1;
    }
    if (pad.isDown(Phaser.Gamepad.XBOX360_DPAD_UP) ||
        keyb.isDown(Phaser.Keyboard.W) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.1) {
      targetY -= 1;
    }
    if (pad.isDown(Phaser.Gamepad.XBOX360_DPAD_DOWN) ||
        keyb.isDown(Phaser.Keyboard.S) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.1) {
      targetY += 1;
    }
    this.player.x += targetX * this.playerSpeed / 60;
    this.player.y += targetY * this.playerSpeed / 60;

    this.collidePlayerTrees();
    this.updateDarkness();

    this.zGroup.sort('y', Phaser.Group.SORT_ASCENDING);
  }

  render () {
    if (__DEV__) {
    //   this.game.debug.spriteInfo(this.mushroom, 32, 32);
    }
  }

  collidePlayerTrees () {
    const player = this.player;
    const minDist = this.playerRadius + this.treeRadius;
    const minDistSquared = minDist * minDist;
    for (const tree of this.trees) {
      const dx = tree.x - player.x;
      const dy = tree.y - player.y;
      const distSquared = dx*dx + dy*dy;
      if (distSquared < minDistSquared) {
        const angle = Math.atan2(dy, dx);
        player.x = tree.x - minDist * Math.cos(angle);
        player.y = tree.y - minDist * Math.sin(angle);
      }
    }
  }

  updateDarkness () {
    const player = this.player;
    let distSquared = 1000 * 1000;
    for (const enemy of this.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const enemyDistSquared = dx * dx + dy * dy;
      if (enemyDistSquared < distSquared) {
        distSquared = enemyDistSquared;
      }
    }
    let alpha = 0;
    const dist = Math.sqrt(distSquared);
    if (dist < this.darknessMaxDist) {
      if (dist <= this.darknessMinDist) {
        alpha = 1;
      } else {
        alpha = 1 - ((dist - this.darknessMinDist) /
                     (this.darknessMaxDist - this.darknessMinDist));
      }
    }
    this.darkBorder.alpha = alpha;
  }
}
