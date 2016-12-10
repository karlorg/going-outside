/* globals __DEV__ */
import Phaser from 'phaser';

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    // this.palms = ["palm01", "palm02", "palm03", "palm04", "palm05", "palm06"];
    // this.treesByY = {};
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
        if (this.game.rnd.frac() < 0.15) {
          const tree = this.game.add.sprite(x + 32, y + 16,
                                            "palm01");
          tree.anchor.setTo(130 / tree.width, 104 / tree.height);
          this.zGroup.add(tree);
        }
      }
    }
    this.player = this.game.add.sprite(32, 16, "ball");
    this.player.anchor.setTo(0.5, 1.00);
    this.zGroup.add(this.player);

    this.game.input.gamepad.start();
  }

  update () {
    const pad = this.game.input.gamepad.pad1;
    let targetX = 0;
    let targetY = 0;
    if (pad.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1) {
      targetX -= 1;
    }
    if (pad.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1) {
      targetX += 1;
    }
    if (pad.isDown(Phaser.Gamepad.XBOX360_DPAD_UP) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.1) {
      targetY -= 1;
    }
    if (pad.isDown(Phaser.Gamepad.XBOX360_DPAD_DOWN) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.1) {
      targetY += 1;
    }
    this.player.x += targetX;
    this.player.y += targetY;

    this.zGroup.sort('y', Phaser.Group.SORT_ASCENDING);
  }

  render () {
    if (__DEV__) {
    //   this.game.debug.spriteInfo(this.mushroom, 32, 32);
    }
  }

  // registerTree (tree) {
  //   const y = tree.y;
  //   if (!this.treesByY.hasOwnProperty(y)) {
  //     this.treesByY[y] = [];
  //   }
  //   this.treesByY[y].push(tree);
  // }

  // reorderSprites () {
  //   this.player.kill();
  //   let stillDead = true;
  //   for (const y in this.treesByY) {
  //     if (this.treesByY.hasOwnProperty(y)) {
  //       const trees = this.treesByY[y];
  //       for (const tree of trees) {
  //         tree.kill();
  //         tree.revive();
  //       }
  //       if (this.player.y < y && stillDead) {
  //         this.player.revive();
  //         stillDead = false;
  //       }
  //     }
  //   }
  //   if (stillDead) {
  //     this.player.revive();
  //   }
  // }
}
