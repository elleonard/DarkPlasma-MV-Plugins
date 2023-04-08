// DarkPlasma_AllDeadState 1.0.0
// Copyright (c) 2023 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
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
 * version: 1.0.0
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
})();
