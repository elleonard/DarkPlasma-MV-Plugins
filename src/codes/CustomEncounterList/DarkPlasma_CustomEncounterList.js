import { settings } from "./_build/DarkPlasma_CustomEncounterList_parameters";

/**
 * DataManager
 */
const _DataManager_extractMetadata = DataManager.extractMetadata;
DataManager.extractMetadata = function (data) {
  _DataManager_extractMetadata.call(this, data);
  if (data === $dataMap) {
    $dataMap.customEncounterList = data.meta.customEncounter ? data.meta.customEncounter.split(',').map(id => Number(id)) : [];
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
    const setting = settings.encounters
      .find(encounterSetting => $dataMap.customEncounterList.includes(encounterSetting.id)
        && $gameSwitches.value(encounterSetting.conditionSwitch));
    return setting ? setting.list : null;
  }
}
