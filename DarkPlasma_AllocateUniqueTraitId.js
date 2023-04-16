// DarkPlasma_AllocateUniqueTraitId 1.0.0
// Copyright (c) 2023 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2023/04/16 1.0.0 公開
 */

/*:
 * @plugindesc 独自の特徴IDを確保する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param startIdOfUniqueTraitId
 * @desc 独自に特徴IDを確保する際の始点ID。わからない場合はそのままにしてください
 * @text 独自特徴ID始点
 * @type number
 * @default 71
 *
 * @help
 * version: 1.0.0
 * 特徴の特徴IDを確保し、利用できるようにします。
 * 本プラグインは単体では機能しません。
 * 本プラグインを必要とする別のプラグインと
 * 一緒に利用してください。
 *
 * 以下、プラグイン開発者向け
 * uniqueTraitIdCache オブジェクトに対して
 * リクエストを投げてください。
 *
 * uniqueTraitIdCache.allocate
 *   : (pluginName: string, localId: number, name: string)
 *     => UniqueTraitId
 *   プラグインで独自の特徴IDを確保します。
 *
 * uniqueTraitIdCache.traitIdOf
 *   : (pluginName: string, localId: number)
 *     => number|undefined
 *   確保した特徴ID
 *   確保していない場合はundefined
 *
 * uniqueTraitIdCache.nameOf
 *   : (pluginName: string, localId: number)
 *     => string|undefined
 *   確保した特徴IDの名前
 *   確保していない場合はundefined
 *
 * UniqueTraitId.prototype.id: number
 *   確保した特徴ID
 *
 * UniqueTraitId.prototype.name: string
 *   確保した特徴IDの名前
 */

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    startIdOfUniqueTraitId: Number(pluginParameters.startIdOfUniqueTraitId || 71),
  };

  let uniqueTraitId = settings.startIdOfUniqueTraitId;
  class UniqueTraitIdCache {
    constructor() {
      this._cache = {};
      this._cacheById = {};
    }
    allocate(pluginName, localId, name) {
      const key = this.key(pluginName, localId);
      if (!this._cache[key]) {
        this._cache[key] = new UniqueTraitId(uniqueTraitId, name);
        this._cacheById[uniqueTraitId] = this._cache[key];
        uniqueTraitId++;
      }
      return this._cache[key];
    }
    key(pluginName, localId) {
      return `${pluginName}_${localId}`;
    }
    traitIdOf(pluginName, localId) {
      var _a;
      const key = this.key(pluginName, localId);
      return (_a = this._cache[key]) === null || _a === void 0 ? void 0 : _a.id;
    }
    nameOf(pluginName, localId) {
      var _a;
      const key = this.key(pluginName, localId);
      return (_a = this._cache[key]) === null || _a === void 0 ? void 0 : _a.name;
    }
    nameByTraitId(id) {
      var _a;
      return (_a = this._cacheById[id]) === null || _a === void 0 ? void 0 : _a.name;
    }
  }
  const uniqueTraitIdCache = new UniqueTraitIdCache();
  window.uniqueTraitIdCache = uniqueTraitIdCache;
  class UniqueTraitId {
    constructor(id, name) {
      this._id = id;
      this._name = name;
    }
    get id() {
      return this._id;
    }
    get name() {
      return this._name;
    }
  }
})();
