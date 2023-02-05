// DarkPlasma_MapEventSkip 1.0.0
// Copyright (c) 2023 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2023/02/05 1.0.0 公開
 */

/*:ja
 * @plugindesc イベントスキップ用プラグインコマンド
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 1.0.0
 * マップイベントをスキップするプラグインコマンドを提供します。
 *
 * skipEvent (ラベル名)
 * ラベル名を省略するとイベントの最後まで飛びます。
 */

(() => {
  'use strict';

  function Game_Temp_EventSkipMixIn(gameTemp) {
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
  function Game_Map_EventSkipMixIn(gameMap) {
    const _update = gameMap.update;
    gameMap.update = function (sceneActive) {
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
  function Game_Interpreter_EventSkipMixIn(gameInterpreter) {
    const _pluginCommand = gameInterpreter.pluginCommand;
    gameInterpreter.pluginCommand = function (command, args) {
      if (command === 'skipEvent') {
        $gameTemp.requestSkipEvent(args[0] || '');
        return;
      }
      _pluginCommand.call(this, command, args);
    };
    gameInterpreter.skipEvent = function () {
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
  function Scene_Map_EventSkipMixIn(sceneMap) {
    const _update = sceneMap.update;
    sceneMap.update = function () {
      _update.call(this);
      if ($gameTemp.skipEventLabel() !== null && $gameMessage.isBusy()) {
        this._messageWindow.pause = false;
        this._messageWindow.terminateMessage();
      }
    };
  }
  Scene_Map_EventSkipMixIn(Scene_Map.prototype);
})();
