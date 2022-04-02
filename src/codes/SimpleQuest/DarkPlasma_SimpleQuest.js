import { settings } from "./_build/DarkPlasma_SimpleQuest_parameters";

const QUEST_STATE = {
  NONE: 0,
  ORDERING: 1,
  COMPLETED: 2,
};

/**
 * @param {DataManager} dataManager
 */
function DataManager_QuestMixIn(dataManager) {
  const _createGameObjects = dataManager.createGameObjects;
  dataManager.createGameObjects = function () {
    _createGameObjects.call(this);
    $gameQuests = new Game_Quests();
  };

  const _makeSaveContents = dataManager.makeSaveContents;
  dataManager.makeSaveContents = function () {
    const contents = _makeSaveContents.call(this);
    contents.quests = $gameQuests;
    return contents;
  };

  const _extractSaveContents = dataManager.extractSaveContents;
  dataManager.extractSaveContents = function (contents) {
    _extractSaveContents.call(this, contents);
    $gameQuests = contents.quests || new Game_Quests();
  };
}

DataManager_QuestMixIn(DataManager);

class Data_Quest {
  /**
   * @param {number} id 
   * @param {string} title 
   * @param {string} client 
   * @param {string} description 
   * @param {Data_QuestReward} reward 
   * @param {Data_QuestConditions} conditions 
   */
  constructor(id, title, client, description, reward, conditions) {
    this._id = id;
    this._title = title;
    this._client = client;
    this._description = description;
    this._reward = reward;
    this._conditions = conditions;
  }

  get id() {
    return this._id;
  }

  get title() {
    return this._title;
  }

  get client() {
    return this._client;
  }

  get description() {
    return this._description;
  }

  get reward() {
    return this._reward;
  }

  isVisible() {
    return this._conditions.isEnabled() && !$gameQuests.isCompleted(this._id);
  }

  isEnabled() {
    return this.isVisible() && !$gameQuests.isOrdering(this._id);
  }

  isInProgress() {
    return this.isVisible() && $gameQuests.isOrdering(this._id);
  }
}

class Data_QuestReward {
  /**
   * @param {RPG.Item[]} items
   * @param {RPG.Weapon[]} weapons
   * @param {RPG.Armor[]} armors
   * @param {string} text
   * @param {number} commonEvent
   */
  constructor(items, weapons, armors, text, commonEvent) {
    this._items = items;
    this._weapons = weapons;
    this._armors = armors;
    this._text = text;
    this._commonEvent = commonEvent;
  }

  get items() {
    return this._items;
  }

  get weapons() {
    return this._weapons;
  }

  get armors() {
    return this._armors;
  }

  get text() {
    return this._text;
  }

  /**
   * 報酬を獲得する
   */
  gain() {
    this._items
      .concat(this._weapons)
      .concat(this._armors)
      .forEach(item => $gameParty.gainItem(item, 1));
    if (this._commonEvent) {
      $gameTemp.reserveCommonEvent(this._commonEvent);
    }
  }
}

class Data_QuestConditions {
  constructor() {
    this._switches = [];
    this._variableConditions = [];
  }

  /**
   * @param {number} switchId
   */
  addSwitch(switchId) {
    this._switches.push(switchId);
  }

  /**
   * @param {Data_QuestVariableCondition} variableCondition
   */
  addVariableCondition(variableCondition) {
    this._variableConditions.push(variableCondition);
  }

  /**
   * @return {boolean}
   */
  isEnabled() {
    return this._switches.every(switchId => $gameSwitches.value(switchId))
      && this._variableConditions.every(variableCondition => variableCondition.isEnabled());
  }
}

/**
 * 変数条件
 * 指定変数がXより大であれば条件を満たしている
 */
class Data_QuestVariableCondition {
  /**
   * @param {number} variableId
   * @param {number} threshold
   */
  constructor(variableId, threshold) {
    this._variableId = variableId;
    this._threshold = threshold;
  }

  /**
   * @return {boolean}
   */
  isEnabled() {
    return $gameVariables.value(this._variableId) > this._threshold;
  }
}

/**
 * @type {Data_Quest[]}
 */
let $dataQuests = [];


