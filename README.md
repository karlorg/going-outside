# Going Outside
## A Ludum Dare game about going outside of One Room

Playable online on [itch.io](http://karln.itch.io/going-outside).

## Compiling

This repo is based on the [Phaser-ES6-Webpack template](https://github.com/lean/phaser-es6-webpack) by lean here on Github, and is written in ES6.  To run the code you need Node and NPM installed.  Then you can run `npm i` in the project root to install dependencies, `npm run dev` to run a development server that automatically compiles changes to the code and refreshes the browser, and `npm run deploy` to make a distributable version.

Check out `src/states/Room.js`, it's amazing.  Exactly the sort of hacky nonsense I'm usually incapable of writing at all.  Game jams are pretty motivating that way :)  (Specifically, try the collision detection and the player falling code.  Also note that the player movement is just Ctrl-C Ctrl-V'd from `Game.js`.)
