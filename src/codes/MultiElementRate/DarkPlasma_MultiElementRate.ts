/// <reference path="./MultiElementRate.d.ts" />

import { settings } from "./_build/DarkPlasma_MultiElementRate_parameters";

function Game_Action_MultiElementRateMixIn(gameAction: Game_Action) {
  const _elementsMaxRate = gameAction.elementsMaxRate;
  gameAction.elementsMaxRate = function (target, elements) {
    if (elements.length > 0) {
      return [...new Set(elements)].reduce((previous, current) => {
        return settings.addition ? previous + target.elementRate(current) : previous * target.elementRate(current);
      }, 1);
    } else {
      return _elementsMaxRate.call(this, target, elements);
    }
  };
}

Game_Action_MultiElementRateMixIn(Game_Action.prototype);