/**
 * セーブデータに追加されるクエストの状態
 */
 class Game_Quest {
  /**
   * @param {number} id
   * @param {number} state
   */
  constructor(id, state) {
    this._id = id;
    this._state = state;
  }

  get id() {
    return this._id;
  }

  isOrdering() {
    return this._state === QUEST_STATE.ORDERING;
  }

  isCompleted() {
    return this._state === QUEST_STATE.COMPLETED;
  }

  complete() {
    this._state = QUEST_STATE.COMPLETED;
  }
}

class Game_Quests {
  constructor() {
    /**
     * @type {Game_Quest[]}
     */
    this._quests = [];
  }

  /**
   * 受注しているクエストの数
   * @return {number}
   */
  orderingQuestCount() {
    return this.orderingQuests().length;
  }

  orderingQuests() {
    return this._quests.filter(quest => quest.isOrdering());
  }

  completedQuests() {
    return this._quests.filter(quest => quest.isCompleted());
  }

  /**
   * @param {number} questId
   * @return {boolean}
   */
  isOrdering(questId) {
    return this._quests.some(quest => quest.id === questId && quest.isOrdering());
  }

  /**
   * @param {number} questId
   * @return {boolean}
   */
  isCompleted(questId) {
    return this._quests.some(quest => quest.id === questId && quest.isCompleted());
  }

  /**
   * 指定したIDのクエストを受注する
   * すでに受注していたり、完了済みの場合は受注しない
   * @param {number} questId
   */
  order(questId) {
    if (!this.isOrdering(questId) && !this.isCompleted(questId)) {
      this._quests.push(new Game_Quest(questId, QUEST_STATE.ORDERING));
    }
  }

  /**
   * 指定したIDのクエストを完了する
   * 受注していなかった場合は何もしない
   * @param {number} questId
   */
  complete(questId) {
    if (this.isOrdering(questId)) {
      const quest = this._quests.find(quest => quest.id === questId);
      quest.complete();
      $dataQuests[questId].reward.gain();
    }
  }
}

window.Game_Quest = Game_Quest;
window.Game_Quests = Game_Quests;

/**
 * @type {Game_Quests}
 */
let $gameQuests = null;

/**
 * @param {Game_Party.prototype} gameParty 
 */
function Game_Party_QuestMixIn(gameParty) {
  /**
   * 新たにクエストを受注可能であるか
   * @return {boolean}
   */
  gameParty.canOrderQuest = function () {
    return $gameQuests.orderingQuestCount() < this.maxQuests();
  };

  /**
   * 受注可能なクエスト数
   * @return {number}
   */
  gameParty.maxQuests = function () {
    return settings.orderableQuestCountVariable ? $gameVariables.value(settings.orderableQuestCountVariable) : Infinity;
  };

  /**
   * クエストを受注する
   * @param {number} questId
   */
  gameParty.orderQuest = function (questId) {
    $gameQuests.order(questId);
  };

  /**
   * クエストを完了する
   * @param {number} questId
   */
  gameParty.completeQuest = function (questId) {
    $gameQuests.complete(questId);
  };

  /**
   * 受注しているクエスト一覧
   * @return {Game_Quest[]}
   */
  gameParty.orderingQuests = function () {
    return $gameQuests.orderingQuests();
  };
}

Game_Party_QuestMixIn(Game_Party.prototype);

/**
 * @param {Game_Interpretr.prototype} gameInterpreter
 */
function Game_Interpreter_QuestMixIn(gameInterpreter) {
  const _pluginCommand = gameInterpreter.pluginCommand;
  gameInterpreter.pluginCommand = function (command, args) {
    _pluginCommand.call(this, command, args);
    if (command === "sceneQuest") {
      SceneManager.push(Scene_Quest);
    } else if (command === "orderQuest") {
      const id = Number(args.find(arg => arg.startsWith("id=")).split("=")[1]);
      $gameParty.orderQuest(id);
    } else if (command === "completeQuest") {
      const id = Number(args.find(arg => arg.startsWith("id=")).split("=")[1]);
      $gameParty.completeQuest(id);
    }
  };
}

Game_Interpreter_QuestMixIn(Game_Interpreter.prototype);

/**
 * @param {Scene_Boot.prototype} sceneClass
 */
