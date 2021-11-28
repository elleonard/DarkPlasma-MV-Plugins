// DarkPlasma_StopRateByState 1.0.0
// Copyright (c) 2021 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/11/28 1.0.0 公開
 */

/*:ja
 * @plugindesc 一定確率で行動できないステート
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param defaultStopText
 * @desc 行動できなかった場合のメッセージを設定します。%1が動けなかった対象の名前に変換されます。
 * @text デフォルトメッセージ
 * @type string
 * @default %1は動けなかった
 *
 * @help
 * version: 1.0.0
 * 一定確率で行動できないステートを実現します。
 * NumbState.jsとの違いは以下の通り
 * - 行動後に行動できなかったメッセージが表示される不具合がない
 * - ステートごとにメッセージを設定可能
 *
 * 対象のステートについて、行動制約をなしにして
 * ステートのメモ欄に記述例を参考にタグを記述してください。
 *
 * 記述例: 60％の確率で行動できない麻痺ステート
 * <stopRate:60>
 *
 * 以下のように記述することで、
 * ステートごとに別々のメッセージを表示できます。
 * 設定しなかった場合、プラグインパラメータのメッセージが表示されます。
 * <stopText:%1は身体が痺れて動けない！>
 */

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    defaultStopText: String(pluginParameters.defaultStopText || '%1は動けなかった'),
  };

  const _BattleManager_proessTurn = BattleManager.processTurn;
  BattleManager.processTurn = function () {
    if (this._subject.currentAction()) {
      const stopAfterInputState = this._subject.stopAfterInputState();
      if (stopAfterInputState) {
        this._subject.clearActions();
        this._logWindow.displayStopAfterInput(this._subject, stopAfterInputState);
      }
    }
    _BattleManager_proessTurn.call(this);
  };

  /**
   * @return {RPG.State|undefined}
   */
  Game_Battler.prototype.stopAfterInputState = function () {
    const state = this.states().find(
      (state) => state.meta.stopRate && Math.randomInt(100) < Number(state.meta.stopRate)
    );
    return state;
  };

  /**
   * @param {Game_Battler} subject
   * @param {RPG.State} state
   */
  Window_BattleLog.prototype.displayStopAfterInput = function (subject, state) {
    const text = state.meta.stopText || settings.defaultStopText;
    this.push('addText', text.format(subject.name()));
    this.push('clear');
  };
})();
