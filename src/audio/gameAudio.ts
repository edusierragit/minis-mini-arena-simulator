import type { ResultKind } from "../types";
import { assetUrl } from "../utils/assets";

const audioPaths = {
  correct: "audio/success.ogg",
  incorrect: "audio/failure.ogg",
  missed: "audio/failure.ogg",
} satisfies Record<ResultKind, string>;

const audioVolumes = {
  correct: 0.24,
  incorrect: 0.2,
  missed: 0.2,
} satisfies Record<ResultKind, number>;

const audioCache = new Map<ResultKind, HTMLAudioElement>();

function getFeedbackAudio(kind: ResultKind): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;

  const existing = audioCache.get(kind);
  if (existing) return existing;

  const audio = new Audio(assetUrl(audioPaths[kind]));
  audio.preload = "auto";
  audio.volume = audioVolumes[kind];
  audioCache.set(kind, audio);
  return audio;
}

export function prepareFeedbackAudio(): void {
  getFeedbackAudio("correct");
  getFeedbackAudio("incorrect");
}

export function playFeedbackSound(kind: ResultKind, muted: boolean): void {
  if (muted) return;
  const audio = getFeedbackAudio(kind);
  if (!audio) return;

  try {
    audio.currentTime = 0;
    const playback = audio.play();
    if (playback) void playback.catch(() => undefined);
  } catch {
    // The trainer remains fully playable when a browser blocks media playback.
  }
}
