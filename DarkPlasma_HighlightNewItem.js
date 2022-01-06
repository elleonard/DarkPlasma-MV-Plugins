// DarkPlasma_HighlightNewItem 1.0.0
// Copyright (c) 2022 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2022/01/06 1.0.0 公開
 */

/*:ja
 * @plugindesc 新しく入手したアイテムを一覧で強調表示する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param newItemColor
 * @desc 新しく入手したアイテムの色番号
 * @text アイテム色
 * @type number
 * @default 2
 *
 * @help
 * version: 1.0.0
 * メニューの一覧で、新しく入手したアイテムを強調表示します。
 *
 * 強調表示は一度カーソルを合わせて以下の操作をすると元の色に戻ります。
 * - カーソル移動
 * - ページ送り
 * - 決定
 * - キャンセル
 */

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    newItemColor: Number(pluginParameters.newItemColor || 2),
  };

  /**
   * @param {Game_Actor.prototype} gameActor
   */
  function Game_Actor_HighlightNewItemMixIn(gameActor) {
    const _tradeItemWithParty = gameActor.tradeItemWithParty;
    gameActor.tradeItemWithParty = function (newItem, oldItem) {
      const result = _tradeItemWithParty.call(this, newItem, oldItem);
      if (result && oldItem) {
        /**
         * 装備変更後に新アイテムとしてマークされてしまうので強引に触る
         */
        $gameParty.touchItem(oldItem);
      }
      return result;
    };
  }

  Game_Actor_HighlightNewItemMixIn(Game_Actor.prototype);

  /**
   * @param {Game_Party.prototype} gameParty
   */
  function Game_Party_HighlightNewItemMixIn(gameParty) {
    const _initAllItems = gameParty.initAllItems;
    gameParty.initAllItems = function () {
      _initAllItems.call(this);
      this.initializeNewItems();
    };

    gameParty.initializeNewItems = function () {
      this._newItemIds = [];
      this._newWeaponIds = [];
      this._newArmorIds = [];
    };

    const _gainItem = gameParty.gainItem;
    gameParty.gainItem = function (item, amount, includeEquip) {
      _gainItem.call(this, item, amount, includeEquip);
      if (item) {
        if (amount > 0) {
          this.addNewItems(item);
        } else {
          this.touchItem(item);
        }
      }
    };

    /**
     * @param {RPG.Item | RPG.Weapon | RPG.Armor} item アイテムデータ
     */
    gameParty.touchItem = function (item) {
      if (DataManager.isItem(item)) {
        if (!this._newItemIds) {
          this._newItemIds = [];
        }
        this._newItemIds = this._newItemIds.filter((id) => id && id !== item.id);
      } else if (DataManager.isWeapon(item)) {
        if (!this._newWeaponIds) {
          this._newWeaponIds = [];
        }
        this._newWeaponIds = this._newWeaponIds.filter((id) => id && id !== item.id);
      } else if (DataManager.isArmor(item)) {
        if (!this._newArmorIds) {
          this._newArmorIds = [];
        }
        this._newArmorIds = this._newArmorIds.filter((id) => id && id !== item.id);
      }
    };

    /**
     * @param {RPG.Item | RPG.Weapon | RPG.Armor} item アイテムデータ
     */
    gameParty.addNewItems = function (item) {
      if (item.itypeId >= 3 || this.hasItemAsNew(item)) {
        return;
      }
      if (DataManager.isItem(item)) {
        this._newItemIds.push(item.id);
      } else if (DataManager.isWeapon(item)) {
        this._newWeaponIds.push(item.id);
      } else if (DataManager.isArmor(item)) {
        this._newArmorIds.push(item.id);
      }
    };

    /**
     * @param {RPG.Item | RPG.Weapon | RPG.Armor} item アイテムデータ
     * @return {boolean}
     */
    gameParty.hasItemAsNew = function (item) {
      const newItemIds = DataManager.isItem(item)
        ? this.newItemIds()
        : DataManager.isWeapon(item)
        ? this.newWeaponIds()
        : this.newArmorIds();
      return this.hasItem(item, false) && newItemIds.includes(item.id);
    };

    gameParty.newItemIds = function () {
      if (!this._newItemIds) {
        this._newItemIds = [];
      }
      return this._newItemIds;
    };

    gameParty.newWeaponIds = function () {
      if (!this._newWeaponIds) {
        this._newWeaponIds = [];
      }
      return this._newWeaponIds;
    };

    gameParty.newArmorIds = function () {
      if (!this._newArmorIds) {
        this._newArmorIds = [];
      }
      return this._newArmorIds;
    };
  }

  Game_Party_HighlightNewItemMixIn(Game_Party.prototype);

  /**
   * @param {Window_ItemList.prototype} windowClass
   */
  function Window_ItemList_HighlightNewItemMixIn(windowClass) {
    const _initialize = windowClass.initialize;
    windowClass.initialize = function (x, y, width, height) {
      _initialize.call(this, x, y, width, height);
      this._touchRequestedItem = null;
    };

    /**
     * 触るリクエスト
     * カーソルを合わせて即触ってしまうと、色が即座に変わってわかりにくいため、1操作分待つ
     * @param {RPG.Item | RPG.Weapon | RPG.Armor} item
     */
    windowClass.requestTouch = function (item) {
      this.processTouchRequest();
      if (item && this.isNewItem(item)) {
        this._touchRequestedItem = item;
      }
    };

    windowClass.processTouchRequest = function () {
      if (this._touchRequestedItem) {
        $gameParty.touchItem(this._touchRequestedItem);
        this._touchRequestedItem = null;
        this.refresh();
      }
    };

    const _processOk = windowClass.processOk;
    windowClass.processOk = function () {
      _processOk.call(this);
      this.processTouchRequest();
    };

    const _processCancel = windowClass.processCancel;
    windowClass.processCancel = function () {
      _processCancel.call(this);
      this.processTouchRequest();
    };

    const _processPageDown = windowClass.processPagedown;
    windowClass.processPagedown = function () {
      _processPageDown.call(this);
      this.processTouchRequest();
    };

    const _processPageup = windowClass.processPageup;
    windowClass.processPageup = function () {
      _processPageup.call(this);
      this.processTouchRequest();
    };

    const _drawItemName = windowClass.drawItemName;
    windowClass.drawItemName = function (item, x, y, width) {
      if (this.isNewItem(item)) {
        this.drawNewItemName(item, x, y, width);
      } else {
        _drawItemName.call(this, item, x, y, width);
      }
    };

    /**
     * 新しいアイテムを描画する
     * 色を変えるため、描画中は resetTextColor を上書きする
     * @param {RPG.Item | RPG.Weapon | RPG.Armor} item アイテムデータ
     * @param {number} x X座標
     * @param {number} y Y座標
     * @param {number} width 幅
     */
    windowClass.drawNewItemName = function (item, x, y, width) {
      const resetTextColor = this.resetTextColor;
      this.resetTextColor = () => {};
      this.changeTextColor(this.textColor(settings.newItemColor));
      _drawItemName.call(this, item, x, y, width);
      this.resetTextColor = resetTextColor;
      this.resetTextColor();
    };

    /**
     * @param {RPG.Item | RPG.Weapon | RPG.Armor} item
     * @return {boolean}
     */
    windowClass.isNewItem = function (item) {
      return $gameParty.hasItemAsNew(item);
    };

    const _select = windowClass.select;
    windowClass.select = function (index) {
      _select.call(this, index);
      this.requestTouch(this.item());
    };
  }

  Window_ItemList_HighlightNewItemMixIn(Window_ItemList.prototype);
})();
