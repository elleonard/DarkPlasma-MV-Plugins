// DarkPlasma_DisableCommonEventItem 1.0.0
// Copyright (c) 2021 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/11/02 1.0.0 公開
 */

/*:ja
 * @plugindesc コモンイベントアイテム・スキル禁止
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param switchId
 * @desc このスイッチがONの時、コモンイベントを発生させるアイテム・スキルを使用不可にします。
 * @text 禁止スイッチ
 * @type switch
 * @default 0
 *
 * @help
 * version: 1.0.0
 * コモンイベントを発生させる効果を含むアイテム・スキルを使用不可にします。
 */

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    switchId: Number(pluginParameters.switchId || 0),
  };

  /**
   * @param {Game_BattlerBase.prototype} gameBattler
   */
  function Game_BattlerBase_DisableCommonEventItemMixIn(gameBattler) {
    const _meetsUsableItemConditions = gameBattler.meetsUsableItemConditions;
    gameBattler.meetsUsableItemConditions = function (item) {
      const itemHasCommonEvent = hasCommonEvent(item);
      return (
        _meetsUsableItemConditions.call(this, item) && (!itemHasCommonEvent || !$gameSwitches.value(settings.switchId))
      );
    };
  }

  Game_BattlerBase_DisableCommonEventItemMixIn(Game_BattlerBase.prototype);

  /**
   * コモンイベントを発生させる効果を持つアイテム・スキルであるか
   * @param {RPG.UsableItem} item
   * @return {boolean}
   */
  function hasCommonEvent(item) {
    return item.effects.some((effect) => effect.code === Game_Action.EFFECT_COMMON_EVENT);
  }
})();