function Scene_Boot_QuestMixIn(sceneClass) {
  const _start = sceneClass.start;
  sceneClass.start = function () {
    _start.call(this);
    this.loadQuests();
  }

  sceneClass.loadQuests = function () {
    settings.quests.forEach((quest) => {
      const conditions = new Data_QuestConditions();
      quest.switchConditions.forEach(switchCondition => {
        conditions.addSwitch(switchCondition.switchId);
      });
      quest.variableConditions.forEach(variableCondition => {
        conditions.addVariableCondition(
          new Data_QuestVariableCondition(
            variableCondition.variableId,
            variableCondition.threshold
          )
        )
      });
      $dataQuests[quest.id] = new Data_Quest(
        quest.id,
        quest.title,
        quest.client,
        quest.description,
        new Data_QuestReward(
          quest.reward.items.map(itemId => $dataItems[itemId]),
          quest.reward.weapons.map(weaponId => $dataWeapons[weaponId]),
          quest.reward.armors.map(armorId => $dataArmors[armorId]),
          quest.reward.text,
          quest.reward.commonEvent
        ),
        conditions
      );
    });
  };
}

Scene_Boot_QuestMixIn(Scene_Boot.prototype);

const LIST_WINDOW_WIDTH = 280;

class Scene_Quest extends Scene_Base {
  create() {
    super.create();
    this.createBackground();
    this.createWindowLayer();
    this.createListWindow();
    this.createDetailWindow();
    this.createOrderWindow();
  }

  createBackground() {
    Scene_MenuBase.prototype.createBackground.call(this);
  }

  createListWindow() {
    const rect = this.listWindowRect();
    this._listWindow = new Window_QuestList(rect.x, rect.y, rect.width, rect.height);
    this._listWindow.setHandler('ok', this.onListOk.bind(this));
    this._listWindow.setHandler('cancel', this.popScene.bind(this));
    this._listWindow.activate();
    this.addWindow(this._listWindow);
  }

  /**
   * @return {Rectangle}
   */
  listWindowRect() {
    return new Rectangle(0, 0, LIST_WINDOW_WIDTH, Graphics.boxHeight);
  }

  createDetailWindow() {
    const rect = this.detailWindowRect();
    this._detailWindow = new Window_QuestDetail(rect.x, rect.y, rect.width, rect.height);
    this._listWindow.setDetailWindow(this._detailWindow);
    this._listWindow.select(0);
    this.addWindow(this._detailWindow);
  }

  /**
   * @return {Rectangle}
   */
  detailWindowRect() {
    return new Rectangle(LIST_WINDOW_WIDTH, 0, Graphics.boxWidth - LIST_WINDOW_WIDTH, Graphics.boxHeight);
  }

  /**
   * 重なるので、ウィンドウレイヤーがもうひとつ必要
   */
  createOrderWindow() {
    this._orderWindowLayer = new WindowLayer();
    this._orderWindowLayer.move(
      (Graphics.width - Graphics.boxWidth) / 2,
      (Graphics.height - Graphics.boxHeight) / 2,
      Graphics.boxWidth,
      Graphics.boxHeight
    );
    const rect = this.orderWindowRect();
    this._orderWindow = new Window_QuestOrder(rect.x, rect.y, rect.width, rect.height);
    this._orderWindow.setHandler('ok', this.onOrderOk.bind(this));
    this._orderWindow.setHandler('cancel', this.onOrderCancel.bind(this));
    this._orderWindow.deactivate();
    this._orderWindow.hide();
    this._orderWindowLayer.addChild(this._orderWindow);
    this.addChild(this._orderWindowLayer);
  }

  orderWindowRect() {
    const width = 200;
    const height = Window_Base.prototype.lineHeight() * 2;
    return new Rectangle(
      (Graphics.boxWidth - width)/2,
      (Graphics.boxHeight - height)/2,
      width,
      height
    );
  }

  onListOk() {
    this._listWindow.deactivate();
    this._orderWindow.show();
    this._orderWindow.activate();
  }

  onOrderOk() {
    if (this._orderWindow.index() === 0) {
      $gameParty.orderQuest(this._listWindow.questId());
      this._listWindow.refresh();
    }
    this._orderWindow.deactivate();
    this._orderWindow.hide();
    this._listWindow.activate();
  }

  onOrderCancel() {
    this._orderWindow.deactivate();
    this._orderWindow.hide();
    this._listWindow.activate();
  }
}

