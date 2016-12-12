/* globals __DEV__ */
import Phaser from 'phaser';

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    // this.palms = ["palm01", "palm02", "palm03",
    //               "palm04", "palm05", "palm06"];

    this.soundsToDestroy = [];

    this.calmMusic = this.game.add.audio('calm music');
    this.calmVolume = 0.1;
    this.calmMusic.onDecoded.add(() => {
      this.calmMusic.play('', 0, 0, true);
      this.calmMusic.fadeTo(1000, this.calmVolume);
    });
    this.soundsToDestroy.push(this.calmMusic);

    this.annoyingHum = this.game.add.audio('annoying hum');
    this.annoyingHum.onDecoded.add(() => {
      this.annoyingHum.play('', 0, 0, true);
    });
    this.annoyingHum.maxVol = 0.1;
    this.annoyingHum.maxDist = 200;
    this.annoyingHum.minDist = 40;
    this.soundsToDestroy.push(this.annoyingHum);

    this.chatter = this.game.add.audio('chatter');
    this.chatter.onDecoded.add(() => {
      this.chatter.play('', 0, 0, true);
    });
    this.chatter.maxVol = 0.1;
    this.chatter.maxDist = 300;
    this.chatter.minDist = 80;
    this.soundsToDestroy.push(this.chatter);

    this.footstepsSound = this.game.add.audio('footsteps');
    this.soundsToDestroy.push(this.footstepsSound);
    this.screamSound = this.game.add.audio('scream');
    this.soundsToDestroy.push(this.screamSound);
    this.fallSound = this.game.add.audio('falling cry');
    this.soundsToDestroy.push(this.fallSound);
    this.crumbleSound = this.game.add.audio('crumble sound');
    this.soundsToDestroy.push(this.crumbleSound);
    this.crackSound = this.game.add.audio('crack sound');
    this.soundsToDestroy.push(this.crackSound);
    this.panicSound = this.game.add.audio('panic sound');
    this.soundsToDestroy.push(this.panicSound);

    this.stage.backgroundColor = '#000000';

    this.playerSpeed = 80;  // pix/sec
    this.playerRadius = 10;  // for collision
    this.playerHeight = 36;  // for visuals
    this.playerMaxFallRate = 160;  // pix/sec
    this.playerFallAccel = 160; // pix/sec/sec
    this.tantrumDuration = 1;  // sec
    this.tantrumScareDistance = 180;
    this.lastPulseTime = 0;
    this.stressPulseMaxDelay = 3;  // sec
    this.stressPulseMinDelay = 0.5;

    this.enemyWalkSpeed = 40;  // pix/sec
    this.enemyRunSpeed = 80;

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
    this.crackMaxDist = 200;
    this.crackMinDist = 40;

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
        tile.lastCracked = this.game.time.totalElapsedSeconds();
        tile.crackLevel = 0;
        tile.crackSprites = [];
        this.mapZGroup.add(tile);
        row.push(tile);
      }
      this.map.push(row);
    }

    this.zGroup = this.game.add.group();
    for (let row = 0; row < this.map.length; row++) {
      for (let col = 0; col < this.map[row].length; col++) {
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
    const ball = this.player.ball = this.game.add.sprite(0, 0, "ballfolk");
    this.player.addChild(ball);
    this.player.animObj = ball;
    this.addBallfolkAnims(ball);
    ball.animations.play("standDown");
    this.player.falling = false;
    this.player.distFallen = 0;
    this.player.fallRate = 0;
    this.player.lastFacing = "down";
    this.zGroup.add(this.player);
    this.updatePlayerAnchors();

    // spawn a few enemies to start
    this.spawnEnemies(true);
    this.spawnEnemies(true);
    this.spawnEnemies(true);
    this.spawnEnemies(true);

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

  shutDown() {
    for (const sound of soundsToDestroy) {
      sound.destroy();
    }
  }

  update () {
    if (!this.player.falling) {
      this.movePlayer();
      this.processTantrum();
      this.collidePlayerTrees();
      this.checkPlayerFall();
    }
    this.processPlayerFall();
    this.spawnEnemies();
    this.processEnemies();
    if (!this.player.falling) {
      this.updateScore();
      this.updateDarkness();
      this.updateAmbience();
      this.processPulses();
    }

    this.zGroup.sort('y', Phaser.Group.SORT_ASCENDING);
  }

  render () {
    if (__DEV__) {
      // this.game.debug.geom(
      //   new Phaser.Point(this.debugX, this.debugY), "red");
    }
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

    if (targetX !== 0 || targetY !== 0) {
      let moveAngle = Math.atan2(targetY, targetX);
      const dx = this.playerSpeed * Math.cos(moveAngle) / 60;
      const dy = this.playerSpeed * Math.sin(moveAngle) / 60;
      this.player.x += dx;
      this.player.y += dy;
      this.setWalkAnim(this.player.animObj, moveAngle, true);
      if (!this.footstepsSound.isPlaying) {
        this.footstepsSound.play('', 0, 0.1, true);
      }
    } else {  // not moving
      this.setWalkAnim(this.player.animObj, 0, false);
      this.footstepsSound.stop();
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

  processTantrum () {
    if (this.player.tantrumming) {
      if (this.game.time.totalElapsedSeconds() >
          this.player.tantrumTime + this.tantrumDuration) {
        this.player.tantrumming = false;
        this.setWalkAnim(this.player.animObj, 0, false);
      } else {
        return;
      }
    }
    const pad = this.game.input.gamepad.pad1;
    const keyb = this.game.input.keyboard;
    if (pad.isDown(Phaser.Gamepad.XBOX360_A) ||
        keyb.isDown(Phaser.Keyboard.SHIFT)) {
      this.startTantrum();
    }
  }

  startTantrum() {
    this.player.tantrumming = true;
    this.player.tantrumTime = this.game.time.totalElapsedSeconds();
    this.player.animObj.animations.play("tantrum");
    this.screamSound.play(null, null, 0.5);
    this.processPulses(true);

    let wereAnyScared = false;
    for (const enemy of this.enemies) {
      if (this.distBetween(enemy, this.player) < this.tantrumScareDistance) {
        this.scareEnemy(enemy);
        wereAnyScared = true;
      }
    }
    if (wereAnyScared) {
      this.panicSound.play(null, null, this.chatter.maxVol * 1.1);
    }
  }

  scareEnemy(enemy) {
    enemy.scared = true;
    this.game.time.events.add(Phaser.Timer.SECOND * 2, this.killEnemy,
                              this, enemy);
    const tween = this.game.add.tween(enemy);
    tween.to({ alpha: 0 }, 2000, Phaser.Easing.Default, true);
  }

  killEnemy(enemy) {
    this.enemies.splice(this.enemies.indexOf(enemy), 1);
    enemy.destroy();
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

  spawnEnemies(force=false) {
    const rnd = this.game.rnd;
    const spawnRate = 0.5;  // enemies/second
    if (rnd.frac() < spawnRate / 60 || force) {
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
    const enemy = this.game.add.sprite(x, y, "ballfolk");
    this.addBallfolkAnims(enemy);
    enemy.animations.play("standDown");
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
      if (enemy.scared) {
        const dirx = enemy.x - this.player.x;
        let diry = enemy.y - this.player.y;
        if (dirx === 0 && diry === 0) {
          diry = 1;
        }
        const angle = Math.atan2(diry, dirx);
        enemy.x += this.enemyRunSpeed * Math.cos(angle) / 60;
        enemy.y += this.enemyRunSpeed * Math.sin(angle) / 60;
        this.setWalkAnim(enemy, angle, true);
      } else {
        const dest = enemy.offsetDestination;
        const dirx = dest.x - enemy.x;
        const diry = dest.y - enemy.y;
        if (dirx * dirx + diry * diry > 20 * 20) {
          const angle = Math.atan2(diry, dirx);
          enemy.x += this.enemyWalkSpeed * Math.cos(angle) / 60;
          enemy.y += this.enemyWalkSpeed * Math.sin(angle) / 60;
          this.setWalkAnim(enemy, angle, true);
        } else {
          this.setWalkAnim(enemy, 0, false);
          if (!enemy.arrived) {
            enemy.arrived = true;
            enemy.dawdleNextTime =
              this.game.time.totalElapsedSeconds() +
              this.game.rnd.between(0, 6);
          } else if (this.game.time.totalElapsedSeconds() >
                     enemy.dawdleNextTime) {
            this.pickOffsetDestination(enemy);
            enemy.arrived = false;
          }
        }
      }
    }
  }

  checkPlayerFall () {
    if (this.player.falling) { return; }
    const player = this.player;
    const {x: tileX, y: tileY} = this.nearestTileTo(player.x, player.y);
    if (tileY < 0 || tileY >= this.map.length ||
        tileX < 0 || tileX >= this.map[tileY].length ||
        this.map[tileY][tileX] === null) {
      this.player.falling = true;
      this.fallSound.play(null, null, 0.5);
      this.calmMusic.fadeTo(2000, 0);
      this.annoyingHum.fadeTo(2000, 0);
      this.chatter.fadeTo(2000, 0);
      this.footstepsSound.stop();
      this.game.time.events.add(Phaser.Timer.SECOND * 5, () => {
        this.game.state.start("Room");
      });
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

  getScaleBetween(x, min, max) {
    if (x < min) {
      return 0;
    } else if (x > max) {
      return 1;
    } else {
      return ((x-min)/(max-min));
    }
  }

  updateDarkness () {
    const dist = this.distToNearestEnemy();
    const scale =
      this.getScaleBetween(dist, this.darknessMinDist, this.darknessMaxDist);
    const targetAlpha = 1 - (scale * 0.9);
    const diff = targetAlpha - this.darkBorder.alpha;
    let actualAlpha = this.darkBorder.alpha;
    if (Math.abs(diff) > 1/60) {
      actualAlpha += (diff/Math.abs(diff)) * 1/60;
    } else {
      actualAlpha = targetAlpha;
    }
    this.darkBorder.alpha = actualAlpha;
    // this.annoyingHum.volume = (actualAlpha - 0.1) * this.annoyingHumVolume;
    // this.chatter.volume = Math.max(0, actualAlpha - 0.4) *
    //                       this.chatterVolume;
    this.calmMusic.volume = (1 - (actualAlpha - 0.1)) * this.calmVolume;
  }

  updateAmbience() {
    const dist = this.distToNearestEnemy();

    for (const sound of [this.chatter, this.annoyingHum]) {
      const scale =
        this.getScaleBetween(dist, sound.minDist, sound.maxDist);
      const targetVol = sound.maxVol * (1 - scale);
      const diff = targetVol - sound.volume;
      let actualVol = sound.volume;
      if (Math.abs(diff) > 1/60) {
        actualVol += (diff/Math.abs(diff)) * 1/60;
      } else {
        actualVol = targetVol;
      }
      sound.volume = actualVol;
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

  distBetween(s1, s2) {
    const dx = s1.x - s2.x;
    const dy = s1.y - s2.y;
    const distSq = dx * dx + dy * dy;
    return Math.sqrt(distSq);
  }

  neighboursOf({x, y}) {
    return [
      {x, y},
      {x: x+1, y}, {x: x-1, y},
      {x, y: y-2}, {x, y: y+2},
      {x: (y % 2 === 0 ? x : x-1), y: y-1},
      {x: (y % 2 === 0 ? x : x-1), y: y+1},
      {x: (y % 2 === 0 ? x+1 : x), y: y-1},
      {x: (y % 2 === 0 ? x+1 : x), y: y+1},
    ].filter(({x, y}) => {
      return (
        (y >= 0) && (y < this.map.length) &&
        (x >= 0) && (x < this.map[0].length)
      );
    });
  }

  processPulses(force=false) {
    const now = this.game.time.totalElapsedSeconds();
    const dist = this.distToNearestEnemy();
    if (dist > this.darknessMaxDist && !force) { return; }
    const intensity = this.getScaleBetween(
      dist, this.darknessMinDist, this.darknessMaxDist
    );
    const pulseDelay =
      intensity *
      (this.stressPulseMaxDelay - this.stressPulseMinDelay) +
      this.stressPulseMinDelay;
    if (now < this.lastPulseTime + pulseDelay &&!force) { return; }

    this.lastPulseTime = now;
    const pulse = this.game.add.sprite(
      this.player.x, this.player.y, "stress pulse"
    );
    this.mapZGroup.add(pulse);
    pulse.alpha = 1 - intensity * 0.7;
    pulse.anchor.setTo(0.5, 0.5);
    pulse.scale.setTo(0.2);
    this.game.add.tween(pulse).to(
      { alpha: 0 }, 1000, Phaser.Easing.Default, true
    );
    this.game.add.tween(pulse.scale).to(
      { x: 1.2, y: 1.2 }, 1000, Phaser.Easing.Default, true
    );
    this.game.time.events.add(Phaser.Timer.SECOND * 1, () => {
      pulse.destroy();
    });

    this.crackTiles(force);
  }

  crackTiles(force=false) {
    let crackOccurred = false;

    const {x: nx, y: ny} =
      this.nearestTileTo(this.player.x, this.player.y);
    const candidates = this.neighboursOf({x: nx, y: ny});
    for (const {x, y} of candidates) {
      const tile = this.map[y][x];
      if (tile === null) { continue; }
      if (
        this.game.time.totalElapsedSeconds() < tile.lastCracked + 1
      ) { continue; }
      const dist = this.distToNearestEnemy();
      const crackChance = (
        force                              ? 0.2 :
        dist > this.darknessMaxDist * 0.8  ? 0 :
        dist > this.darknessMaxDist * 0.6  ? 0.2 :
        dist > this.darknessMaxDist * 0.4  ? 0.5 :
                                             1.3
      );
      if (this.game.rnd.frac() < crackChance) {
        this.crackTile(tile);
        crackOccurred = true;
      }
    }

    if (crackOccurred) {
      this.crackSound.play(null, null, 0.5);
      // this.shakeSprite(this.player.animObj);
    }
  }

  crackTile(tile) {
    if (tile.crackLevel < this.tileMaxCrackLevel) {
      tile.crackLevel += 1;
      tile.lastCracked = this.game.time.totalElapsedSeconds();
      // (tile.y+1) is a hack to make z-sorting mostly work
      const crack = this.game.add.sprite(
        tile.x, tile.y + 1, `crack${tile.crackLevel}`
      );
      crack.anchor.setTo(0.5, ((crack.height / 4) + 1) / crack.height);
      tile.crackSprites.push(crack);
      this.mapZGroup.add(crack);
    } else {
      tile.destroy();
      for (const crack of tile.crackSprites) {
        crack.destroy();
        this.crumbleSound.play();
      }
      const {x: tx, y: ty} = this.nearestTileTo(tile.x, tile.y);
      this.map[ty][tx] = null;
    }
  }

  shakeSprite(sprite) {
    function wiggle(aProgress, aPeriod1, aPeriod2) {
      const current1 = aProgress * Math.PI * 2 * aPeriod1;
      const current2 = aProgress * (Math.PI * 2 * aPeriod2 + Math.PI / 2);

      return Math.sin(current1) * Math.cos(current2);
    }

    this.game.add.tween(sprite.anchor).to(
      { x: sprite.anchor.x + 0.1 }, 500,
      function (k) {
        return wiggle(k, 100, 200);
      }, true, 0, -1
    );
  }

}
