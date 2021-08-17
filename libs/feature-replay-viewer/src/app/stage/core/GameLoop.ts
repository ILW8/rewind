import * as PIXI from "pixi.js";
import { GameplayClock } from "./GameplayClock";
import { PixiRendererService } from "./PixiRendererService";
import { TheaterStagePreparer } from "./TheaterStagePreparer";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";

// Game loop does not have to stop if the game clock is paused.
// For example we could still toggle hidden on/off and need to see the changes on the canvas.
// However, it should be paused, if the view is destroyed or if the window was blurred ...
// Default behavior is to stop the game loop in case of window.blur because usually the player does not want to
// I think end game behavior would be to automatically stop the game loop if the user is playing osu!, which we
// could detect through some memory reader.
@injectable()
export class GameLoop {
  constructor(
    private ticker: PIXI.Ticker,
    private gameClock: GameplayClock, // Maybe also inject?
    private pixiRendererService: PixiRendererService,
    @inject(TYPES.THEATER_STAGE_PREPARER) private theaterStagePreparer: TheaterStagePreparer,
  ) {}

  setupListeners() {
    // window.addEventListener("blur", this.onWindowBlur.bind(this));
    // window.addEventListener("focus", this.onWindowFocus.bind(this));
  }

  initializeTicker() {
    this.ticker.add(this.tickHandler.bind(this));
  }

  startTicker() {
    this.ticker.start();
  }

  tickHandler() {
    this.gameClock.tick();

    const renderer = this.pixiRendererService.getRenderer();
    if (renderer === undefined) {
      return;
    }
    // TODO: Resizing
    // TODO: Audio sample queue
    const stage = this.theaterStagePreparer.prepare();
    renderer.render(stage);
  }

  onWindowBlur() {
    // this.gameClock.stop();
    this.ticker.stop();
  }

  onWindowFocus() {
    this.ticker.start();
  }
}
