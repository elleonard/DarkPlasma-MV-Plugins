const USABLE_COUNT_TYPE = {
  NUMBER: 0,
  VARIABLE: 1
};

class UsableCountInBattle {
  constructor(type, value) {
    this._type = type;
    this._value = value;
  }

  static fromMeta(meta) {
    const match = /v\[(0-9+)\]/g.exec(meta);
    if (match) {
      return new UsableCountInBattle(USABLE_COUNT_TYPE.VARIABLE, Number(match[1]));
    }
    return new UsableCountInBattle(USABLE_COUNT_TYPE.NUMBER, Number(meta));
  }
  
  isUsable(count) {
    return count < this.usableCount();
  }

  usableCount() {
    return this._type === USABLE_COUNT_TYPE.NUMBER ? this._value : $gameVariables.value(this._value);
  }
}

/**
 * @type {Object.<string, UsableCountInBattle>}
 */
const usableCountInBattle = {};

/**
 * @type {Object.<string, number>}
 */
let useCount = {};

/**
 * @param {RPG.Item|RPG.Skill} data
 * @return {string}
 */
function itemToKey(data) {
  if ($dataItems && DataManager.isItem(data)) {
    return `item_${data.id}`;
  }
  if ($dataSkills && DataManager.isSkill(data)) {
    return `skill_${data.id}`;
  }
  return "";
}

const _DataManager_extractMetadata = DataManager.extractMetadata;
DataManager.extractMetadata = function(data) {
  _DataManager_extractMetadata.call(this, data);
  if (data.meta.usableCountInBattle) {
    const key = itemToKey(data);
    if (key) {
      usableCountInBattle[key] = UsableCountInBattle.fromMeta(data.meta.usableCountInBattle);
    }
  }
};

const _BattleManager_setup = BattleManager.setup;
BattleManager.setup = function(troopId, canEscape, canLose) {
  _BattleManager_setup.call(this, troopId, canEscape, canLose);
  useCount = {};
};

/**
 * @param {Game_BattlerBase.prototype} gameBattler
 */
function Game_BattlerBase_UsableCountMixIn(gameBattler) {
  gameBattler.isUsableCountOk = function(item) {
    const key = itemToKey(item);
    return !$gameParty.inBattle() || !key || !usableCountInBattle[key] || usableCountInBattle[key].isUsable(useCount[key] || 0);
  };

  const _meetsSkillConditions = gameBattler.meetsSkillConditions;
  gameBattler.meetsSkillConditions = function(skill) {
    return _meetsSkillConditions.call(this, skill) && this.isUsableCountOk(skill);
  };

  const _meetsItemConditions = gameBattler.meetsItemConditions;
  gameBattler.meetsItemConditions = function(item) {
    return _meetsItemConditions.call(this, item) && this.isUsableCountOk(item);
  };
}

Game_BattlerBase_UsableCountMixIn(Game_BattlerBase.prototype);
/**
 * @param {Game_Battler.prototype} gameBattler
 */
function Game_Battler_UsableCountMixIn(gameBattler) {
  const _useItem = gameBattler.useItem;
  gameBattler.useItem = function(item) {
    _useItem.call(this, item);
    const key = itemToKey(item);
    if ($gameParty.inBattle() && key) {
      if (!useCount[key]) {
        useCount[key] = 0;
      }
      useCount[key]++;
    }
  };
}

Game_Battler_UsableCountMixIn(Game_Battler.prototype);

const _Window_BattleItem_includes = Window_BattleItem.prototype.includes;
Window_BattleItem.prototype.includes = function (item) {
  return _Window_BattleItem_includes.call(this, item) || !$gameParty.leader().isUsableCountOk(item);
};
