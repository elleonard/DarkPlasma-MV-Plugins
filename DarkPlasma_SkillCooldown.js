// DarkPlasma_SkillCooldown 2.1.0
// Copyright (c) 2020 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2023/03/05 2.1.0 メモ欄による設定をサポート
 *                  typescript移行
 *                  デフォルト言語を設定
 * 2021/11/27 2.0.1 アクターのクールタイムが共有される不具合を修正
 *                  アクターのクールタイムが戦闘終了で初期化されない不具合を修正
 * 2021/11/14 2.0.0 rollup構成へ移行
 * 2021/11/12 1.2.1 戦闘中にパーティメンバーを変更するとエラーが発生する不具合を修正
 * 2021/03/01 1.2.0 クールタイムに変数を利用する機能を追加
 * 2020/05/07 1.1.0 クールタイムがセーブデータに含まれる不具合を修正
 *                  控えメンバーのクールタイムに関する設定を追加
 * 2020/04/24 1.0.0 公開
 */

/*:
 * @plugindesc スキルにクールタイムを指定する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param skillCooldowns
 * @text スキルクールタイム
 * @type struct<SkillCooldown>[]
 * @default []
 *
 * @param displayCooldown
 * @desc ONの場合、スキル消費の代わりにクールタイムを表示します。
 * @text クールタイム表示
 * @type boolean
 * @default true
 *
 * @param cooldownFormat
 * @desc スキルクールタイムの表示形式を設定します。{turn}がターン数に置き換えられます。
 * @text クールタイム表示形式
 * @type string
 * @default CT:{turn}
 *
 * @param cooldownColor
 * @desc スキルクールタイムの表示色を設定します。
 * @text クールタイム色
 * @type number
 * @default 2
 *
 * @param decreaseBenchwarmersCooldown
 * @desc ONの場合、控えメンバーのクールタイムも進めます。
 * @text 控えクールタイム減
 * @type boolean
 * @default true
 *
 * @help
 * version: 2.1.0
 * スキルにクールタイムを指定します。
 * バトラーがスキルXを使用した後、
 * そのバトラーのスキルYの使用を一定ターン数制限することができます。
 *
 * バトラーがスキルXを使用した後、
 * そのバトラーのスキルX自体の使用をxターン数制限する場合、
 * スキルのメモ欄でも設定可能です。
 * <cooldownTurn:x>
 */
/*~struct~SkillCooldown:
 * @param triggerSkillId
 * @desc クールタイムを発生させるトリガーとなるスキルを設定します。
 * @text トリガースキル
 * @type skill
 *
 * @param targets
 * @desc クールタイムを発生させる対象を設定します。
 * @text 対象
 * @type struct<SkillCooldownTarget>[]
 * @default []
 */
/*~struct~SkillCooldownTarget:
 * @param skillId
 * @desc クールタイムを発生させる対象となるスキルを指定します。
 * @text スキル
 * @type skill
 *
 * @param turnCount
 * @desc クールタイムのターン数を定数で設定します。
 * @text ターン数(定数)
 * @type number
 * @default 3
 *
 * @param turnCountVariable
 * @desc クールタイムのターン数を変数で設定します。定数で指定した値に対して、変数の値を加算します。
 * @text ターン数(変数)
 * @type variable
 * @default 0
 */
