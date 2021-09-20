import { settings } from "./_build/DarkPlasma_SharedSwitchVariable_parameters";

const _StorageManager_localFilePath = StorageManager.localFilePath;
StorageManager.localFilePath = function (savefileId) {
  if (savefileId === settings.savefileId) {
    return `${this.localFileDirectoryPath()}shared.rpgsave`;
  }
  return _StorageManager_localFilePath.call(this, savefileId);
};

const _StorageManager_webStorageKey = StorageManager.webStorageKey;
StorageManager.webStorageKey = function (savefileId) {
  if (savefileId === settings.savefileId) {
    return 'RPG Shared';
  }
  return _StorageManager_webStorageKey.call(this, savefileId);
};

DataManager.makeSharedInfo = function () {
  return {
    switches: this.sharedSaveSwitches(),
    variables: this.sharedSaveVariables(),
  };
};

DataManager.saveSharedInfo = function () {
  StorageManager.save(settings.savefileId, JSON.stringify(this.makeSharedInfo()));
};

DataManager.loadSharedInfo = function () {
  try {
    const json = StorageManager.load(settings.savefileId);
    return json ? JSON.parse(json) : {};
  } catch (e) {
    console.error(e);
    return {};
  }
};

const _DataManager_saveGameWithoutRescue = DataManager.saveGameWithoutRescue;
DataManager.saveGameWithoutRescue = function (savefileId) {
  const result = _DataManager_saveGameWithoutRescue.call(this, savefileId);
  this.saveSharedInfo();
  return result;
};

const _DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function (contents) {
  _DataManager_extractSaveContents.call(this, contents);
  this.extractSharedSaveSwitchesAndVariables();
};

/**
 * グローバルセーブに記録したスイッチ・変数を展開する
 */
DataManager.extractSharedSaveSwitchesAndVariables = function () {
  const sharedInfo = this.loadSharedInfo();
  const sharedSwitches = sharedInfo.switches || [];
  sharedSwitches.forEach(sharedSwitch => {
    $gameSwitches.setValue(sharedSwitch.id, sharedSwitch.value);
  })
  const sharedVariables = sharedInfo.variables || [];
  sharedVariables.forEach(sharedVariable => {
    $gameVariables.setValue(sharedVariable.id, sharedVariable.value);
  })
};

/**
 * 指定した数値から開始する連番の配列を返す
 * @param {number} length 数値
 * @param {number} start 開始数値
 * @return {number[]}
 */
const range = (length, start) => [...Array(length).keys()].map(n => n + start);

/**
 * 共有セーブに保存すべきスイッチのIDと値の組一覧を返す
 * @return {object[]}
 */
DataManager.sharedSaveSwitches = function () {
  return settings.switchRangeList
    .filter(switchRange => switchRange.from <= switchRange.to)
    .map(switchRange => range(switchRange.to - switchRange.from + 1, switchRange.from))
    .flat()
    .map(switchId => {
      return {
        id: switchId,
        value: $gameSwitches.value(switchId)
      };
    });
};

/**
 * 共有セーブに保存すべき変数のIDと値の組一覧を返す
 * @return {object[]}
 */
DataManager.sharedSaveVariables = function () {
  return settings.variableRangeList
    .filter(variableRange => variableRange.from <= variableRange.to)
    .map(variableRange => range(variableRange.to - variableRange.from + 1, variableRange.from))
    .flat()
    .map(variableId => {
      return {
        id: variableId,
        value: $gameVariables.value(variableId)
      };
    });
};

const _DataManager_setupNewGame = DataManager.setupNewGame;
DataManager.setupNewGame = function () {
  _DataManager_setupNewGame.call(this);
  this.extractSharedSaveSwitchesAndVariables();
};

if (!Array.prototype.flat) {
  Array.prototype.flat = function (depth) {
    var flattend = [];
    (function flat(array, depth) {
      for (let el of array) {
        if (Array.isArray(el) && depth > 0) {
          flat(el, depth - 1);
        } else {
          flattend.push(el);
        }
      }
    })(this, Math.floor(depth) || 1);
    return flattend.filter((el) => el);
  };
}
