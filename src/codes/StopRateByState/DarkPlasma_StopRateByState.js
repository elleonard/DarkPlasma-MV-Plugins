import { settings } from "./_build/DarkPlasma_StopRateByState_parameters";

const _BattleManager_proessTurn = BattleManager.processTurn;
BattleManager.processTurn = function () {
  if (this._subject.currentAction()) {
    const stopAfterInputState = this._subject.stopAfterInputState();
    if (stopAfterInputState) {
      this._subject.clearActions();
      this._logWindow.displayStopAfterInput(this._subject, stopAfterInputState);
    }
  }
  _BattleManager_proessTurn.call(this);
};

/**
 * @return {RPG.State|undefined}
 */
Game_Battler.prototype.stopAfterInputState = function () {
  const state = this.states().find(state => state.meta.stopRate && Math.randomInt(100) < Number(state.meta.stopRate));
  return state;
};

/**
 * @param {Game_Battler} subject
 * @param {RPG.State} state
 */
Window_BattleLog.prototype.displayStopAfterInput = function (subject, state) {
  const text = state.meta.stopText || settings.defaultStopText;
  this.push('addText', text.format(subject.name()));
  this.push('clear');
};
