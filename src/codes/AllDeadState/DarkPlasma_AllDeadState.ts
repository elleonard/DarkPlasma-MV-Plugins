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
