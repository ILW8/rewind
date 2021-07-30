import { Sprite } from "@pixi/sprite";
import { Disposable } from "../DrawableHitObject";
import {
  applyPropertiesToDisplayObject,
  DisplayObjectTransformationProcess,
  evaluateTransformationsToProperties,
} from "../utils/Pixi";
import { SliderTextureManager } from "../managers/SliderTextureManager";
import { Easing, Position } from "@rewind/osu/math";
import { fadeInT, fadeOutT } from "../utils/Transformations";
import { PrepareSetting } from "../utils/Preparable";
import { Container } from "pixi.js";
import { RGB } from "@rewind/osu/math";
import { AnimationTimeSetting, ModHiddenSetting } from "../DrawableSettings";
import { OsuClassicConstants } from "./OsuClassicConstants";

export interface SliderBodySettings extends AnimationTimeSetting, ModHiddenSetting {
  borderColor: RGB;
  snakingIn: boolean;
  snakingOut: boolean;
  approachDuration: number;
  position: Position;
  points: Position[];
  radius: number;
  duration: number;
}

const defaultSliderBodySetting: SliderBodySettings = {
  time: 0,
  borderColor: [255, 255, 255],
  snakingIn: false,
  snakingOut: false,
  approachDuration: 450, // AR10
  points: [],
  radius: 45,
  position: { x: 0, y: 0 },
  modHidden: false,
  duration: 0,
};

/**
 * This needs to be improved because I can't draw more than 100 sliders on the screen...
 */
export class OsuClassicSliderBody implements PrepareSetting<SliderBodySettings>, Disposable {
  container: Container;
  sprite: Sprite;
  settings: SliderBodySettings;

  constructor(private readonly sliderTextureManager: SliderTextureManager) {
    this.settings = defaultSliderBodySetting;
    this.container = new Container();
    this.container.addChild((this.sprite = new Sprite()));
  }

  static transformation(settings: {
    approachDuration: number;
    position: Position;
    modHidden: boolean;
    duration: number;
  }): DisplayObjectTransformationProcess {
    const timeFadeIn = 400;
    const { approachDuration, modHidden, position, duration } = settings;

    const startTime = 0;
    const endTime = duration;
    const appearanceTime = startTime - approachDuration;

    const defaultTransforms: DisplayObjectTransformationProcess = {
      scale: { startValue: 1.0 },
      position: { startValue: position },
    };
    if (modHidden) {
      const hiddenFadeInDuration = approachDuration * OsuClassicConstants.fadeInDurationMultiplier;
      return {
        ...defaultTransforms,
        alpha: {
          startValue: 0.0,
          transformations: [
            { time: [appearanceTime, appearanceTime + hiddenFadeInDuration], func: fadeInT() },
            { time: [appearanceTime + hiddenFadeInDuration, endTime], func: fadeOutT() },
          ],
        },
      };
    } else {
      // Lazer specific
      const fadeOutTime = 450;
      return {
        ...defaultTransforms,
        alpha: {
          startValue: 0.0,
          transformations: [
            { time: [appearanceTime, appearanceTime + timeFadeIn], func: fadeInT() },
            { time: [endTime, endTime + fadeOutTime], func: fadeOutT(0, Easing.OUT_QUINT) },
          ],
        },
      };
    }
  }

  prepare(settings: Partial<SliderBodySettings>): void {
    this.settings = Object.freeze({ ...this.settings, ...settings });

    const { time, modHidden, borderColor, points, radius, position, approachDuration, duration } = this.settings;

    const t = OsuClassicSliderBody.transformation({ modHidden, duration, position, approachDuration });
    const props = evaluateTransformationsToProperties(t, time);
    applyPropertiesToDisplayObject(props, this.container);

    // TODO: Snaking
    // This is the most stupid caching
    if (!this.sprite.texture.valid)
      this.sliderTextureManager.registerJob({
        borderColor,
        points,
        radius,
        sprite: this.sprite,
      });
  }

  dispose(): void {
    this.sprite.texture.destroy(true);
  }
}
