/// <reference path="./MapEventSkip.d.ts" />

function Game_Temp_EventSkipMixIn(gameTemp: Game_Temp) {
  const _initialize = gameTemp.initialize;
  gameTemp.initialize = function () {
    _initialize.call(this);
    this._skipEventLabel = null;
    this._skipRequested = false;
  };

  gameTemp.skipEventLabel = function () {
    return this._skipEventLabel;
  };

  gameTemp.resetSkipEvent = function () {
    this._skipEventLabel = null;
  };

  /**
   * 意図しない再入力を防ぐ
   */
  gameTemp.resetRequestSkip = function () {
    this._skipRequested = false;
  };

  gameTemp.requestSkipEvent = function (label) {
    if (!this._skipRequested) {
      this._skipEventLabel = label;
      this._skipRequested = true;
    }
  };
}

Game_Temp_EventSkipMixIn(Game_Temp.prototype);

function Game_Map_EventSkipMixIn(gameMap: Game_Map) {
  const _update = gameMap.update;
  gameMap.update = function (this: Game_Map, sceneActive) {
    if ($gameTemp.skipEventLabel() !== null && this._interpreter.isRunning()) {
      this._interpreter.skipEvent();
    }
    _update.call(this, sceneActive);
  };

  const _setupStartingEvent = gameMap.setupStartingEvent;
  gameMap.setupStartingEvent = function () {
    const result = _setupStartingEvent.call(this);
    if (result) {
      $gameTemp.resetRequestSkip();
    }
    return result;
  };
}

Game_Map_EventSkipMixIn(Game_Map.prototype);

function Game_Interpreter_EventSkipMixIn(gameInterpreter: Game_Interpreter) {
  const _pluginCommand = gameInterpreter.pluginCommand;
  gameInterpreter.pluginCommand = function (command, args) {
    if (command === 'skipEvent') {
      $gameTemp.requestSkipEvent(args[0] || '');
      return;
    }
    _pluginCommand.call(this, command, args);
  };

  gameInterpreter.skipEvent = function (this: Game_Interpreter) {
    if (this._childInterpreter) {
      this._childInterpreter.skipEvent();
    }
    this._params = [$gameTemp.skipEventLabel()];
    if ($gameTemp.skipEventLabel()) {
      this.command119();
    } else {
      this.command115();
    }
    if (this._depth === 0) {
      $gameTemp.resetSkipEvent();
    }
  };
}

Game_Interpreter_EventSkipMixIn(Game_Interpreter.prototype);

function Scene_Map_EventSkipMixIn(sceneMap: Scene_Map) {
  const _update = sceneMap.update;
  sceneMap.update = function (this: Scene_Map) {
    _update.call(this);
    if ($gameTemp.skipEventLabel() !== null && $gameMessage.isBusy()) {
      this._messageWindow.pause = false;
      this._messageWindow.terminateMessage();
    }
  };
}

Scene_Map_EventSkipMixIn(Scene_Map.prototype);
