// DarkPlasma_MemoriesSwitchLoader 1.0.1
// Copyright (c) 2021 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/12/29 1.0.1 rollup構成へ移行
 * 2021/05/05 1.0.0 公開
 */

/*:ja
 * @plugindesc シーン回想 CG閲覧のためのスイッチ読み込み
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @base DarkPlasma_Memories
 * @orderAfter DarkPlasma_Memories
 * @orderAfter DarkPlasma_SharedSwitchVariable
 *
 * @help
 * version: 1.0.1
 * DarkPlasma_Memories プラグインで利用するシーン回想 CG閲覧の
 * 解放条件スイッチのロードロジックを提供します
 * DarkPlasma_SharedSwitchVariable プラグインで記録した
 * 共有セーブデータからロードします
 *
 * 本プラグインの利用には下記プラグインを必要とします。
 * DarkPlasma_Memories version:3.0.0
 * 本プラグインを下記プラグインと共に利用する場合、それよりも下に追加してください。
 * DarkPlasma_Memories
 * DarkPlasma_SharedSwitchVariable
 */

(() => {
  'use strict';

  MemoriesManager.loadSwitches = function () {
    $gameSwitches = new Game_Switches();
    $gameVariables = new Game_Variables();
    DataManager.extractSharedSaveSwitchesAndVariables();

    const result = [];
    $dataSystem.switches.forEach((_, index) => {
      result[index] = $gameSwitches.value(index);
    });
    return result;
  };
})();
