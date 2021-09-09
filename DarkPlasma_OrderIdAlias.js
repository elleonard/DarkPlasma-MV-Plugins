// DarkPlasma_OrderIdAlias 2.0.0
// Copyright (c) 2019 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/08/31 2.0.0 rollup構成へ移行
 *                  MOT_ItemFavoriteSort.js との互換性を削除
 * 2020/05/25 1.0.3 装備欄のソート順が壊れる不具合を修正
 * 2019/10/29 1.0.2 装備を外すとエラーになる不具合の修正
 * 2019/08/20 1.0.1 MOT_ItemFavoriteSort.js がない時にエラーになる不具合の修正
 *            1.0.0 公開
 */

/*:ja
 * @plugindesc スキル/アイテムの表示順序IDを書き換える
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 2.0.0
 * アイテムまたはスキルの順序がID順の場合、メモ欄に以下のように記述することで、
 * IDの代わりにその数値を順序として使います。
 * <orderId:xxx> xxxは整数値
 */

(() => {
  'use strict';

  const _extractMetadata = DataManager.extractMetadata;
  DataManager.extractMetadata = function (data) {
    _extractMetadata.call(this, data);
    data.orderId = Number(data.meta.orderId || data.id);
  };

  const _Window_ItemList_makeItemList = Window_ItemList.prototype.makeItemList;
  Window_ItemList.prototype.makeItemList = function () {
    _Window_ItemList_makeItemList.call(this);
    this._data.sort((a, b) => {
      if (a === null && b === null) {
        // 両方nullなら順不同
        return 0;
      } else if (a === null) {
        return 1;
      } else if (b === null) {
        return -1;
      }
      return a.orderId - b.orderId;
    });
  };

  const _Window_SkillList_makeItemList = Window_SkillList.prototype.makeItemList;
  Window_SkillList.prototype.makeItemList = function () {
    _Window_SkillList_makeItemList.call(this);
    this._data.sort((a, b) => a.orderId - b.orderId);
  };
})();
