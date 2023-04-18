/// <reference path="./AllDeadState.d.ts" />

import { settings } from "./_build/DarkPlasma_AllDeadState_parameters";

function Game_Party_AllDeadStateMixIn(gameParty: Game_Party) {
  const _isAllDead = gameParty.isAllDead;
  gameParty.isAllDead = function () {
    return _isAllDead.call(this) || this.inBattle() && this.aliveMembers()
      .every(actor => settings.states.some(stateId => actor.isStateAffected(stateId)));
  };
}

Game_Party_AllDeadStateMixIn(Game_Party.prototype);

function Scene_Battle_ReviveMixIn(sceneBattle: Scene_Battle) {
  const _terminate = sceneBattle.terminate;
  sceneBattle.terminate = function () {
    _terminate.call(this);
    /**
     * 不死身かつ、敗北判定ステートにより、HP0かつ戦闘不能でない状態で敗北した場合
     * BattleManager.updateBattleEndの時点では戦闘不能でないため
     * 戦闘不能の解除が働かず、マップ上に出た瞬間に敗北可であろうとゲームオーバーになってしまう
     * この時点で全員戦闘不能かつ敗北可であった場合
     * とりあえず全員復活させる
     */
    if (BattleManager.canLose() && $gameParty.isAllDead()) {
      $gameParty.reviveBattleMembers();
    }
  };
}

Scene_Battle_ReviveMixIn(Scene_Battle.prototype);
