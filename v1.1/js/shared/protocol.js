// Wire protocol shared by the display and the phone pad: version, channel names, message types, room-code alphabet.

export const PROTO = 101;

export const GAME = "osrodek-daje";

export const CH = { EVENT: "ev", INPUT: "in" };

export const MSG = {
  JOIN: "join", WELCOME: "welcome", REJECT: "reject", KICK: "kick", LEAVE: "leave", INPUT: "in", PAD: "pad", FX: "fx"
};

export const ROOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ";

export const ROOM_CODE_LEN = 4;

export const SEQ_MOD = 65536;

export const MAX_PLAYERS = 4;

export const PLAYER_COLORS = ["#ff2e63", "#08b2ff", "#ffc400", "#9b4dff"];

export const PLAYER_NAMES = ["RED", "BLUE", "YELLOW", "PURPLE"];

export function newerSeq(q, last) {
  if (last == null) return true;
  if (q === last) return false;
  return ((q - last + SEQ_MOD) % SEQ_MOD) < SEQ_MOD / 2;
}
