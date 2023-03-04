/// <reference path="../../typings/rmmv.d.ts" />

declare interface Game_BattlerBase {
  setupCooldownTurn(skill: RPG.Skill): void;
  isDuringCooldown(skill: RPG.Skill): boolean;
  cooldownTurn(skill: RPG.Skill): number;
  skillCooldownId(): number;
}
