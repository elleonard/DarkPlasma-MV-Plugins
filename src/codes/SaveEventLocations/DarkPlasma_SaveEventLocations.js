/**
 * DataManager
 */
const _DataManager_extractMetadata = DataManager.extractMetadata;
DataManager.extractMetadata = function (data) {
  _DataManager_extractMetadata.call(this, data);
  if (data === $dataMap) {
    $dataMap.saveEventLocations = !!data.meta['Save Event Locations'];
    data.events.forEach(event => {
      if (event) {
        event.saveEventLocation = /<Save Event Location>/i.test(event.note);
      }
    });
  }
};

class EventLocation {
  /**
   * @param {number} x X座標
   * @param {number} y Y座標
   * @param {number} direction 向き
   */
  constructor(x, y, direction) {
    this._x = x;
    this._y = y;
    this._direction = direction;
  }

  /**
   * 位置の記録
   * @param {number} x X座標
   * @param {number} y Y座標
   * @param {number} direction 向き
   */
  saveLocation(x, y, direction) {
    this._x = x;
    this._y = y;
    this._direction = direction;
  }

  /**
   * @return {number}
   */
  get x() {
    return this._x;
  }

  /**
   * @return {number}
   */
  get y() {
    return this._y;
  }

  /**
   * @return {number}
   */
  get direction() {
    return this._direction;
  }
}

class EventLocations {
  constructor() {
    this._locations = {};
  }

  clear() {
    this._locations = {};
  }

  /**
   * 指定イベントの記録位置を返す
   * 記録されていない場合はnullを返す
   * @param {number} mapId マップID
   * @param {number} eventId イベントID
   * @return {EventLocation|null}
   */
  getSavedLocation(mapId, eventId) {
    const key = this.key(mapId, eventId);
    return this.isLocationSavedEvent(mapId, eventId) ? this._locations[key] : null;
  }

  /**
   * 位置を記録する
   * @param {number} mapId マップID
   * @param {number} eventId イベントID
   * @param {number} x X座標
   * @param {number} y Y座標
   * @param {number} direction 向き
   */
  saveLocation(mapId, eventId, x, y, direction) {
    const key = this.key(mapId, eventId);
    if (this.isLocationSavedEvent(mapId, eventId)) {
      this._locations[key].saveLocation(x, y, direction);
    } else {
      this._locations[key] = new EventLocation(
        x, y, direction
      );
    }
  }

  /**
   * 位置が記録されたイベントかどうか
   * @param {number} mapId マップID
   * @param {number} eventId イベントID
   * @return {boolean}
   */
  isLocationSavedEvent(mapId, eventId) {
    return !!this._locations[this.key(mapId, eventId)];
  }

  /**
   * 指定したイベントの記録用キーを取得する
   * @param {number} mapId マップID
   * @param {number} eventId イベントID
   * @return {number}
   */
  key(mapId, eventId) {
    return `${mapId}_${eventId}`;
  }
}

let savedEventLocations = new EventLocations();

window[EventLocation.name] = EventLocation;
window[EventLocations.name] = EventLocations;

/**
 * @param {number} mapId マップID
 * @param {number} eventId イベントID
 * @return {string}
 */
function eventIdentifier(mapId, eventId) {
  return `${mapId}_${eventId}`;
}

/**
 * @type {Map<string, boolean>}
 */
const initializingEvents = new Map();

