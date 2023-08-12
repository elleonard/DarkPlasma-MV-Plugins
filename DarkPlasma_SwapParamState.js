// DarkPlasma_SwapParamState 1.0.0
// Copyright (c) 2023 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2023/08/13 1.0.0 公開
 */

/*:
 * @plugindesc パラメータを入れ替えるステート
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 1.0.0
 * パラメータを入れ替えるステートを実現します。
 *
 * ステートのメモ欄に
 * <swapParam:atk,mat>
 * と入力すると、そのステートにかかっている間
 * 攻撃力と魔法力を入れ替えます。
 *
 * ステート名:
 * mhp: 最大HP
 * mmp: 最大MP
 * atk: 攻撃力
 * def: 防御力
 * mat: 魔法力
 * mdf: 魔法防御
 * agi: 敏捷
 * luk: 運
 *
 * 同じパラメータを入れ替えるステートは重複できません。
 */

(() => {
  'use strict';

  function paramNameToId(paramName) {
    switch (paramName) {
      case 'mhp':
        return 0;
      case 'mmp':
        return 1;
      case 'atk':
        return 2;
      case 'def':
        return 3;
      case 'mat':
        return 4;
      case 'mdf':
        return 5;
      case 'agi':
        return 6;
      case 'luk':
        return 7;
    }
    return undefined;
  }
  function stateToSwapParamIds(state) {
    const result = String(state.meta.swapParam).split(',').map(paramNameToId);
    if (result.length !== 2 || result[0] === undefined || result[1] === undefined) {
      return undefined;
    }
    return [result[0], result[1]];
  }
  function Game_BattlerBase_SwapParamStateMixIn(gameBattlerBase) {
    const _param = gameBattlerBase.param;
    gameBattlerBase.param = function (paramId) {
      return _param.call(this, this.paramAlias(paramId));
    };
    gameBattlerBase.swapParamState = function (paramId) {
      return this.states().find((state) => {
        var _a;
        return (_a = stateToSwapParamIds(state)) === null || _a === void 0 ? void 0 : _a.includes(paramId);
      });
    };
    gameBattlerBase.paramAlias = function (paramId) {
      var _a, _b;
      const state = this.swapParamState(paramId);
      if (!state) {
        return paramId;
      }
      return (_b =
        (_a = stateToSwapParamIds(state)) === null || _a === void 0 ? void 0 : _a.find((p) => p !== paramId)) !==
        null && _b !== void 0
        ? _b
        : paramId;
    };
    gameBattlerBase.isSwapParamStateAffected = function (paramId) {
      return !!this.swapParamState(paramId);
    };
  }
  Game_BattlerBase_SwapParamStateMixIn(Game_BattlerBase.prototype);
  function Game_Battler_SwapParamStateMixIn(gameBatter) {
    const _isStateAddable = gameBatter.isStateAddable;
    gameBatter.isStateAddable = function (stateId) {
      var _a, _b;
      return (
        _isStateAddable.call(this, stateId) &&
        (this.isStateAffected(stateId) ||
          ((_b =
            (_a = stateToSwapParamIds($dataStates[stateId])) === null || _a === void 0
              ? void 0
              : _a.every((paramId) => !this.isSwapParamStateAffected(paramId))) !== null && _b !== void 0
            ? _b
            : true))
      );
    };
  }
  Game_Battler_SwapParamStateMixIn(Game_Battler.prototype);
})();
