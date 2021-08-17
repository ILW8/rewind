import axios from "axios";
import { modsFromBitmask, parseReplayFramesFromRaw, RawReplayData } from "@rewind/osu/core";
import { OsuReplay } from "../../replays/slice";
import { inject, injectable } from "inversify";
import { TYPES } from "./types";

@injectable()
export class ReplayService {
  // retrieve and parse
  constructor(@inject(TYPES.API_URL) private apiUrl: string) {}

  async retrieveReplay(replayId: string): Promise<OsuReplay> {
    const url = [this.apiUrl, "api", "replays", "exported", replayId].join("/");
    // const url = "";
    const res = (await axios
      .get(url)
      .then((value) => value.data)
      .catch((err) => {
        console.error(err);
        return null;
      })) as RawReplayData;

    // TODO: Emit ...

    return {
      gameVersion: res.gameVersion,
      frames: parseReplayFramesFromRaw(res.replay_data),
      mods: modsFromBitmask(res.mods),
      md5hash: res.replayMD5,
      player: res.playerName,
    };
  }
}
