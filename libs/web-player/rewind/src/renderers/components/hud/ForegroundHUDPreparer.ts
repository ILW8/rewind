import { injectable } from "inversify";
import { GameSimulator } from "../../../core/game/GameSimulator";
import { Container, Text } from "pixi.js";
import {
  calculateDigits,
  OsuClassicAccuracy,
  OsuClassicHitErrorBar,
  OsuClassicNumber,
} from "@rewind/osu-pixi/classic-components";
import { SkinHolder } from "../../../core/skins/SkinHolder";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants";
import { formatGameTime, hitWindowsForOD } from "@rewind/osu/math";
import { GameplayClock } from "../../../core/game/GameplayClock";
import { BeatmapManager } from "../../../apps/analysis/manager/BeatmapManager";

@injectable()
export class ForegroundHUDPreparer {
  container: Container;
  stats: Text;
  hitErrorBar: OsuClassicHitErrorBar;

  constructor(
    private readonly beatmapManager: BeatmapManager,
    private readonly skinManager: SkinHolder,
    private readonly gameSimulator: GameSimulator,
    private readonly gameplayClock: GameplayClock,
  ) {
    this.container = new Container();
    this.stats = new Text("", { fontSize: 16, fill: 0xeeeeee, fontFamily: "Arial", align: "left" });
    this.hitErrorBar = new OsuClassicHitErrorBar();
  }

  update() {
    const skin = this.skinManager.getSkin();
    const gameplayInfo = this.gameSimulator.getCurrentInfo();
    const gameplayState = this.gameSimulator.getCurrentState();
    const time = this.gameplayClock.timeElapsedInMs;
    const beatmap = this.beatmapManager.getBeatmap();

    this.container.removeChildren();

    if (gameplayInfo) {
      const comboNumber = new OsuClassicNumber();
      const textures = skin.getComboNumberTextures();
      const overlap = skin.config.fonts.comboOverlap;
      comboNumber.prepare({ digits: calculateDigits(gameplayInfo.currentCombo), textures, overlap });
      comboNumber.position.set(0, STAGE_HEIGHT - 50);
      this.container.addChild(comboNumber);
    }
    //
    // acc

    if (gameplayInfo) {
      // const text
      const accNumber = new OsuClassicAccuracy();
      const digitTextures = skin.getScoreTextures();
      const dotTexture = skin.getTexture("SCORE_DOT");
      const percentageTexture = skin.getTexture("SCORE_PERCENT");
      const overlap = skin.config.fonts.scoreOverlap;
      accNumber.prepare({ accuracy: gameplayInfo.accuracy, digitTextures, dotTexture, percentageTexture, overlap });
      accNumber.container.position.set(STAGE_WIDTH - 15, 25);
      this.container.addChild(accNumber.container);
    }

    // verdict counts: 300, 100, 50, miss

    if (gameplayInfo && gameplayState) {
      const count = gameplayInfo.verdictCounts;
      const maxCombo = gameplayInfo.maxComboSoFar;

      this.stats.text = `Time: ${formatGameTime(time, true)}\n\n300: ${count[0]}\n100: ${count[1]}\n50: ${
        count[2]
      }\nMisses: ${count[3]}\n\nMaxCombo: ${maxCombo}`;
      this.stats.position.set(25, 50);
      this.container.addChild(this.stats);
    }

    // hit error
    {
      // TODO: optimize
      const hits: any[] = [];
      if (gameplayState) {
        for (const id in gameplayState.hitCircleVerdict) {
          const s = gameplayState.hitCircleVerdict[id];
          const hitCircle = beatmap.getHitCircle(id);
          const offset = s.judgementTime - hitCircle.hitTime;
          const timeAgo = time - s.judgementTime;
          if (timeAgo >= 0 && timeAgo < 3000) hits.push({ offset, timeAgo, miss: s.type === "MISS" });
        }
      }

      const [hitWindow300, hitWindow100, hitWindow50] = hitWindowsForOD(beatmap.difficulty.overallDifficulty);
      this.hitErrorBar.prepare({
        hitWindow50,
        hitWindow100,
        hitWindow300,
        hits,
        // hits: [
        //   { timeAgo: 100, offset: -2 },
        //   { timeAgo: 2, offset: +10 },
        // ],
      });
      this.hitErrorBar.container.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT - 20);
      this.hitErrorBar.container.scale.set(2.0);
      this.container.addChild(this.hitErrorBar.container);
    }
  }
}