function Game_Event_SaveLocationMixIn(gameEvent) {
  const _initialize = gameEvent.initialize;
  gameEvent.initialize = function (mapId, eventId) {
    this.startInitializing(mapId, eventId);
    _initialize.call(this, mapId, eventId);
    if (savedEventLocations.isLocationSavedEvent(mapId, eventId)) {
      this.loadLocation(mapId, eventId);
    }
    this.endInitializing();
  }

  /**
   * 位置をロードする
   * @param {number} mapId マップID
   * @param {number} eventId イベントID
   */
  gameEvent.loadLocation = function (mapId, eventId) {
    const defaultPattern = this._pattern;
    const savedLocation = savedEventLocations.getSavedLocation(mapId, eventId);
    this.locate(savedLocation.x, savedLocation.y);
    this.setDirection(savedLocation.direction);
    /**
     * アニメーションパターンの復元
     */
    if (this.hasWalkAnime() || this.hasStepAnime()) {
      this._pattern = defaultPattern;
    }
  };

  /**
   * 初期化処理を開始する
   * mapId及びeventIdは初期化処理中にセットされるため、コンストラクタに渡されたものを引き回す
   * @param {number} mapId マップID
   * @param {number} eventId イベントID
   */
  gameEvent.startInitializing = function (mapId, eventId) {
    if (!this.isInitializing(mapId, eventId)) {
      initializingEvents.set(eventIdentifier(mapId, eventId), true);
    }
  }

  /**
   * 初期化処理を終了する
   */
  gameEvent.endInitializing = function () {
    if (this.isInitializing(this._mapId, this._eventId)) {
      initializingEvents.set(eventIdentifier(this._mapId, this._eventId), false);
    }
  }

  /**
   * 初期化処理中かどうか
   * @param {number} mapId マップID
   * @param {number} eventId イベントID
   * @returns 
   */
  gameEvent.isInitializing = function (mapId, eventId) {
    return initializingEvents.get(eventIdentifier(mapId, eventId));
  }

  const _locate = gameEvent.locate;
  gameEvent.locate = function (x, y) {
    _locate.call(this, x, y);
    if (this.mustSaveLocation() && !this.isInitializing(this._mapId, this._eventId)) {
      savedEventLocations.saveLocation(
        this._mapId, this.eventId(), x, y, this.direction()
      );
    }
  }

  const _updateMove = gameEvent.updateMove;
  gameEvent.updateMove = function () {
    _updateMove.call(this);
    if (!this.isMoving() && this.mustSaveLocation()) {
      savedEventLocations.saveLocation(
        this._mapId, this.eventId(), this.x, this.y, this.direction()
      );
    }
  }

  const _updateJump = gameEvent.updateJump;
  gameEvent.updateJump = function () {
    _updateJump.call(this);
    if (!this.isJumping() && this.mustSaveLocation()) {
      savedEventLocations.saveLocation(
        this._mapId, this.eventId(), this.x, this.y, this.direction()
      );
    }
  }

  const _setDirection = gameEvent.setDirection;
  gameEvent.setDirection = function (direction) {
    _setDirection.call(this, direction);
    if (this.mustSaveLocation() && !this.isInitializing(this._mapId, this._eventId) && direction > 0) {
      savedEventLocations.saveLocation(
        this._mapId, this.eventId(), this.x, this.y, direction
      );
    }
  }

  /**
   * 位置を記録すべきかどうか
   * @return {boolean}
   */
  gameEvent.mustSaveLocation = function () {
    return $gameMap.mustSaveEventLocations() || this.event().saveEventLocation;
  }

  /**
   * 位置をリセットする
   */
  gameEvent.resetLocation = function () {
    const pattern = this._pattern;
    this.locate(this.event().x, this.event().y);
    this.setDirection(this._originalDirection);
    this.setPattern(pattern);
  }
};

Game_Event_SaveLocationMixIn(Game_Event.prototype);

function Game_Map_SaveLocationMixIn(gameMap) {
  /**
   * マップ内のイベント位置を記録すべきかどうか
   * @return {boolean}
   */
  gameMap.mustSaveEventLocations = function () {
    return $dataMap.saveEventLocations;
  }

  /**
   * マップ内の全イベントの位置をリセットする
   */
  gameMap.resetAllEventLocations = function () {
    this.events().forEach(event => {
      event.resetLocation();
    });
  }
};

Game_Map_SaveLocationMixIn(Game_Map.prototype);

function Game_System_SaveLocationMixIn(gameSystem) {
  const _initialize = gameSystem.initialize;
  gameSystem.initialize = function () {
    _initialize.call(this);
    savedEventLocations.clear();
  }

  const _onAfterLoad = gameSystem.onAfterLoad;
  gameSystem.onAfterLoad = function () {
    _onAfterLoad.call(this);
    if (!this._savedEventLocations || !this._savedEventLocaions instanceof EventLocations) {
      savedEventLocations.clear();
    } else {
      savedEventLocations = this._savedEventLocations;
    }
  }

  const _onBeforeSave = gameSystem.onBeforeSave;
  gameSystem.onBeforeSave = function () {
    _onBeforeSave.call(this);
    this._savedEventLocations = savedEventLocations;
  }
};

Game_System_SaveLocationMixIn(Game_System.prototype);

const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
  _Game_Interpreter_pluginCommand.call(this, command, args);
  if (command === 'ResetAllEventLocations') {
    $gameMap.resetAllEventLocations();
  }
}
