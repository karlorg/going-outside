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

    this.enemyWalkSpeed = 40;  // pix/sec

    this.shootRange = 160;
    this.shotFadeTime = 1;  // sec
    this.lastShotTime = 0;
    this.shootDelay = 0.5;  // sec
    this.lastShotSx = 0;
    this.lastShotSy = 0;
    this.lastShotDx = 0;
    this.lastShotDy = 0;

    this.aloneCutoff = 160;
    this.darknessMaxDist = 240;
    this.darknessMinDist = 40;

    this.tileMaxCrackLevel = 3;
    this.treeRadius = 6;
    this.trees = [];
    this.enemies = [];

    this.game.world.setBounds(-640, -640, 2560, 2560);

    this.map = [];
    this.mapZGroup = this.game.add.group();
    for (let j = 0; j < 40; j++) {
      const row = [];
      for (let i = 0; i < 20; i++) {
        let x = i * 64 + 32;
        const y = j * 16 + 16;
        if (j % 2 === 1) { x += 32; }
        const tile = this.game.add.sprite(x, y, "tile");
        tile.anchor.setTo(0.5, 0.25);
        // tile.addChild(this.game.add.sprite(0, 0, "tile"));
        tile.crackLevel = 0;
        this.mapZGroup.add(tile);
        row.push(tile);
      }
      this.map.push(row);
    }

    this.zGroup = this.game.add.group();
    for (let row = 0; row < 32; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.map[row][col] === null) { continue; }
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

    // create player
    this.player = this.game.add.sprite(320, 320);
    const ring = this.player.ring = this.game.add.sprite(0, 0, "ring");
    this.player.addChild(ring);
    const ball = this.player.ball = this.game.add.sprite(0, 0, "ball");
    this.player.addChild(ball);
    this.player.falling = false;
    this.player.distFallen = 0;
    this.player.fallRate = 0;
    this.zGroup.add(this.player);
    this.updatePlayerAnchors();

    this.shootGraphics = this.game.add.graphics(0, 0);

    this.darkBorder = this.game.add.sprite(0, 0, "dark-border");
    this.darkBorder.fixedToCamera = true;
    this.darkBorder.alpha = 0;

    this.score = 0;

    this.scoreLabel = this.game.add.text(
      320, 16, "Alone time: ", {fill: "white", size: "64px", align: "right"}
    );
    this.scoreLabel.anchor.set(1, 0);
    this.scoreLabel.setShadow(2, 2, 'rgba(0,0,0,0.5)', 5);
    this.scoreLabel.fixedToCamera = true;

    this.scoreText = this.game.add.text(
      320, 16, "0", {fill: "white", size: "64px"}
    );
    this.scoreText.setShadow(2, 2, 'rgba(0,0,0,0.5)', 5);
    this.scoreText.fixedToCamera = true;

    this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);

    this.game.input.gamepad.start();
  }

  update () {
    this.movePlayer();
    this.processShoot();
    this.collidePlayerTrees();
    this.checkPlayerFall();
    this.processPlayerFall();
    this.spawnEnemies();
    this.processEnemies();
    this.updateScore();
    this.updateDarkness();
    this.crackTiles();
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
    const deadEnemyIndices = [];
    for (let i=0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      const rect = new Phaser.Rectangle(
        enemy.x - this.playerRadius, enemy.y - this.playerRadius,
        2 * this.playerRadius, 2 * this.playerRadius
      );
      if (Phaser.Line.intersectsRectangle(shotLine, rect)) {
        this.game.camera.flash(0xff0000, 100);
        enemy.health -= 50;
        if (enemy.health <= 0) {
          enemy.destroy();
          deadEnemyIndices.push(i);
        }
      }
    }
    for (let i=deadEnemyIndices.length - 1; i >= 0; i--) {
      const deadEnemyIndex = deadEnemyIndices[i];
      this.enemies.splice(deadEnemyIndex, 1);
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

  spawnEnemies() {
    const rnd = this.game.rnd;
    const spawnRate = 0.5;  // enemies/second
    if (rnd.frac() < spawnRate / 60) {
      const mainAxis = rnd.between(0, 1);
      let tileX = 0;
      let tileY = 0;
      if (mainAxis === 0) {
        tileX = rnd.between(0, this.map[0].length - 1);
        tileY = rnd.pick([0, this.map.length - 1]);
      } else {
        tileY = rnd.between(0, this.map.length - 1);
        tileX = rnd.pick([0, this.map[0].length - 1]);
      }
      this.makeAndAddEnemy(
        tileX * 64 + 32 + (tileY % 2 === 1 ? 32 : 0),
        tileY * 16 + 16);
    }
  }

  makeAndAddEnemy(x, y) {
    const enemy = this.game.add.sprite(x, y, "ball");
    enemy.anchor.setTo(32 / enemy.width, 64 / enemy.height);
    enemy.health = 100;
    this.pickDestination(enemy);
    this.zGroup.add(enemy);
    this.enemies.push(enemy);
  }

  pickDestination(enemy) {
    const options = [];
    for (let j = 7; j < this.map.length - 2; j += 15) {
      for (let i = 3; i < this.map[0].length - 2; i += 6) {
        options.push([i, j]);
      }
    }
    const [x, y] = this.game.rnd.pick(options);
    enemy.destination = {x: x * 64, y: y * 16};
    this.pickOffsetDestination(enemy);
  }

  pickOffsetDestination(enemy) {
    enemy.offsetDestination = {
      x: enemy.destination.x + this.game.rnd.between(-128, 128),
      y: enemy.destination.y + this.game.rnd.between(-64, 64)
    };
  }

  processEnemies() {
    for (const enemy of this.enemies) {
      const dest = enemy.offsetDestination;
      const dirx = dest.x - enemy.x;
      const diry = dest.y - enemy.y;
      if (dirx * dirx + diry * diry > 20 * 20) {
        const angle = Math.atan2(diry, dirx);
        enemy.x += this.enemyWalkSpeed * Math.cos(angle) / 60;
        enemy.y += this.enemyWalkSpeed * Math.sin(angle) / 60;
      } else {
        if (!enemy.arrived) {
          enemy.arrived = true;
          enemy.dawdleNextTime =
            this.game.time.totalElapsedSeconds() + this.game.rnd.between(0, 6);
        } else if (this.game.time.totalElapsedSeconds() >
                   enemy.dawdleNextTime) {
          this.pickOffsetDestination(enemy);
          enemy.arrived = false;
        }
      }
    }
  }

  checkPlayerFall () {
    const player = this.player;
    const {x: tileX, y: tileY} = this.nearestTileTo(player.x, player.y);
    if (tileY < 0 || tileY >= this.map.length ||
        tileX < 0 || tileX >= this.map[tileY].length ||
        this.map[tileY][tileX] === null) {
      this.player.falling = true;
      this.mapZGroup.add(this.player);
      this.mapZGroup.sort('y', Phaser.Group.SORT_ASCENDING);
    }
  }

  nearestTileTo(x, y) {
    // find nearest point on 64x32 grid to player position
    const roundX = 64 * Math.round(x / 64);
    const roundY = 32 * Math.round(y / 32);
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
    for (const {x: cx, y: cy} of candidates) {
      const dx = x - cx;
      const dy = y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearestX = x;
        nearestY = y;
        nearestDistSq = distSq;
      }
    }

    const tileY = Math.round((nearestY - 16) / 16);
    const tileX = Math.floor((nearestX - 16) / 64);
    return {x: tileX, y: tileY};
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

  updateScore() {
    if (this.player.falling) { return; }
    const dist = this.distToNearestEnemy();
    if (dist > this.aloneCutoff) {
      this.score += 1/60;
    }
    this.scoreText.text = `${Math.floor(this.score)}`;
  }

  updateDarkness () {
    const dist = this.distToNearestEnemy();
    let targetAlpha = 0.1;
    if (dist < this.darknessMaxDist) {
      if (dist <= this.darknessMinDist) {
        targetAlpha = 1;
      } else {
        targetAlpha = 1 - (((dist - this.darknessMinDist) /
                            (this.darknessMaxDist - this.darknessMinDist)) *
                           0.9);
      }
    }
    const diff = targetAlpha - this.darkBorder.alpha;
    if (Math.abs(diff) > 1/60) {
      this.darkBorder.alpha += (diff/Math.abs(diff)) * 1/60;
    } else {
      this.darkBorder.alpha = targetAlpha;
    }
  }

  distToNearestEnemy() {
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
    const dist = Math.sqrt(distSquared);
    return dist;
  }

  neighboursOf({x, y}) {
    return [
      {x, y},
      {x: x+1, y}, {x: x-1, y},
      {x, y: y-2}, {x, y: y+2}
    ].filter(({x, y}) => {
      return (
        (y >= 0) && (y < this.map.length) &&
        (x >= 0) && (x < this.map[0].length)
      );
    });
  }

  crackTiles() {
    const {x: nx, y: ny} =
      this.nearestTileTo(this.player.x, this.player.y);
    const candidates = this.neighboursOf({x: nx, y: ny});
    for (const {x, y} of candidates) {
      const tile = this.map[y][x];
      if (tile === null) { continue; }
      if (this.game.rnd.frac() < 0.1 / 60) {
        if (tile.crackLevel < this.tileMaxCrackLevel) {
          tile.crackLevel += 1;
          // (tile.y+1) is a hack to make z-sorting mostly work
          const crack = this.game.add.sprite(
            tile.x, tile.y + 1, `crack${tile.crackLevel}`
          );
          crack.anchor.setTo(0.5, ((crack.height / 4) + 1) / crack.height);
          this.mapZGroup.add(crack);
        }
      }
    }
  }
}
