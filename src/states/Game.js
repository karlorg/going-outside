/* globals __DEV__ */
import Phaser from 'phaser';

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    // this.palms = ["palm01", "palm02", "palm03",
    //               "palm04", "palm05", "palm06"];

    this.stage.backgroundColor = '#000000';

    this.playerSpeed = 80;  // pix/sec
    this.playerRadius = 10;  // for collision
    this.playerHeight = 36;  // for visuals
    this.playerMaxFallRate = 160;  // pix/sec
    this.playerFallAccel = 160; // pix/sec/sec

    this.shootRange = 160;
    this.shotFadeTime = 1;  // sec
    this.lastShotTime = 0;
    this.shootDelay = 0.5;  // sec
    this.lastShotSx = 0;
    this.lastShotSy = 0;
    this.lastShotDx = 0;
    this.lastShotDy = 0;

    this.darknessMaxDist = 240;
    this.darknessMinDist = 160;
    this.treeRadius = 6;
    this.trees = [];
    this.enemies = [];

    this.game.world.setBounds(-640, -640, 1920, 1920);

    this.map = [];
    for (let j = 0; j < 40; j++) {
      const row = [];
      for (let i = 0; i < 20; i++) {
        if (this.game.rnd.frac() < 0.1) {
          row.push(0);
        } else {
          row.push(1);
        }
      }
      this.map.push(row);
    }

    this.mapZGroup = this.game.add.group();
    for (let j = 0; j < this.map.length; j++) {
      const row = this.map[j];
      for (let i = 0; i < row.length; i++) {
        if (row[i] !== 0) {
          let x = i * 64 + 32;
          const y = j * 16 + 16;
          if (j % 2 === 1) { x += 32; }
          const tile = this.game.add.sprite(x, y, "tile");
          tile.anchor.setTo(0.5, 0.25);
          this.mapZGroup.add(tile);
        }
      }
    }
    this.zGroup = this.game.add.group();
    for (let row = 0; row < 32; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.map[row][col] === 0) { continue; }
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
      enemy.anchor.setTo(32 / enemy.width, 64 / enemy.height);
      this.zGroup.add(enemy);
      this.enemies.push(enemy);
    }

    // create player
    this.player = this.game.add.sprite(320, 320);
    const ring = this.player.ring = this.game.add.sprite(0, 0, "ring");
    this.player.addChild(ring);
    const ball = this.player.ball = this.game.add.sprite(0, 0, "ball");
    this.player.addChild(ball);
    this.zGroup.add(this.player);
    this.mapZGroup.add(this.player);
    this.player.falling = false;
    this.player.distFallen = 0;
    this.player.fallRate = 0;
    this.updatePlayerAnchors();

    this.shootGraphics = this.game.add.graphics(0, 0);

    this.darkBorder = this.game.add.sprite(0, 0, "dark-border");
    this.darkBorder.fixedToCamera = true;
    this.darkBorder.alpha = 0;

    this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);

    this.game.input.gamepad.start();
  }

  update () {
    this.movePlayer();
    this.processShoot();
    this.collidePlayerTrees();
    this.checkPlayerFall();
    this.processPlayerFall();
    this.updateDarkness();
    this.updateShootGraphics();

    this.zGroup.sort('y', Phaser.Group.SORT_ASCENDING);
  }

  render () {
    if (__DEV__) {
      // this.game.debug.geom(
      //   new Phaser.Point(this.debugX, this.debugY), "red");
    }
  }

  movePlayer () {
    if (this.player.falling) { return; }
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
  }

  processShoot () {
    if (this.game.time.totalElapsedSeconds() <
        this.lastShotTime + this.shootDelay) {
      return;
    }
    const pad = this.game.input.gamepad.pad1;
    const keyb = this.game.input.keyboard;
    let targetX = 0;
    let targetY = 0;
    if (pad.isDown(Phaser.Gamepad.XBOX360_X) ||
        keyb.isDown(Phaser.Keyboard.LEFT) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) < -0.1) {
      targetX -= 1;
    }
    if (pad.isDown(Phaser.Gamepad.XBOX360_B) ||
        keyb.isDown(Phaser.Keyboard.RIGHT) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) > 0.1) {
      targetX += 1;
    }
    if (pad.isDown(Phaser.Gamepad.XBOX360_Y) ||
        keyb.isDown(Phaser.Keyboard.UP) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) < -0.1) {
      targetY -= 1;
    }
    if (pad.isDown(Phaser.Gamepad.XBOX360_A) ||
        keyb.isDown(Phaser.Keyboard.DOWN) ||
        pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) > 0.1) {
      targetY += 1;
    }
    if (targetX !== 0 || targetY !== 0) {
      this.shootAtVector(targetX, targetY);
    }
  }

  shootAtVector (dirx, diry) {
    this.lastShotTime = this.game.time.totalElapsedSeconds();
    const player = this.player;
    const angle = Math.atan2(diry, dirx);
    const vecx = this.shootRange * Math.cos(angle);
    const vecy = this.shootRange * Math.sin(angle);
    const sx = player.x;
    const sy = player.y;
    const dx = sx + vecx;
    const dy = sy + vecy;

    // set properties used for graphical representation
    this.lastShotSx = sx;
    this.lastShotSy = sy;
    this.lastShotDx = dx;
    this.lastShotDy = dy;

    // see if anything was shot
    //
    // hack: intersections don't work with vertical and horizontal lines, so
    // offset one endpoint slightly for those cases
    const shotLine = new Phaser.Line(sx, sy,
                                     dx === sx ? dx+1 : dx,
                                     dy === sy ? dy+1 : dy);
    for (const enemy of this.enemies) {
      const rect = new Phaser.Rectangle(
        enemy.x - this.playerRadius, enemy.y - this.playerRadius,
        2 * this.playerRadius, 2 * this.playerRadius
      );
      if (Phaser.Line.intersectsRectangle(shotLine, rect)) {
        this.game.camera.flash(0xff0000, 100);
      }
    }
  }

  updateShootGraphics () {
    const now = this.game.time.totalElapsedSeconds();
    const g = this.shootGraphics;
    g.clear();
    const alpha = Math.max(
      1 - ((now - this.lastShotTime) / this.shotFadeTime),
      0);
    g.lineStyle(2, 0xffffff, alpha);
    // (sx, sy) and (dx, dy) are in ground coords, need to move them up a
    // bit to look right graphically
    g.moveTo(this.lastShotSx, this.lastShotSy - this.playerHeight / 2);
    g.lineTo(this.lastShotDx, this.lastShotDy - this.playerHeight / 2);
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

  checkPlayerFall () {
    const player = this.player;
    // find nearest point on 64x32 grid to player position
    const roundX = 64 * Math.round(player.x / 64);
    const roundY = 32 * Math.round(player.y / 32);
    // enumerate the centers of that tile and its neighbours
    const candidates = [
      { x: roundX, y: roundY },
      { x: roundX + 32, y: roundY - 16 },
      { x: roundX + 32, y: roundY + 16 },
      { x: roundX - 32, y: roundY - 16 },
      { x: roundX - 32, y: roundY - 16 }
    ];
    let nearestX = 0;
    let nearestY = 0;
    let nearestDistSq = 1000 * 1000;
    for (const {x, y} of candidates) {
      const dx = player.x - x;
      const dy = player.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearestX = x;
        nearestY = y;
        nearestDistSq = distSq;
      }
    }

    const tileY = Math.round((nearestY - 16) / 16);
    const tileX = Math.floor((nearestX - 16) / 64);
    if (tileY < 0 || tileY >= this.map.length ||
        tileX < 0 || tileX >= this.map[tileY] ||
        this.map[tileY][tileX] === 0) {
      this.player.falling = true;
      this.mapZGroup.sort('y', Phaser.Group.SORT_ASCENDING);
    }
  }

  processPlayerFall() {
    if (!this.player.falling) { return; }
    this.player.fallRate += 0.06;  // hack fix, accel didn't work
    if (this.player.fallRate > this.playerMaxFallRate) {
      this.player.fallRate = this.playerMaxFallRate;
    }
    this.player.distFallen += this.player.fallRate / 60;
    this.updatePlayerAnchors();
  }

  updatePlayerAnchors() {
    // set the anchors of the player's sub-sprites including offset to
    // represent falling off the world
    const {ball, ring} = this.player;
    const fallen = this.player.distFallen;
    ring.anchor.setTo(32 / ring.width, 64 / ring.height - fallen);
    ball.anchor.setTo(32 / ball.width, 64 / ball.height - fallen);
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
