/// <reference path="../../typings/rmmv.d.ts" />
/// <reference path="../AutoLineBreak/AutoLineBreak.d.ts" />

declare interface NameWindowTextInfo {
  readonly position: number;
  readonly eraseTarget: string | RegExp;
  coloredName(): string;
}

declare interface Game_Message {
  nextText(): string;
  skipFlg(): boolean;
}

declare interface Game_Actors {
  byName(name: string): Game_Actor | null;
}

declare interface Scene_Map {
  hasNameWindow(): boolean;
  isNameWindowVisible(): boolean;
}

declare interface Window_Base {
  isNameWindow(): boolean;
}

declare interface Window_Message {
  _isAlreadyShownNameWindow: boolean;
  _nameWindow: Window_SpeakerName;
  _nameWindowTextInfo: NameWindowTextInfo | null;

  showNameWindow(name: string, position: number): void;
  hideNameWindow(): void;
  hasNameWindow(): boolean;
  isNameWindowVisible(): boolean;

  hideSubWindow(subWindow: Window_Base): void;
  showSubWindow(subWindow: Window_Base): void;
  findNameWindowTextInfo(text: string): NameWindowTextInfo | null;
  convertNameWindow(text: string): string;
  colorByName(name: string): string | number;
}

declare interface Window_SpeakerName extends Window_Base {
  text(): string;

  startClose(): void;
  showName(text: string, position: number): void;
}
