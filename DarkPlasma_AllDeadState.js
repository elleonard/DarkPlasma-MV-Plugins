// DarkPlasma_AllDeadState 1.0.1
// Copyright (c) 2023 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2023/04/18 1.0.1 不死身と組み合わせると敗北可を貫通する不具合を修正
 * 2023/04/08 1.0.0 公開
 */

/*:
 * @plugindesc 指定ステートで敗北判定させる
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param states
 * @desc 指定ステートにかかったアクターは戦闘不能でなくとも敗北判定にカウントします。
 * @text ステート
 * @type state[]
 * @default []
 *
 * @help
 * version: 1.0.1
 * アクターが指定したステートにかかっている場合、
 * 戦闘不能でなくとも敗北判定にカウントします。
 *
 * 例えば、戦闘不能でないアクター全員が石化状態の場合
 * 敗北判定にできます。
 */

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    states: JSON.parse(pluginParameters.states || '[]').map((e) => {
      return Number(e || 0);
    }),
  };

  function Game_Party_AllDeadStateMixIn(gameParty) {
    const _isAllDead = gameParty.isAllDead;
    gameParty.isAllDead = function () {
      return (
        _isAllDead.call(this) ||
        (this.inBattle() &&
          this.aliveMembers().every((actor) => settings.states.some((stateId) => actor.isStateAffected(stateId))))
      );
    };
  }
  Game_Party_AllDeadStateMixIn(Game_Party.prototype);
  function Scene_Battle_ReviveMixIn(sceneBattle) {
    const _terminate = sceneBattle.terminate;
    sceneBattle.terminate = function () {
      _terminate.call(this);
      /**
       * 不死身かつ、敗北判定ステートにより、HP0かつ戦闘不能でない状態で敗北した場合
       * BattleManager.updateBattleEndの時点では戦闘不能でないため
       * 戦闘不能の解除が働かず、マップ上に出た瞬間に敗北可であろうとゲームオーバーになってしまう
       * この時点で全員戦闘不能かつ敗北可であった場合
       * とりあえず全員復活させる
       */
      if (BattleManager.canLose() && $gameParty.isAllDead()) {
        $gameParty.reviveBattleMembers();
      }
    };
  }
  Scene_Battle_ReviveMixIn(Scene_Battle.prototype);
})();
