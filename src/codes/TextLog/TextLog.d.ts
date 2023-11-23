/// <reference path="../../typings/rmmv.d.ts" />
/// <reference path="../NameWindow/NameWindow.d.ts" />

declare interface PluginManagerStatic {
  isLoadedPlugin(name: string): boolean;
}

declare interface TouchInputStatic {
  _deltaX: number;
  _deltaY: number;

  isUpMoved(): boolean;
  isDownMoved(): boolean;
}

declare interface Game_Message {
  _chosenIndex: number|null;

  chosenIndex(): number|null;
}

declare interface Game_System {
  insertTextLog(text: string): void;
}

declare interface Game_Interpreter {
  isCommonOrBattleEvent(): boolean;
  isParallelEvent(): boolean;
}

declare interface Scene_Menu {
  commandTextLog(): void;
}

declare interface Scene_Map {
  textLogCalling: boolean;

  updateCallTextLog(): void;
  isTextLogEnabled(): boolean;
  isFileListWindowActive(): boolean;
  isTextLogCalled(): boolean;
  callTextLog(): void;

  refreshPauseWindowHandlers(): void;
  /**
   * NobleMushroom.js
   */
  _pauseWindow: Window_PauseMenu;
  _fileListWindow: Window_SavefileList;

  createPauseWindow(): void;

  callSave(): void;
  callLoad(): void;
  callQuickSave(): void;
  callQuickLoad(): void;
  callToTitle(): void;
  offPause(): void;
}

declare namespace Scene_Map {
  var symbolSave: 'save';
  var symbolLoad: 'load';
}

declare interface Window_MenuCommand {
  isTextLogEnabled(): boolean;
}

declare interface Window_ChoiceList {
  addToLog(): void;
}

declare interface Window_Message {
  _nameWindow?: Window_SpeakerName;

  nameColorInLog(name: string): string|number;
  hasNameWindow(): boolean;
}

declare interface Window_PauseMenu extends Window_Command {

}
