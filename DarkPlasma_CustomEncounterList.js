// DarkPlasma_CustomEncounterList 1.0.0
// Copyright (c) 2021 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/09/05 1.0.0 公開
 */

/*:ja
 * @plugindesc エンカウントを変数やスイッチで変更する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param encounters
 * @text エンカウント設定一覧
 * @type struct<EncounterSetting>[]
 * @default []
 *
 * @help
 * version: 1.0.0
 * マップごとにエンカウント設定を複数行うことができます。
 *
 * マップのメモ欄に <customEncounter:e1,e2,e3,...> と指定します。
 *
 * 設定例:
 *   <customEncounter:1>
 *   ID:1の設定を対象マップに適用します。
 *   ID:1設定のスイッチがONの場合、
 *   マップに直接指定したエンカウント設定は無効になり、ID:1の設定が適用されます。
 *
 *   <customEncounter:2,3>
 *   ID:2及び3の設定を対象マップに適用します。
 *   ID:2設定のスイッチがONの場合、ID:2の設定が適用されます。
 *   ID:3設定のスイッチがONの場合、Id:3の設定が適用されます。
 *   ID:2と3両方がONの場合、ID:2の設定が優先されます。
 */
/*~struct~EncounterSetting:
 * @param id
 * @desc エンカウント設定ID。マップのメモ欄に設定します。重複しないようにしてください
 * @text ID
 * @type number
 * @default 1
 *
 * @param list
 * @text エンカウント一覧
 * @type struct<Encounter>[]
 * @default []
 *
 * @param conditionSwitch
 * @desc このスイッチがONの場合にエンカウント設定が有効になります
 * @text スイッチ条件
 * @type switch
 * @default 0
 */
/*~struct~Encounter:
 * @param troopId
 * @text 敵グループ
 * @type troop
 * @default 0
 *
 * @param weight
 * @text 重み
 * @type number
 * @default 5
 *
 * @param regionSet
 * @text 出現範囲
 * @type number[]
 * @default []
 */
(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    encounters: JSON.parse(pluginParameters.encounters || '[]').map((e) => {
      return ((parameter) => {
        const parsed = JSON.parse(parameter);
        return {
          id: Number(parsed.id || 1),
          list: JSON.parse(parsed.list || '[]').map((e) => {
            return ((parameter) => {
              const parsed = JSON.parse(parameter);
              return {
                troopId: Number(parsed.troopId || 0),
                weight: Number(parsed.weight || 5),
                regionSet: JSON.parse(parsed.regionSet || '[]').map((e) => {
                  return Number(e || 0);
                }),
              };
            })(e || '{}');
          }),
          conditionSwitch: Number(parsed.conditionSwitch || 0),
        };
      })(e || '{}');
    }),
  };

  /**
   * DataManager
   */
  const _DataManager_extractMetadata = DataManager.extractMetadata;
  DataManager.extractMetadata = function (data) {
    _DataManager_extractMetadata.call(this, data);
    if (data === $dataMap) {
      $dataMap.customEncounterList = data.meta.customEncounter
        ? data.meta.customEncounter.split(',').map((id) => Number(id))
        : [];
    }
  };

  Game_Map = class extends Game_Map {
    encounterList() {
      const result = this.enabledCustomEncounterList();
      return result ? result : super.encounterList();
    }

    /**
     * 有効なエンカウント一覧を取得する
     * @return {RPG.Map.Encounter[]|null}
     */
    enabledCustomEncounterList() {
      const setting = settings.encounters.find(
        (encounterSetting) =>
          $dataMap.customEncounterList.includes(encounterSetting.id) &&
          $gameSwitches.value(encounterSetting.conditionSwitch)
      );
      return setting ? setting.list : null;
    }
  };
})();