(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    skillCooldowns: JSON.parse(pluginParameters.skillCooldowns || '[]').map((e) => {
      return ((parameter) => {
        const parsed = JSON.parse(parameter);
        return {
          triggerSkillId: Number(parsed.triggerSkillId || 0),
          targets: JSON.parse(parsed.targets || '[]').map((e) => {
            return ((parameter) => {
              const parsed = JSON.parse(parameter);
              return {
                skillId: Number(parsed.skillId || 0),
                turnCount: Number(parsed.turnCount || 3),
                turnCountVariable: Number(parsed.turnCountVariable || 0),
              };
            })(e || '{}');
          }),
        };
      })(e || '{}');
    }),
    displayCooldown: String(pluginParameters.displayCooldown || true) === 'true',
    cooldownFormat: String(pluginParameters.cooldownFormat || 'CT:{turn}'),
    cooldownColor: Number(pluginParameters.cooldownColor || 2),
    decreaseBenchwarmersCooldown: String(pluginParameters.decreaseBenchwarmersCooldown || true) === 'true',
  };

  class SkillCooldown {
    /**
     * @param {number} skillId スキルID
     * @param {number} turnCount ターン数
     */
    constructor(skillId, turnCount) {
      this._skillId = skillId;
      this._turnCount = turnCount;
    }
    /**
     * @param {number} triggerSkillId トリガースキルID
     * @return {SkillCooldown[]}
     */
    static setup(triggerSkillId) {
      const cooldownSetting = settings.skillCooldowns.find((cooldown) => cooldown.triggerSkillId === triggerSkillId);
      /**
       * メモ欄による設定
       */
      const result = [];
      if ($dataSkills[triggerSkillId].meta.cooldownTurn) {
        result.push(new SkillCooldown(triggerSkillId, Number($dataSkills[triggerSkillId].meta.cooldownTurn) + 1));
      }
      /**
       * プラグインパラメータによる設定
       */
      return result.concat(
        cooldownSetting
          ? cooldownSetting.targets.map(
              (target) =>
                new SkillCooldown(target.skillId, target.turnCount + $gameVariables.value(target.turnCountVariable) + 1)
            )
          : []
      );
    }
    /**
     * @return {number}
     */
    get skillId() {
      return this._skillId;
    }
    /**
     * @return {number}
     */
    get turnCount() {
      return this._turnCount;
    }
    /**
     * @return {boolean}
     */
    isFinished() {
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
      $gameParty.allMembers().forEach((actor) => {
        this._actorsSkillCooldowns[actor.actorId()] = [];
      });
      $gameTroop.members().forEach((enemy) => {
        this._enemysSkillCooldowns[enemy.index()] = [];
      });
      this._lastDecreasedTurn = 0;
    }
    /**
     * @param {number} actorId
     * @return {SkillCooldown[]}
     */
    actorsCooldowns(actorId) {
      if (!this._actorsSkillCooldowns[actorId]) {
        this._actorsSkillCooldowns[actorId] = [];
      }
      return this._actorsSkillCooldowns[actorId];
    }
    /**
     * @param {number} index
     * @return {SkillCooldown[]}
     */
    enemysCooldowns(index) {
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
    setupCooldownTurn(id, skill, isActor) {
      const targetCooldowns = isActor ? this.actorsCooldowns(id) : this.enemysCooldowns(id);
      const cooldowns = SkillCooldown.setup(skill.id);
      cooldowns.forEach((cooldown) => {
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
    isDuringCooldown(id, skill, isActor) {
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
    cooldownTurn(id, skill, isActor) {
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
      const cooldowns = actorsCooldowns.flat().concat(this._enemysSkillCooldowns.flat());
      cooldowns.forEach((cooldown) => cooldown.decreaseTurn());
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
  function Game_BattlerBase_SkillCooldownMixIn(gameBattlerBase) {
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
  }
  Game_BattlerBase_SkillCooldownMixIn(Game_BattlerBase.prototype);
  function Game_Battler_SkillCooldownMixIn(gameBattler) {
    const _useItem = gameBattler.useItem;
    gameBattler.useItem = function (item) {
      _useItem.call(this, item);
      if (DataManager.isSkill(item) && $gameParty.inBattle()) {
        this.setupCooldownTurn(item);
      }
    };
  }
  Game_Battler_SkillCooldownMixIn(Game_Battler.prototype);
  function Game_Actor_SkillCooldownMixIn(gameActor) {
    gameActor.skillCooldownId = function () {
      return this.actorId();
    };
  }
  Game_Actor_SkillCooldownMixIn(Game_Actor.prototype);
  function Game_Enemy_SkillCooldownMixIn(gameEnemy) {
    gameEnemy.skillCooldownId = function () {
      return this.index();
    };
  }
  Game_Enemy_SkillCooldownMixIn(Game_Enemy.prototype);
  function Window_SkillList_SkillCooldownMixIn(windowClass) {
    const _drawSkillCost = windowClass.drawSkillCost;
    windowClass.drawSkillCost = function (skill, x, y, width) {
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
    function flatDeep(arr, d = 1) {
      return d > 0
        ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
        : arr.slice();
    }
    Array.prototype.flat = function (depth) {
      return flatDeep(this, Infinity);
    };
  }
})();
