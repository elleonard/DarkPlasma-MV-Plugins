// DarkPlasma_MultiElementRate 2.0.0
// Copyright (c) 2023 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2023/04/06 2.0.0 パラメータ名を変更
 *                  同一属性が重複して計算される不具合を修正
 * 2020/04/27 1.0.1 加算設定が効いていない不具合を修正
 *            1.0.0 公開
 */

/*:
 * @plugindesc 攻撃属性すべてを計算に用いる
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param addition
 * @desc 計算時に全属性の有効度を加算するかどうか。OFFの場合は乗算する
 * @text 加算するか
 * @type boolean
 * @default false
 *
 * @help
 * version: 2.0.0
 * 攻撃に付与されている属性が複数ある場合、
 * その攻撃の属性すべてをダメージ計算に使用します。
 *
 * 城さんと加算で計算方法が異なります。
 * 例えば、火＋光属性の攻撃を、火有効度200％ 光有効度150％の敵に使用すると
 * 以下のようになります。
 * 乗算の場合: 2 x 1.5 = 300％
 * 加算の場合: 2 + 1.5 = 350％
 *
 * 加算の場合、火有効度100％かつ光有効度100％の敵に火＋光属性攻撃を行うと
 * 1 + 1 = 200％となってしまうことに注意してください。
 */

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    addition: String(pluginParameters.addition || false) === 'true',
  };

  function Game_Action_MultiElementRateMixIn(gameAction) {
    const _elementsMaxRate = gameAction.elementsMaxRate;
    gameAction.elementsMaxRate = function (target, elements) {
      if (elements.length > 0) {
        return [...new Set(elements)].reduce((previous, current) => {
          return settings.addition ? previous + target.elementRate(current) : previous * target.elementRate(current);
        }, 1);
      } else {
        return _elementsMaxRate.call(this, target, elements);
      }
    };
  }
  Game_Action_MultiElementRateMixIn(Game_Action.prototype);
})();
