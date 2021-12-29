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
