// DarkPlasma_SaveEquipSet 1.0.1
// Copyright (c) 2022 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2022/07/23 1.0.1 セーブデータを正しくロードできない不具合を修正
 * 2022/04/23 1.0.0 公開
 */

/*:ja
 * @plugindesc パーティメンバーの装備セットを記録する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 1.0.1
 * パーティメンバーの装備セットを記録し、復元するプラグインコマンドを提供します。
 *
 * 以下に該当する場合、復元時にその装備は無視され、復元されません。
 * - 記録したセットの中に手放した装備がある
 * - 記録したセットの中に装備不可な装備がある
 *
 * プラグインコマンド
 * saveEquipSet
 * 現在のパーティメンバーの装備セットを記録します。
 *
 * loadEquipSet
 * 記録した装備セットを現在のパーティメンバーに復元します。
 */

(() => {
  'use strict';

  /**
   * @param {Game_Interpreter.prototype} gameInterpreter
   */
  function Game_Interpreter_SaveEquipSetMixIn(gameInterpreter) {
    const _pluginCommand = gameInterpreter.pluginCommand;
    gameInterpreter.pluginCommand = function (command, args) {
      _pluginCommand.call(this, command, args);
      if (command === 'saveEquipSet') {
        $gameParty.allMembers().forEach((actor) => actor.saveEquipSet());
      } else if (command === 'loadEquipSet') {
        /**
         * 全員の装備を外してから、所持しているものの中で記録を復元する
         */
        $gameParty.allMembers().forEach((actor) => actor.clearEquipments());
        $gameParty.allMembers().forEach((actor) => actor.loadEquipSet());
      }
    };
  }

  Game_Interpreter_SaveEquipSetMixIn(Game_Interpreter.prototype);

  const KIND = {
    ITEM: 1,
    WEAPON: 2,
    ARMOR: 3,
  };

  class Game_EquipSlot {
    /**
     * @param {number} slotId
     * @param {RPG.Weapon | RPG.Armor} item
     */
    constructor(slotId, item) {
      this._slotId = slotId;
      this.initIdAndKind(item);
    }

    get slotId() {
      return this._slotId;
    }

    get item() {
      /**
       * 旧バージョンのセーブデータ救済
       */
      if (this._item || this._item === null) {
        this.initIdAndKind(this._item);
      }
      if (this._itemId === null) {
        return null;
      }
      switch (this._kind) {
        case KIND.ITEM:
          return $dataItems[this._itemId];
        case KIND.WEAPON:
          return $dataWeapons[this._itemId];
        case KIND.ARMOR:
          return $dataArmors[this._itemId];
        default:
          throw Error(`不正なアイテム種別です: ${this._kind} ${this._itemId}`);
      }
    }

    /**
     *
     * @param {RPG.Weapon | RPG.Armor} item
     */
    initIdAndKind(item) {
      this._itemId = item ? item.id : null;
      this._kind = item
        ? (() => {
            if (DataManager.isItem(item)) {
              /**
               * アイテムを装備する系システムにふわっと対応
               */
              return KIND.ITEM;
            } else if (DataManager.isWeapon(item)) {
              return KIND.WEAPON;
            } else if (DataManager.isArmor(item)) {
              return KIND.ARMOR;
            } else {
              /**
               * 武器と防具のみ、1.0.0のセーブデータに対応
               */
              if (item.etypeId === 1) {
                return KIND.WEAPON;
              } else if (item.etypeId > 1) {
                return KIND.ARMOR;
              }
            }
            throw Error(`不正な装備です: ${item.name}`);
          })()
        : null;
      delete this._item;
    }
  }

  window.Game_EquipSlot = Game_EquipSlot;

  /**
   * @param {Game_Actor.prototype} gameActor
   */
  function Game_Actor_SaveEquipSetMixIn(gameActor) {
    gameActor.saveEquipSet = function () {
      this._equipSet = this.equips().map((equip, slotId) => new Game_EquipSlot(slotId, equip));
    };

    gameActor.loadEquipSet = function () {
      if (this._equipSet) {
        this._equipSet
          .filter(
            (equipSlot) =>
              $gameParty.hasItem(equipSlot.item) &&
              this.canEquip(equipSlot.item) &&
              this.isEquipChangeOk(equipSlot.slotId)
          )
          .forEach((equipSlot) => this.changeEquip(equipSlot.slotId, equipSlot.item));
      }
    };
  }

  Game_Actor_SaveEquipSetMixIn(Game_Actor.prototype);
})();
