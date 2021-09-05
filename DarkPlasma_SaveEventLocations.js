// DarkPlasma_SaveEventLocations 1.0.2
// Copyright (c) 2021 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/09/05 1.0.2 位置ロード時、歩行アニメーションが一瞬だけパターン1になる不具合の修正
 *                  rollup構成へ移行
 *                  リファクタ
 * 2021/05/23 1.0.1 リファクタ
 * 2020/06/11 1.0.0 公開
 */

/*:ja
 * @plugindesc マップ上のイベント位置を記録する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 1.0.2
 * このプラグインは YEP_SaveEventLocations.js の代替として利用できます。
 *
 * マップ上のイベント位置を記録します。
 * マップを去った後、同じマップに戻ってきた際に
 * 位置を記録したイベントの位置が、初期配置ではなく
 * 記録した位置になるようにします。
 *
 * マップのメモ欄に以下のように記録すると、
 * そのマップのイベントすべての位置を記録します。
 *   <Save Event Locations>
 *
 * イベントのメモ欄に以下のように記録すると、
 * そのイベントの位置を記録します。
 *   <Save Event Location>
 *
 * ただし、記録した位置はセーブデータに含まれることに注意してください。
 * 記録するイベント数が多くなればなるほど、
 * セーブデータの容量も大きくなります。
 *
 * 下記プラグインコマンドで現在のマップ上のイベント位置をすべてリセットできます。
 *   ResetAllEventLocations
 */

(() => {
  'use strict';

  /**
   * DataManager
   */
  const _DataManager_extractMetadata = DataManager.extractMetadata;
  DataManager.extractMetadata = function (data) {
    _DataManager_extractMetadata.call(this, data);
    if (data === $dataMap) {
      $dataMap.saveEventLocations = !!data.meta['Save Event Locations'];
      data.events.forEach((event) => {
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
        this._locations[key] = new EventLocation(x, y, direction);
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

  Game_Event = class extends Game_Event {
    initialize(mapId, eventId) {
      this.startInitializing(mapId, eventId);
      super.initialize(mapId, eventId);
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
    loadLocation(mapId, eventId) {
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
    }

    /**
     * 初期化処理を開始する
     * mapId及びeventIdは初期化処理中にセットされるため、コンストラクタに渡されたものを引き回す
     * @param {number} mapId マップID
     * @param {number} eventId イベントID
     */
    startInitializing(mapId, eventId) {
      if (!this.isInitializing(mapId, eventId)) {
        initializingEvents.set(eventIdentifier(mapId, eventId), true);
      }
    }

    /**
     * 初期化処理を終了する
     */
    endInitializing() {
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
    isInitializing(mapId, eventId) {
      return initializingEvents.get(eventIdentifier(mapId, eventId));
    }

    locate(x, y) {
      super.locate(x, y);
      if (this.mustSaveLocation() && !this.isInitializing(this._mapId, this._eventId)) {
        savedEventLocations.saveLocation(this._mapId, this.eventId(), x, y, this.direction());
      }
    }

    updateMove() {
      super.updateMove();
      if (!this.isMoving() && this.mustSaveLocation()) {
        savedEventLocations.saveLocation(this._mapId, this.eventId(), this.x, this.y, this.direction());
      }
    }

    updateJump() {
      super.updateJump();
      if (!this.isJumping() && this.mustSaveLocation()) {
        savedEventLocations.saveLocation(this._mapId, this.eventId(), this.x, this.y, this.direction());
      }
    }

    setDirection(direction) {
      super.setDirection(direction);
      if (this.mustSaveLocation() && !this.isInitializing(this._mapId, this._eventId) && direction > 0) {
        savedEventLocations.saveLocation(this._mapId, this.eventId(), this.x, this.y, direction);
      }
    }

    /**
     * 位置を記録すべきかどうか
     * @return {boolean}
     */
    mustSaveLocation() {
      return $gameMap.mustSaveEventLocations() || this.event().saveEventLocation;
    }

    /**
     * 位置をリセットする
     */
    resetLocation() {
      const pattern = this._pattern;
      this.locate(this.event().x, this.event().y);
      this.setDirection(this._originalDirection);
      this.setPattern(pattern);
    }
  };

  Game_Map = class extends Game_Map {
    /**
     * マップ内のイベント位置を記録すべきかどうか
     * @return {boolean}
     */
    mustSaveEventLocations() {
      return $dataMap.saveEventLocations;
    }

    /**
     * マップ内の全イベントの位置をリセットする
     */
    resetAllEventLocations() {
      this.events().forEach((event) => {
        event.resetLocation();
      });
    }
  };

  Game_System = class extends Game_System {
    initialize() {
      super.initialize();
      savedEventLocations.clear();
    }

    onAfterLoad() {
      super.onAfterLoad();
      if (!this._savedEventLocations || !this._savedEventLocaions instanceof EventLocations) {
        savedEventLocations.clear();
      } else {
        savedEventLocations = this._savedEventLocations;
      }
    }

    onBeforeSave() {
      super.onBeforeSave();
      this._savedEventLocations = savedEventLocations;
    }
  };

  Game_Interpreter = class extends Game_Interpreter {
    pluginCommand(command, args) {
      super.pluginCommand(command, args);
      if (command === 'ResetAllEventLocations') {
        $gameMap.resetAllEventLocations();
      }
    }
  };
})();
