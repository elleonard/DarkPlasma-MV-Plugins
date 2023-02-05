/// <reference path="../../typings/rmmv.d.ts" />

declare interface Game_Temp {
  _skipEventLabel: string|null;
  _skipRequested: boolean;

  skipEventLabel(): string|null;
  resetSkipEvent(): void;
  resetRequestSkip(): void;
  requestSkipEvent(label: string): void;
}

declare interface Game_Interpreter {
  skipEvent(): void;
}
