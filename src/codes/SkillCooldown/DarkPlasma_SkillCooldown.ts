/// <reference path="./SkillCooldown.d.ts" />

import { settings } from "./_build/DarkPlasma_SkillCooldown_parameters";

class SkillCooldown {
  _skillId: number;
  _turnCount: number;
  /**
   * @param {number} skillId スキルID
   * @param {number} turnCount ターン数
   */
  constructor(skillId: number, turnCount: number) {
    this._skillId = skillId;
    this._turnCount = turnCount;
  }

  /**
   * @param {number} triggerSkillId トリガースキルID
   * @return {SkillCooldown[]}
   */
  static setup(triggerSkillId: number): SkillCooldown[] {
    const cooldownSetting = settings.skillCooldowns.find(cooldown => cooldown.triggerSkillId === triggerSkillId);
    /**
     * メモ欄による設定
     */
    const result: SkillCooldown[] = [];
    if ($dataSkills[triggerSkillId].meta.cooldownTurn) {
      result.push(new SkillCooldown(triggerSkillId, Number($dataSkills[triggerSkillId].meta.cooldownTurn) + 1));
    }
    /**
     * プラグインパラメータによる設定
     */
    return result.concat(cooldownSetting
      ? cooldownSetting.targets.map(target => new SkillCooldown(target.skillId, target.turnCount + $gameVariables.value(target.turnCountVariable) + 1))
      : []);
  }

  /**
   * @return {number}
   */
  get skillId(): number {
    return this._skillId;
  }

  /**
   * @return {number}
   */
  get turnCount(): number {
    return this._turnCount;
  }

  /**
   * @return {boolean}
   */
  isFinished(): boolean {
    return this._turnCount <= 0;
  }

  /**
   * ターンカウントを進める
   */
  decreaseTurn() {
    this._turnCount--;
    if (this._turnCount < 0) {
      this._turnCount = 0;
    }
  }
}

/**
 * スキルクールタイムの管理
 */
class SkillCooldownManager {
  _actorsSkillCooldowns: SkillCooldown[][];
  _enemysSkillCooldowns: SkillCooldown[][];
  _lastDecreasedTurn: number;

  constructor() {
    /**
     * @type {SkillCooldown[][]}
     */
    this._actorsSkillCooldowns = [];

    /**
     * @type {SkillCooldown[][]}
     */
    this._enemysSkillCooldowns = [];

    /**
     * @type {number}
     */
    this._lastDecreasedTurn = 0;
  }

  /**
   * 初期化する。戦闘開始時に呼び出される
   */
  initialize() {
    $gameParty.allMembers().forEach(actor => {
      this._actorsSkillCooldowns[actor.actorId()] = [];
    });
    $gameTroop.members().forEach(enemy => {
      this._enemysSkillCooldowns[enemy.index()] = [];
    });
    this._lastDecreasedTurn = 0;
  }

  /**
   * @param {number} actorId
   * @return {SkillCooldown[]}
   */
  actorsCooldowns(actorId: number): SkillCooldown[] {
    if (!this._actorsSkillCooldowns[actorId]) {
      this._actorsSkillCooldowns[actorId] = [];
    }
    return this._actorsSkillCooldowns[actorId];
  }

  /**
   * @param {number} index
   * @return {SkillCooldown[]}
   */
  enemysCooldowns(index: number): SkillCooldown[] {
    if (!this._enemysSkillCooldowns[index]) {
      this._enemysSkillCooldowns[index] = [];
    }
    return this._enemysSkillCooldowns[index];
  }

  /**
   * クールダウン開始
   * @param {number} id アクターIDorエネミーのindex
   * @param {RPG.Skill} skill スキルデータ
   * @param {boolean} isActor
   */
  setupCooldownTurn(id: number, skill: RPG.Skill, isActor: boolean) {
    const targetCooldowns = isActor ? this.actorsCooldowns(id) : this.enemysCooldowns(id);
    const cooldowns = SkillCooldown.setup(skill.id);
    cooldowns.forEach(cooldown => {
      targetCooldowns[cooldown.skillId] = cooldown;
    });
  }

  /**
   * クールダウン中かどうか
   * @param {number} id アクターIDorエネミーのindex
   * @param {RPG.Skill} skill スキルデータ
   * @param {boolean} isActor
   * @return {boolean}
   */
  isDuringCooldown(id: number, skill: RPG.Skill, isActor: boolean): boolean {
    const targetCooldowns = isActor ? this.actorsCooldowns(id) : this.enemysCooldowns(id);
    const cooldown = targetCooldowns[skill.id];
    return cooldown ? !cooldown.isFinished() : false;
  }

  /**
   * 残りクールダウンターン数を返す
   * @param {number} id アクターIDorエネミーのindex
   * @param {RPG.Skill} skill スキルデータ
   * @param {boolean} isActor
   * @return {number}
   */
  cooldownTurn(id: number, skill: RPG.Skill, isActor: boolean): number {
    const targetCooldowns = isActor ? this.actorsCooldowns(id) : this.enemysCooldowns(id);
    const cooldown = targetCooldowns[skill.id];
    return cooldown ? cooldown.turnCount : 0;
  }

