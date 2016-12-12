import Phaser from 'phaser';

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    if (window.ld37 === undefined) {
      window.ld37 = {};
    }
    if (window.ld37.wasdUnderstood === undefined) {
      window.ld37.wasdUnderstood = false;
    }

    this.playerSpeed = 80;  // pix/sec

    const room = this.game.add.sprite(0, 0, "room");
    room.fixedToCamera = true;

    // create player
    this.player = this.game.add.sprite(320-96, 320-48);
    const ball = this.player.ball = this.game.add.sprite(0, 0, "ballfolk");
    this.player.addChild(ball);
    this.player.animObj = ball;
    this.addBallfolkAnims(ball);
    ball.animations.play("standDown");
    // wasd indicator stuff
    const wasd = this.player.wasd = this.game.add.sprite(0, 0, "wasd");
    this.player.addChild(wasd);
    wasd.anchor.setTo(0.5, 0.5);
    wasd.animations.add("wobble", [0, 1], 2, true);
    wasd.animations.play("wobble");
    wasd.alpha = 0;
    wasd.scale.setTo(0.5);
    if (!window.ld37.wasdUnderstood) {
      this.game.add.tween(wasd).to(
        { alpha: 1 }, 2000, Phaser.Easing.Default, true
      );
    }
    // misc player stuff
    this.player.falling = false;
    this.player.distFallen = 0;
    this.player.fallRate = 0;
    this.player.lastFacing = "down";

    this.game.input.gamepad.start();
  }

  render() {}

  update() {
    this.movePlayer();
  }

  addBallfolkAnims(sprite) {
    sprite.animations.add("standDown", [1]);
    sprite.animations.add("walkDown", [2, 3, 4, 5], 4, true);
    sprite.animations.add("standLeft", [6]);
    sprite.animations.add("walkLeft", [7, 8, 9, 10], 4, true);
    sprite.animations.add("standUp", [11]);
    sprite.animations.add("walkUp", [12, 13, 14, 15], 4, true);
    sprite.animations.add("walkRight", [17, 18, 19, 20], 4, true);
    sprite.animations.add("standRight", [22]);
    sprite.animations.add("tantrum", [23, 24], 2, true);
  }

  movePlayer () {
    if (this.player.falling) { return; }
    if (this.player.tantrumming) { return; }
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

    let newX = 0;
    let newY = 0;
    if (targetX !== 0 || targetY !== 0) {
      if (!window.ld37.wasdUnderstood) {
        this.game.time.events.add(Phaser.Timer.SECOND * 2.5, () => {
          this.game.add.tween(this.player.wasd).to(
            { alpha: 0 }, 2000, Phaser.Easing.Default, true
          );
        });
        window.ld37.wasdUnderstood = true;
      }

      let moveAngle = Math.atan2(targetY, targetX);
      const dx = this.playerSpeed * Math.cos(moveAngle) / 60;
      const dy = this.playerSpeed * Math.sin(moveAngle) / 60;
      newX = this.player.x + dx;
      newY = this.player.y + dy;
      this.setWalkAnim(this.player.animObj, moveAngle, true);
    } else {  // not moving
      newX = this.player.x;
      newY = this.player.y;
      this.setWalkAnim(this.player.animObj, 0, false);
    }

    // collision
    if (newY > 350 - newX/2 &&
        newY > 134 + newX/2 &&
        newY < 194 + newX/2) {
      this.player.x = newX;
      this.player.y = newY;
    }
    if (newY > 465 - newX/2) {
      this.game.state.start("Game");
    }
  }

  setWalkAnim(sprite, angle, isMoving) {
    const tau = Math.PI * 2;
    while (angle < 0) { angle += tau; }
    while (angle >= tau) { angle -= tau; }
    if (isMoving) {
      if (angle > tau/8 && angle <= 3*tau/8) {
        sprite.animations.play("walkDown");
        sprite.lastFacing = "down";
      } else if (angle > 3*tau/8 && angle <= 5*tau/8) {
        sprite.animations.play("walkLeft");
        sprite.lastFacing = "left";
      } else if ((angle > 5*tau/8 && angle <= 7*tau/8)) {
        sprite.animations.play("walkUp");
        sprite.lastFacing = "up";
      } else {
        sprite.animations.play("walkRight");
        sprite.lastFacing = "right";
      }
    } else {
      switch (sprite.lastFacing) {
        case "right":
          sprite.animations.play("standRight");
          break;
        case "left":
          sprite.animations.play("standLeft");
          break;
        case "up":
          sprite.animations.play("standUp");
          break;
        default:
          sprite.animations.play("standDown");
          break;
      }
    }
  }

}
