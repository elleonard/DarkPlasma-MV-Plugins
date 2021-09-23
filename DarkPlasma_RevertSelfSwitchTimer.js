// DarkPlasma_RevertSelfSwitchTimer 1.0.0
// Copyright (c) 2021 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/09/23 1.0.0 公開
 */

/*:ja
 * @plugindesc セルフスイッチを時間経過でOFFに戻すプラグインコマンド
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param defaultTimer
 * @desc タイマー起動時に時間を指定しなかった場合の発動時間
 * @text デフォルトタイマー
 * @type number
 * @default 10
 *
 * @help
 * version: 1.0.0
 * イベントのセルフスイッチを
 * 時間経過でOFFにするプラグインコマンドを提供します。
 * 例えば、時間経過で復活する宝箱を実現できます。
 *
 * 本プラグインでは、
 * - タイマーのカウント開始を「起動する」
 * - 指定時刻になり、セルフスイッチをOFFにする挙動を「発動する」
 * と表現します。
 *
 * プラグインコマンド:
 *   startRevertSelfSwitchTimer switch=X seconds=Y
 *   セルフスイッチXをY秒後にOFFにするタイマーを起動する
 *   switch=X seconds=Yは半角スペース区切りで自由な順序で指定できる
 *   switch=Xを省略した場合、セルフスイッチAを対象とする
 *   seconds=Yを省略した場合、プラグインパラメータで設定した時間を使用する
 *
 * タイマーはリアル時間に依存しており、マップ上で指定時間になると
 * セルフスイッチをOFFにしてタイマーを消去します。
 * 消去されていないタイマーはセーブデータに記録されます。
 *
 * 起動中のタイマーが増えると、タイマーを起動する処理が遅くなることがあります。
 */

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    defaultTimer: Number(pluginParameters.defaultTimer || 10),
  };

  let $gameRevertSelfSwitchTimers = null;

  class Game_RevertSelfSwitchTimers {
    constructor() {
      /**
       * @type {Game_RevertSelfSwitchTimer[]}
       */
      this._timers = [];
    }

    /**
     * セルフスイッチタイマーを追加する
     * @param {number} mapId マップID
     * @param {number} eventId イベントID
     * @param {string} selfSwitchCh セルフスイッチ（A, B, C, D）
     * @param {number} revertSeconds OFFまでの時間（秒）
     */
    addTimer(mapId, eventId, selfSwitchCh, revertSeconds) {
      this._timers.push(new Game_RevertSelfSwitchTimer(mapId, eventId, selfSwitchCh, new Date(), revertSeconds));
      this._timers.sort((a, b) => a.revertAt - b.revertAt);
    }

    /**
     * 次にOFFにする時刻（ミリ秒）
     * @return {number|null}
     */
    nextRevertAt() {
      return this._timers.length === 0 ? null : this._timers[0].revertAt;
    }

    updateRevert() {
      const nextRevertAt = this.nextRevertAt();
      if (nextRevertAt && Date.now() >= nextRevertAt) {
        this._timers.filter((timer) => Date.now() >= timer.revertAt).forEach((timer) => this.revert(timer));
      }
    }

    /**
     * @param {Game_RevertSelfSwitchTimer} target 発動タイマー
     */
    revert(target) {
      $gameSelfSwitches.setValue([target.mapId, target.eventId, target.selfSwitchCh], false);
      this._timers = this._timers.filter(
        (timer) =>
          timer.mapId !== target.mapId || timer.eventId !== target.eventId || timer.selfSwitchCh !== target.selfSwitchCh
      );
    }
  }

  class Game_RevertSelfSwitchTimer {
    /**
     * @param {number} mapId マップID
     * @param {number} eventId イベントID
     * @param {string} selfSwitchCh セルフスイッチ
     * @param {Date} openTime 開けた時刻
     * @param {number} revertSeconds 復活までの時間（秒）
     */
    constructor(mapId, eventId, selfSwitchCh, openTime, revertSeconds) {
      this._mapId = mapId;
      this._eventId = eventId;
      this._selfSwitchCh = selfSwitchCh;
      this._revertAt = openTime.getTime() + revertSeconds * 1000;
    }

    get mapId() {
      return this._mapId;
    }

    get eventId() {
      return this._eventId;
    }

    get selfSwitchCh() {
      return this._selfSwitchCh;
    }

    /**
     * セルフスイッチをOFFにする時刻（ミリ秒）
     * @return {number}
     */
    get revertAt() {
      return this._revertAt;
    }
  }

  window.Game_RevertSelfSwitchTimers = Game_RevertSelfSwitchTimers;
  window.Game_RevertSelfSwitchTimer = Game_RevertSelfSwitchTimer;

  /**
   * @param {DataManager} dataManager
   */
  function DataManager_RevertSelfSwitchTimerMixIn(dataManager) {
    const _createGameObjects = dataManager.createGameObjects;
    dataManager.createGameObjects = function () {
      _createGameObjects.call(this);
      $gameRevertSelfSwitchTimers = new Game_RevertSelfSwitchTimers();
    };

    const _makeSaveContents = dataManager.makeSaveContents;
    dataManager.makeSaveContents = function () {
      const contents = _makeSaveContents.call(this);
      contents.revertSelfSwitchTimers = $gameRevertSelfSwitchTimers;
      return contents;
    };

    const _extractSaveContents = dataManager.extractSaveContents;
    dataManager.extractSaveContents = function (contents) {
      _extractSaveContents.call(this, contents);
      $gameRevertSelfSwitchTimers = contents.revertSelfSwitchTimers || new Game_RevertSelfSwitchTimers();
    };
  }
  DataManager_RevertSelfSwitchTimerMixIn(DataManager);

  /**
   * @param {Scene_Map.prototype} sceneMap
   */
  function Scene_Map_RevertSelfSwitchTimerMixIn(sceneMap) {
    const _updateMainMultiply = sceneMap.updateMainMultiply;
    sceneMap.updateMainMultiply = function () {
      _updateMainMultiply.call(this);
      this.updateRevertSelfSwitchTimer();
    };

    sceneMap.updateRevertSelfSwitchTimer = function () {
      $gameRevertSelfSwitchTimers.updateRevert();
    };
  }
  Scene_Map_RevertSelfSwitchTimerMixIn(Scene_Map.prototype);

  const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'startRevertSelfSwitchTimer') {
      const selfSwitchCh = (args.find((arg) => arg.startsWith('switch=')) || 'switch=A').split('=')[1];
      const seconds = Number(
        (args.find((arg) => arg.startsWith('seconds=')) || `seconds=${settings.defaultTimer}`).split('=')[1]
      );
      $gameRevertSelfSwitchTimers.addTimer(this._mapId, this._eventId, selfSwitchCh, seconds);
    }
  };
})();
