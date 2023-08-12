/// <reference path="../../typings/rmmv.d.ts" />

declare interface Game_BattlerBase {
  isSwapParamStateAffected(paramId): boolean;
  paramAlias(paramId): number;
  swapParamState(paramId): RPG.State|undefined;
}