window.Scene_Quest = Scene_Quest;

/**
 * クエスト一覧ウィンドウ
 */
class Window_QuestList extends Window_Selectable {
  initialize(x, y, width, height) {
    super.initialize(x, y, width, height);
    this.refresh();
  }

  /**
   * 選択中のクエストID
   * @return {number}
   */
  questId() {
    return this._data ? this._data[this.index()].id : null;
  }

  maxItems() {
    return this._data ? this._data.length : 1;
  }

  /**
   * @return {Data_Quest}
   */
  quest() {
    return this._data ? this._data[this.index()] : null;
  }

  /**
   * @param {number} index
   */
  select(index) {
    super.select(index);
    this.updateDetail();
  }

  /**
   * @param {Data_Quest} quest
   * @return {boolean}
   */
  isEnabled(quest) {
    return quest ? quest.isEnabled() : false;
  }

  isCurrentItemEnabled() {
    return this.isEnabled(this.quest());
  }

  refresh() {
    this.makeItemList();
    this.createContents();
    this.drawAllItems();
  }

  makeItemList() {
    this._data = $dataQuests.filter(quest => quest && quest.isVisible());
  }
  
  drawItem(index) {
    const quest = this._data[index];
    const rect = this.itemRect(index);
    this.changePaintOpacity($gameParty.canOrderQuest());
    if (quest.isInProgress()) {
      this.changeTextColor(this.textColor(settings.orderingQuestColor));
    }
    this.drawText(quest.title, rect.x, rect.y, rect.width);
    this.changePaintOpacity(true);
    this.resetTextColor();
  }

  /**
   * @param {Window_QuestDetail} detailWindow
   */
  setDetailWindow(detailWindow) {
    this._detailWindow = detailWindow;
  }

  updateDetail() {
    if (this._detailWindow) {
      this._detailWindow.setQuest(this.quest());
    }
  }
}

/**
 * クエスト詳細ウィンドウ
 */
class Window_QuestDetail extends Window_Base {
  refresh() {
    this.contents.clear();
    if (this._quest) {
      this.drawTitle((this.width - this.textWidth(this._quest.title))/2, 0);
      this.drawClient(0, this.lineHeight() * 1.5);
      this.drawDescription(0, this.lineHeight() * 3)
      this.drawRewards(0, this.lineHeight() * 9);
    }
  }
  
  drawTitle(x, y) {
    this.drawText(this._quest.title, x, y);
  }

  drawClient(x, y) {
    this.changeTextColor(this.systemColor());
    this.drawText("依頼者", x, y)
    this.resetTextColor();
    this.drawText(this._quest.client, x, y, this.width - this.textWidth(this._quest.client), 'right');
  }

  drawDescription(x, y) {
    this.changeTextColor(this.systemColor());
    this.drawText("詳細", x, y);
    this.resetTextColor();
    this.drawText(this._quest.description, x, y + this.lineHeight());
  }

  drawRewards(x, y) {
    let line = 1;
    this.changeTextColor(this.systemColor());
    this.drawText("報酬", x, y);
    this.resetTextColor();
    this._quest.reward.items
      .concat(this._quest.reward.weapons)
      .concat(this._quest.reward.armors)
      .forEach(item => {
        this.drawIcon(item.iconIndex, x, y + line * this.lineHeight())
        this.drawText(item.name, x + Window_Base._iconWidth + 4, y + line * this.lineHeight());
        line++;
      });
    if (this._quest.reward.text) {
      this.drawText(this._quest.reward.text, x, y + line * this.lineHeight());
    }
  }

  /**
   * @param {Data_Quest} quest
   */
  setQuest(quest) {
    if (this._quest !== quest) {
      this._quest = quest;
      this.refresh();
    }
  }
}

window.Window_QuestDetail = Window_QuestDetail;

/**
 * 受注選択ウィンドウ
 */
class Window_QuestOrder extends Window_Command {
  makeCommandList() {
    this.addCommand("受注", 'ok', true);
    this.addCommand("やめる", 'cancel', true);
  }

  itemTextAlign() {
    return 'center';
  }

  isOkTriggered() {
    return super.isOkTriggered() && this.index() === 0;
  }

  isCancelTriggered() {
    return super.isCancelTriggered() || super.isOkTriggered() && this.index() === 1;
  }
}
