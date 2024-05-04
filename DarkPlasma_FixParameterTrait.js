// DarkPlasma_FixParameterTrait 1.0.0
// Copyright (c) 2023 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2023/04/16 1.0.0 公開
 */

/*:
 * @plugindesc 能力値を固定する特徴
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @base DarkPlasma_AllocateUniqueTraitId
 *
 * @help
 * version: 1.0.0
 * アクター/職業/装備/ステートのメモ欄に
 * 指定の記述を行うことで、
 * 能力値を固定する特徴を付与します。
 * 同一のパラメータについて、
 * 複数の固定値特徴を付与した場合の挙動は未定義です。
 * この能力値固定は、他の装備や特徴による
 * 能力値の増減を無視して適用されます。
 *
 * 基本構文:
 * <fixParameter:[effect]:[value]>
 * [effect]で指定したパラメータを、[value]に固定します。
 * [value]には半角数値の他、\V[x]表記が利用できます。(ネストは不可)
 *
 * [effect]:
 *   mhp: 最大HP
 *   mmp: 最大MP
 *   atk: 攻撃力
 *   def: 防御力
 *   mat: 魔法攻撃力
 *   mdf: 魔法防御力
 *   agi: 敏捷性
 *   luk: 運
 *   hit: 命中率
 *   eva: 回避率
 *   cri: 会心率
 *   cev: 会心回避率
 *   mev: 魔法回避率
 *   mrf: 魔法反射率
 *   cnt: 反撃率
 *   hrg: HP再生率
 *   mrg: MP再生率
 *   trg: TP再生率
 *
 * 複数パラメータの設定をする場合:
 * <fixParameter:
 *   [effect1]:[value1]
 *   [effect2]:[value2]
 * >
 *
 * 本プラグインの利用には下記プラグインを必要とします。
 * DarkPlasma_AllocateUniqueTraitId version:1.0.0
 */

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const localTraitId = 1;
  const fixParameterTraitId = uniqueTraitIdCache.allocate(pluginName, localTraitId, '通常能力値固定');
  const fixXParameterTraitId = uniqueTraitIdCache.allocate(pluginName, localTraitId + 1, '追加能力値固定');
  const fixParameterVariableTraitId = uniqueTraitIdCache.allocate(pluginName, localTraitId + 2, '通常能力値固定(変数)');
  const fixXParameterVariableTraitId = uniqueTraitIdCache.allocate(
    pluginName,
    localTraitId + 3,
    '追加能力値固定(変数)'
  );
  const parameterType = ['mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
  const xParameterType = ['hit', 'eva', 'cri', 'cev', 'mev', 'mrf', 'cnt', 'hrg', 'mrg', 'trg'];
  function DataManager_FixParameterTraitMixIn() {
    const _extractMetadata = DataManager.extractMetadata;
    DataManager.extractMetadata = function (data) {
      _extractMetadata.call(this, data);
      if (hasTrait(data)) {
        extractFixParameterTrait(data);
      }
    };
    function hasTrait(data) {
      return 'traits' in data;
    }
    function extractFixParameterTrait(data) {
      if (data.meta.fixParameter) {
        const lines = String(data.meta.fixParameter).split('\n');
        lines
          .map((line) => {
            const fixParameterSetting = /(.+):(.+)/.exec(line.trim());
            if (fixParameterSetting && fixParameterSetting[1] && fixParameterSetting[2]) {
              const traitId = traitIdFromSetting(fixParameterSetting[1].trim(), fixParameterSetting[2].trim());
              if (!traitId) {
                return null;
              }
              const dataId = dataIdFromTraitId(traitId, fixParameterSetting[1].trim());
              if (dataId === undefined) {
                return null;
              }
              const value = extractValue(fixParameterSetting[2].trim());
              return {
                code: traitId.id,
                dataId: dataId,
                value: value,
              };
            }
            return null;
          })
          .filter((trait) => !!trait)
          .forEach((trait) => data.traits.push(trait));
      }
    }
    function traitIdFromSetting(parameter, value) {
      if (parameterType.includes(parameter)) {
        return value.startsWith('\\V') ? fixParameterVariableTraitId : fixParameterTraitId;
      } else if (xParameterType.includes(parameter)) {
        return value.startsWith('\\V') ? fixXParameterVariableTraitId : fixXParameterTraitId;
      }
      return undefined;
    }
    function dataIdFromTraitId(traitId, parameter) {
      if (traitId === fixParameterTraitId || traitId === fixParameterVariableTraitId) {
        return parameterType.indexOf(parameter);
      } else if (traitId === fixXParameterTraitId || traitId === fixXParameterVariableTraitId) {
        return xParameterType.indexOf(parameter);
      }
      return undefined;
    }
    function extractValue(value) {
      if (value.startsWith('\\V')) {
        const variableId = /\\V\[(.+)\]/.exec(value);
        return variableId && variableId[1] ? Number(variableId[1]) : 0;
      }
      return Number(value);
    }
  }
  DataManager_FixParameterTraitMixIn();
  function Game_BattlerBase_FixParameterTraitMixIn(gameBattlerBase) {
    gameBattlerBase.isParamFixed = function (paramId) {
      return this.traitsSet(fixParameterTraitId.id)
        .concat(this.traitsSet(fixParameterVariableTraitId.id))
        .includes(paramId);
    };
    gameBattlerBase.fixedParameter = function (paramId) {
      const traits = this.traitsWithId(fixParameterTraitId.id, paramId);
      if (traits.length > 0) {
        return traits[0].value;
      }
      const variableTraits = this.traitsWithId(fixParameterVariableTraitId.id, paramId);
      if (variableTraits.length > 0) {
        return $gameVariables.value(variableTraits[0].value);
      }
      throw Error(`不正な能力値固定特徴です。 paramId: ${paramId}`);
    };
    gameBattlerBase.isXParamFixed = function (xparamId) {
      return this.traitsSet(fixXParameterTraitId.id)
        .concat(this.traitsSet(fixXParameterVariableTraitId.id))
        .includes(xparamId);
    };
    gameBattlerBase.fixedXParameter = function (xparamId) {
      const traits = this.traitsWithId(fixXParameterTraitId.id, xparamId);
      if (traits.length > 0) {
        return traits[0].value / 100;
      }
      const variableTraits = this.traitsWithId(fixXParameterVariableTraitId.id, xparamId);
      if (variableTraits.length > 0) {
        return $gameVariables.value(variableTraits[0].value) / 100;
      }
      throw Error(`不正な能力値固定特徴です。 paramId: ${xparamId}`);
    };
    const _param = gameBattlerBase.param;
    gameBattlerBase.param = function (paramId) {
      if (this.isParamFixed(paramId)) {
        return this.fixedParameter(paramId);
      }
      return _param.call(this, paramId);
    };
    const _xparam = gameBattlerBase.xparam;
    gameBattlerBase.xparam = function (xparamId) {
      if (this.isXParamFixed(xparamId)) {
        return this.fixedXParameter(xparamId);
      }
      return _xparam.call(this, xparamId);
    };
  }
  Game_BattlerBase_FixParameterTraitMixIn(Game_BattlerBase.prototype);
})();