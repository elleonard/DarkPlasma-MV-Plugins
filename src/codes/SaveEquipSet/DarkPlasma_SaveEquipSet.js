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

class Game_EquipSlot {
  /**
   * @param {number} slotId
   * @param {MZ.Weapon | MZ.Armor} item
   */
  constructor(slotId, item) {
    this._slotId = slotId;
    this._item = item;
  }

  get slotId() {
    return this._slotId;
  }

  get item() {
    return this._item;
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