  /**
   * すべてのクールダウンターン数を進める
   */
  decreaseCooldownTurns() {
    if (this._lastDecreasedTurn === $gameTroop.turnCount()) {
      return;
    }
    this._lastDecreasedTurn = $gameTroop.turnCount();
    const actorsCooldowns = settings.decreaseBenchwarmersCooldown
      ? this._actorsSkillCooldowns
      : this._actorsSkillCooldowns.filter((_, actorId) => $gameActors.actor(actorId).isBattleMember());
    const cooldowns = actorsCooldowns.flat()
      .concat(this._enemysSkillCooldowns.flat());
    cooldowns.forEach(cooldown => cooldown.decreaseTurn());
  }
}

const skillCooldownManager = new SkillCooldownManager();

const _BattleManager_startBattle = BattleManager.startBattle;
BattleManager.startBattle = function () {
  _BattleManager_startBattle.call(this);
  skillCooldownManager.initialize();
};

const _BattleManager_endTurn = BattleManager.endTurn;
BattleManager.endTurn = function () {
  _BattleManager_endTurn.call(this);
  skillCooldownManager.decreaseCooldownTurns();
};

/**
 * @param {Game_BattlerBase.prototype} gameBattlerBase
 */
function Game_BattlerBase_SkillCooldownMixIn(gameBattlerBase: Game_BattlerBase) {
  const _meetsSkillConditions = gameBattlerBase.meetsSkillConditions;
  gameBattlerBase.meetsSkillConditions = function (skill) {
    return _meetsSkillConditions.call(this, skill) && !this.isDuringCooldown(skill);
  };

  /**
   * スキルクールタイムを開始する
   * @param {RPG.Skill} skill スキルデータ
   */
  gameBattlerBase.setupCooldownTurn = function (skill) {
    skillCooldownManager.setupCooldownTurn(this.skillCooldownId(), skill, this.isActor());
  };

  /**
   * @param {RPG.Skill} skill スキルデータ
   * @return {boolean}
   */
  gameBattlerBase.isDuringCooldown = function (skill) {
    return skillCooldownManager.isDuringCooldown(this.skillCooldownId(), skill, this.isActor());
  };

  /**
   * @param {RPG.Skill} skill スキルデータ
   * @return {boolean}
   */
  gameBattlerBase.cooldownTurn = function (skill) {
    return skillCooldownManager.cooldownTurn(this.skillCooldownId(), skill, this.isActor());
  };

  /**
   * スキルクールダウンの管理に使うID
   * @return {number}
   */
  gameBattlerBase.skillCooldownId = function () {
    return 0;
  };
};

Game_BattlerBase_SkillCooldownMixIn(Game_BattlerBase.prototype);

function Game_Battler_SkillCooldownMixIn(gameBattler: Game_Battler) {
  const _useItem = gameBattler.useItem;
  gameBattler.useItem = function (item) {
    _useItem.call(this, item);
    if (DataManager.isSkill(item) && $gameParty.inBattle()) {
      this.setupCooldownTurn(item);
    }
  };
}

Game_Battler_SkillCooldownMixIn(Game_Battler.prototype);

function Game_Actor_SkillCooldownMixIn(gameActor: Game_Actor) {
  gameActor.skillCooldownId = function () {
    return this.actorId();
  };
}

Game_Actor_SkillCooldownMixIn(Game_Actor.prototype);

function Game_Enemy_SkillCooldownMixIn(gameEnemy: Game_Enemy) {
  gameEnemy.skillCooldownId = function () {
    return this.index();
  };
}

Game_Enemy_SkillCooldownMixIn(Game_Enemy.prototype);

function Window_SkillList_SkillCooldownMixIn(windowClass: Window_SkillList) {
  const _drawSkillCost = windowClass.drawSkillCost;
  windowClass.drawSkillCost = function (this: Window_SkillList, skill, x, y, width) {
    if ($gameParty.inBattle() && settings.displayCooldown && this._actor.isDuringCooldown(skill)) {
      const cooldownText = settings.cooldownFormat.replace(/\{turn\}/gi, `${this._actor.cooldownTurn(skill)}`);
      this.changeTextColor(this.textColor(settings.cooldownColor));
      this.drawText(cooldownText, x, y, width, 'right');
    } else {
      _drawSkillCost.call(this, skill, x, y, width);
    }
  };
}

Window_SkillList_SkillCooldownMixIn(Window_SkillList.prototype);

if (!Array.prototype.flat) {
  function flatDeep<T>(arr: T[], d = 1): T[] {
    return d > 0
      ? arr.reduce((acc: T[], val: T) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
      : arr.slice();
  }
  Array.prototype.flat = function<A, D> (depth?: D) {
    return flatDeep<A>(this, Infinity);
  };
}
