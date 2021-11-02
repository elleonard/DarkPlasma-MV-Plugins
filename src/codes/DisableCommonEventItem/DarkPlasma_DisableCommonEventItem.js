import { settings } from "./_build/DarkPlasma_DisableCommonEventItem_parameters";

/**
 * @param {Game_BattlerBase.prototype} gameBattler
 */
function Game_BattlerBase_DisableCommonEventItemMixIn(gameBattler) {
  const _meetsUsableItemConditions = gameBattler.meetsUsableItemConditions;
  gameBattler.meetsUsableItemConditions = function(item) {
    const itemHasCommonEvent = hasCommonEvent(item);
    return _meetsUsableItemConditions.call(this, item) && (!itemHasCommonEvent || !$gameSwitches.value(settings.switchId));
  };
}

Game_BattlerBase_DisableCommonEventItemMixIn(Game_BattlerBase.prototype);

/**
 * コモンイベントを発生させる効果を持つアイテム・スキルであるか
 * @param {RPG.UsableItem} item
 * @return {boolean}
 */
function hasCommonEvent(item) {
  return item.effects.some(effect => effect.code === Game_Action.EFFECT_COMMON_EVENT);
}
