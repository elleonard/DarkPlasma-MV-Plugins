/// <reference path="./TextLog.d.ts" />

import { settings } from './_build/DarkPlasma_TextLog_parameters';

/**
 * プラグインがロードされているかどうか
 */
PluginManager.isLoadedPlugin = function (name) {
  return $plugins.some((plugin) => plugin.name === name && plugin.status);
};

const _BattleManager_updateBattleEnd = BattleManager.updateBattleEnd;
BattleManager.updateBattleEnd = function () {
  if (!this.isBattleTest() && settings.autoSplitWhenBattleEnd) {
    moveToPrevLog();
  }
  _BattleManager_updateBattleEnd.call(this);
};

class EventTextLog {
  _messages: LogMessage[];

  constructor() {
    this.initialize();
  }

  initialize() {
    this._messages = [];
  }

  get messages() {
    return this._messages;
  }

  get messageLength() {
    return this._messages.length;
  }

  /**
   * ログを追加する
   */
  addMessageLog(text: string) {
    this._messages.push(new LogMessage(text));
  }
}

/**
 * ログメッセージ
 */
class LogMessage {
  _text: string;
  _height: number;
  _offsetY: number;

  constructor(text: string) {
    this._text = text;
    this._height = 0;
    this._offsetY = 0;
  }

  get text() {
    return this._text;
  }

  /**
   * ログウィンドウに表示する際の高さを記録する
   * （再計算の処理が重いため、一度だけ計算する）
   */
  setHeight(height: number) {
    this._height = height;
  }

  get height() {
    return this._height;
  }

  /**
   * 表示開始Y座標を調整したいとき用
   */
  setOffsetY(offsetY: number) {
    this._offsetY = offsetY;
  }

  get offsetY() {
    return this._offsetY;
  }
}

/**
 * @type {EventTextLog}
 */
let currentEventLog: EventTextLog = new EventTextLog();
/**
 * @type {EventTextLog[]}
 */
let pastEventLog: EventTextLog[] = [];

// ログ表示用シーン
class Scene_TextLog extends Scene_Base {
  _textLogWindow: Window_TextLog;
  _backgroundSprite: Sprite;

  constructor() {
    super();
    this.initialize();
  }

  create() {
    super.create();
    this.createBackground();
    this.createWindowLayer();
    this.createTextLogWindow();
  }

  start() {
    super.start();
    this._textLogWindow.refresh();
  }

  createBackground() {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = this.backgroundImage();
    this.addChild(this._backgroundSprite);
  }

  /**
   * シーンの背景画像をロードして返す
   */
  backgroundImage() {
    if (settings.backgroundImage) {
      return ImageManager.loadBitmap('img/', settings.backgroundImage, 0, true);
    }
    return SceneManager.backgroundBitmap();
  }

  createTextLogWindow() {
    this._textLogWindow = new Window_TextLog();
    this._textLogWindow.setHandler('cancel', this.popScene.bind(this));
    if (!settings.showLogWindowFrame) {
      /**
       * ウィンドウを透明にする
       */
      this._textLogWindow.setBackgroundType(2);
    }
    this.addWindow(this._textLogWindow);
  }
}

// ログ表示用ウィンドウ
class Window_TextLog extends Window_Base {
  _viewTexts: LogMessage[];
  _cursor: number;
  _handlers: { [symbol: string]: () => void };
  _needRefresh: boolean;
  _calcMode: boolean;
  _lineNumber: number;
  _textHeight: number;

  constructor() {
    super(0, 0, 0, 0);
    this.initialize();
  }

  initialize() {
    super.initialize(0, 0, Graphics.boxWidth, Graphics.boxHeight);
    /**
     * @type {LogMessage[]}
     */
    this._viewTexts = [];
    if (pastEventLog.length > 0) {
      this._viewTexts = pastEventLog
        .map((pastLog) => pastLog.messages)
        .reverse()
        .reduce((accumlator, currentValue) => currentValue.concat(accumlator));
    }
    if (currentEventLog.messageLength > 0) {
      this._viewTexts = this._viewTexts.concat(currentEventLog.messages);
    }
    this._cursor = this.calcDefaultCursor();
    this._handlers = {};
  }

  standardFontSize() {
    return settings.standardFontSize ? settings.standardFontSize : super.standardFontSize();
  }

  cursorPosition() {
    return this._cursor;
  }

  /**
   * ハンドラを登録する
   */
  setHandler(symbol: string, method: () => void) {
    this._handlers[symbol] = method;
  }

  /**
   * 指定したシンボルでハンドラが登録されているか
   */
  isHandled(symbol: string) {
    return !!this._handlers[symbol];
  }

  /**
   * 指定したシンボルのハンドラを呼び出す\
   */
  callHandler(symbol: string) {
    if (this.isHandled(symbol)) {
      this._handlers[symbol]();
    }
  }

  isCursorMovable() {
    return true;
  }

  cursorDown() {
    if (!this.isCursorMax()) {
      this._cursor++;
    }
  }

  /**
   * これ以上下にスクロールできない状態かどうかを計算する
   */
  isCursorMax() {
    const size = this._viewTexts.length;
    if (size - this.cursorPosition() > settings.maxVisibleMessages) {
      return false;
    }
    let height = 0;
    for (let i = this.cursorPosition(); i < size; i++) {
      const text = this._viewTexts[i].text;
      const textHeight = this._viewTexts[i].height;
      height += textHeight === 0 ? this.calcMessageHeight(text) : textHeight;
      if (height > Graphics.boxHeight - this.lineHeight()) {
        return false;
      }
    }
    return true;
  }

  cursorUp() {
    if (this.cursorPosition() > 0) {
      this._cursor--;
    }
  }

  processCursorMove() {
    if (this.isCursorMovable()) {
      const lastCursor = this.cursorPosition();
      if (Input.isRepeated('down') || TouchInput.wheelY > 0 || TouchInput.isUpMoved()) {
        this.cursorDown();
      }
      if (Input.isRepeated('up') || TouchInput.wheelY < 0 || TouchInput.isDownMoved()) {
        this.cursorUp();
      }
      this._needRefresh = lastCursor !== this.cursorPosition();
    }
  }

  processCancel() {
    this.callHandler('cancel');
    SoundManager.playCancel();
  }

  processHandling() {
    if (this.isCancelEnabled() && this.isCancelTriggered()) {
      this.processCancel();
    }
  }

  isCancelEnabled() {
    return this.isHandled('cancel');
  }

  isCancelTriggered() {
    return (
      Input.isRepeated('cancel') ||
      Input.isTriggered('ok') ||
      settings.openLogKeys.some((openLogKey) => Input.isTriggered(openLogKey)) ||
      TouchInput.isCancelled()
    );
  }

  update() {
    super.update();
    this.updateArrows();
    this.processCursorMove();
    this.processHandling();
    /**
     * refresh処理は重いので、必要なケースのみ行う
     */
    if (this._needRefresh) {
      this.refresh();
    }
  }

  updateArrows() {
    this.upArrowVisible = this.cursorPosition() > 0;
    this.downArrowVisible = !this.isCursorMax();
  }

  refresh() {
    this.contents.clear();
    this.drawTextLog();
  }

  drawTextLog() {
    let height = 0;
    for (let i = this.cursorPosition(); i < this.cursorPosition() + settings.maxVisibleMessages; i++) {
      if (i < this._viewTexts.length) {
        const text = this._viewTexts[i].text;
        const textHeight = this._viewTexts[i].height;
        const offsetY = this._viewTexts[i].offsetY;
        this.drawTextEx(text, 0, height + offsetY);
        if (textHeight === 0) {
          this._viewTexts[i].setHeight(this.calcMessageHeight(text));
        }
        height += this._viewTexts[i].height;
        if (height > Graphics.boxHeight) {
          break;
        }
      }
    }
  }

  /**
   * デフォルトのスクロール位置を計算する
   */
  calcDefaultCursor() {
    let height = 0;
    const size = this._viewTexts.length;
    for (let i = 0; i < size; i++) {
      const viewText = this._viewTexts[size - 1 - i];
      viewText.setHeight(this.calcMessageHeight(viewText.text));
      height += viewText.height;
      if (i === settings.maxVisibleMessages || height > Graphics.boxHeight - this.lineHeight()) {
        return i > 0 ? size - i : size - 1;
      }
    }
    return 0;
  }

  lineHeight() {
    return this.contents.fontSize + settings.lineSpacing;
  }

  /**
   * メッセージの表示高さを計算する
   */
  calcMessageHeight(text: string) {
    this._calcMode = true;
    let height = 0;
    const lines = text.split('\n');
    lines.forEach((line) => {
      this._lineNumber = 1;
      this.drawTextEx(line, 0, 0);
      height += (this._textHeight + settings.lineSpacing) * this._lineNumber;
    });
    this._calcMode = false;
    return height + settings.messageSpacing;
  }

  /**
   * テキストを描画し、その幅を返す
   * @param {string} text テキスト
   * @param {number} x X座標
   * @param {number} y Y座標
   * @return {number}
   */
  drawTextEx(text: string, x: number, y: number): number {
    if (this._calcMode) {
      /**
       * 計算モード時には描画しない
       */
      let drawFunction = this.contents.drawText;
      this.contents.drawText = function () { };
      const value = super.drawTextEx(text, x, y);
      this.contents.drawText = drawFunction;
      return value;
    } else {
      return super.drawTextEx(text, x, y);
    }
  }

  /**
   * テキストの高さを計算する
   * @param {MV.textState} textState テキストの状態
   * @param {boolean} all 全文を対象とするか
   * @return {number}
   */
  calcTextHeight(textState: MV.TextState, all: boolean): number {
    /**
     * 計算モード用
     */
    this._textHeight = super.calcTextHeight(textState, all);
    return this._textHeight;
  }

  /**
   * 改行する
   * @param {MV.textState} textState テキストの状態
   */
  processNewLine(textState: MV.TextState) {
    super.processNewLine(textState);
    if (this._calcMode) {
      this._lineNumber++;
    }
  }

  /**
   * \XXX[YYY]の処理
   * textStateはすでに[までindexを進めてある
   * @param {string} code XXX
   * @param {MV.TextState} textState
   */
  processEscapeCharacter(code: string, textState: MV.TextState) {
    super.processEscapeCharacter(code, textState);
    if (settings.escapeCharacterCodes.includes(code)) {
      this.obtainEscapeParamTexts(textState);
    }
  }

  /**
   * [YYY]のYYYを取り出し、カンマ区切りで配列化して返す
   */
  obtainEscapeParamTexts(textState: MV.TextState) {
    const arr = /^\[(.+?)\]/.exec(textState.text.slice(textState.index));
    if (arr) {
      textState.index += arr[0].length;
      return arr[1].split(',');
    } else {
      return [];
    }
  }
}

/**
 * テキストログを追加する
 */
function addTextLog(text: string) {
  currentEventLog.addMessageLog(text);
}

/**
 * 現在のイベントのログを過去のイベントのログに移動する
 */
function moveToPrevLog() {
  // 文章を表示しないイベントは無視する
  if (currentEventLog.messageLength === 0) {
    return;
  }
  if (settings.autoSplit) {
    addTextLog(settings.logSplitter);
  }
  pastEventLog.push(currentEventLog);
  initializeCurrentEventLog();
}

/**
 * 現在のイベントのログを初期化する
 */
function initializeCurrentEventLog() {
  currentEventLog = new EventTextLog();
}

/**
 * 過去のイベントのログを初期化する
 */
function initializePastEventLog() {
  pastEventLog = [];
}

/**テキストログを表示できるかどうか
 * A ログが１行以上ある
 * B 空のログウィンドウを表示するフラグがtrue
 * C スイッチで禁止されていない
 * (A || B) && C
 * @return {boolean}
 */
function isTextLogEnabled() {
  return (
    (settings.showLogWindowWithoutText || currentEventLog.messageLength > 0 || pastEventLog.length > 0) &&
    (settings.disableLogWindowSwitch === 0 || !$gameSwitches.value(settings.disableLogWindowSwitch))
  );
}

/**
 * Scene_Mapのメッセージウィンドウを退避しておくクラス
 */
class EvacuatedMessageWindows {
  _messageWindow: Window_Message;
  _scrollTextWindow: Window_ScrollText;
  _pauseWindow: Window_PauseMenu;

  /**
   * @param {Window_Message} messageWindow メッセージウィンドウ
   * @param {Window_ScrollText} scrollTextWindow スクロールテキストウィンドウ
   * @param {Window_PauseMenu} pauseWindow ポーズメニューウィンドウ（NobleMushroom.js 用）
   */
  constructor(messageWindow: Window_Message, scrollTextWindow: Window_ScrollText, pauseWindow: Window_PauseMenu) {
    this._messageWindow = messageWindow;
    this._scrollTextWindow = scrollTextWindow;
    this._pauseWindow = pauseWindow;
  }

  get messageWindow() {
    return this._messageWindow;
  }

  get scrollTextWindow() {
    return this._scrollTextWindow;
  }

  get pauseWindow() {
    return this._pauseWindow;
  }
}

/**
 * @type {EvacuatedMessageWindows}
 */
let evacuatedMessageWindow: EvacuatedMessageWindows | null = null;

function Scene_Map_TextLogMixIn(sceneMap: Scene_Map) {
  const _start = sceneMap.start;
  sceneMap.start = function () {
    _start.call(this);

    // 呼び出し中フラグの初期化
    this.textLogCalling = false;
  };

  const _update = sceneMap.update;
  sceneMap.update = function () {
    // isSceneChangeOK時はイベント中も含まれるため、特殊な条件で許可する
    if (this.isActive() && !SceneManager.isSceneChanging()) {
      this.updateCallTextLog();
    }
    _update.call(this);
  };

  const _createMessageWindow = sceneMap.createMessageWindow;
  sceneMap.createMessageWindow = function (this: Scene_Map) {
    /**
     * ログシーンからスムーズに戻るために、処理を上書きして
     * Windowインスタンスを新しく作らないようにする
     */
    if (settings.smoothBackFromLog && evacuatedMessageWindow) {
      this._messageWindow = evacuatedMessageWindow.messageWindow;
      this.addWindow(this._messageWindow);
      this._messageWindow.subWindows().forEach(function (this: Scene_Map, window) {
        this.addWindow(window);
      }, this);
    } else {
      _createMessageWindow.call(this);
    }
  };

  const _createScrollTextWindow = sceneMap.createScrollTextWindow;
  sceneMap.createScrollTextWindow = function (this: Scene_Map) {
    /**
     * ログシーンからスムーズに戻るために、処理を上書きして
     * Windowインスタンスを新しく作らないようにする
     */
    if (settings.smoothBackFromLog && evacuatedMessageWindow) {
      this._scrollTextWindow = evacuatedMessageWindow.scrollTextWindow;
      this.addWindow(this._scrollTextWindow);
    } else {
      _createScrollTextWindow.call(this);
    }
  };

  if (PluginManager.isLoadedPlugin('NobleMushroom')) {
    /**
     * ハンドラを更新する
     */
    sceneMap.refreshPauseWindowHandlers = function () {
      this._pauseWindow.setHandler(Scene_Map.symbolSave, this.callSave.bind(this));
      this._pauseWindow.setHandler(Scene_Map.symbolLoad, this.callLoad.bind(this));
      this._pauseWindow.setHandler('quickSave', this.callQuickSave.bind(this));
      this._pauseWindow.setHandler('quickLoad', this.callQuickLoad.bind(this));
      this._pauseWindow.setHandler('toTitle', this.callToTitle.bind(this));
      this._pauseWindow.setHandler('cancel', this.offPause.bind(this));
    };
    /**
     * NobleMushroom.js のほうが上に読み込まれている場合
     */
    if (sceneMap.createPauseWindow) {
      const _createPauseWindow = sceneMap.createPauseWindow;
      sceneMap.createPauseWindow = function () {
        /**
         * ログシーンからスムーズに戻るために、処理を上書きして
         * Windowインスタンスを新しく作らないようにする
         */
        if (settings.smoothBackFromLog && evacuatedMessageWindow) {
          this._pauseWindow = evacuatedMessageWindow.pauseWindow;
          this.refreshPauseWindowHandlers();
          this.addWindow(this._pauseWindow);
        } else {
          _createPauseWindow.call(this);
        }
      };
    } else {
      const _onMapLoaded = sceneMap.onMapLoaded;
      sceneMap.onMapLoaded = function (this: Scene_Map) {
        _onMapLoaded.call(this);
        if (settings.smoothBackFromLog && evacuatedMessageWindow) {
          this._windowLayer.removeChild(this._pauseWindow);
          this._pauseWindow = evacuatedMessageWindow.pauseWindow;
          this.refreshPauseWindowHandlers();
          this.addWindow(this._pauseWindow);
        }
      };
    }
  }

  sceneMap.updateCallTextLog = function () {
    if (this.isTextLogEnabled()) {
      if (this.isTextLogCalled()) {
        this.textLogCalling = true;
      }
      if (this.textLogCalling && !$gamePlayer.isMoving()) {
        this.callTextLog();
      }
    } else {
      this.textLogCalling = false;
    }
  };

  /**
   * どういうタイミングでバックログを開いても良いか
   *  A マップを移動中（マップイベント実行中でない）
   *  B イベント中かつ、メッセージウィンドウが開いている
   *  C 表示すべきログが１行以上ある
   *  D ログ表示禁止スイッチがOFF
   *  E NobleMushroom.js でセーブ・ロード画面を開いていない
   *  (A || B) && C && D && E
   */
  sceneMap.isTextLogEnabled = function (this: Scene_Map) {
    return (
      (!$gameMap.isEventRunning() || ($gameMap.isEventRunning() && !this._messageWindow.isClosed())) &&
      isTextLogEnabled() &&
      !this.isFileListWindowActive()
    );
  };

  /**
   * NobleMushroom.js でセーブ・ロード画面を開いているかどうか
   */
  sceneMap.isFileListWindowActive = function () {
    return this._fileListWindow && this._fileListWindow.isOpenAndActive();
  };

  sceneMap.isTextLogCalled = function () {
    return settings.openLogKeys.some((openLogKey) => Input.isTriggered(openLogKey));
  };

  sceneMap.callTextLog = function (this: Scene_Map) {
    evacuatedMessageWindow = new EvacuatedMessageWindows(
      this._messageWindow,
      this._scrollTextWindow,
      this._pauseWindow
    );
    SoundManager.playCursor();
    SceneManager.push(Scene_TextLog);
    $gameTemp.clearDestination();
  };
}

Scene_Map_TextLogMixIn(Scene_Map.prototype);

/**
 * Window_ScrollText
 */
const _Window_ScrollText_terminateMessage = Window_ScrollText.prototype.terminateMessage;
Window_ScrollText.prototype.terminateMessage = function () {
  if (
    settings.includeScrollText &&
    (settings.disableLoggingSwitch === 0 || !$gameSwitches.value(settings.disableLoggingSwitch)) &&
    $gameMessage.hasText()
  ) {
    let message = {
      text: '',
    };
    message.text += this.convertEscapeCharacters($gameMessage.allText());
    addTextLog(message.text);
  }
  _Window_ScrollText_terminateMessage.call(this);
};

function Window_Message_TextLogMixIn(windowClass: Window_Message) {
  // Window_Messageの拡張
  // メッセージ表示時にログに追加する
  const _terminateMessage = windowClass.terminateMessage;
  windowClass.terminateMessage = function (this: Window_Message) {
    if (
      (settings.disableLoggingSwitch === 0 || !$gameSwitches.value(settings.disableLoggingSwitch)) &&
      $gameMessage.hasText()
    ) {
      let message = {
        text: '',
      };
      // YEP_MessageCore.js or DarkPlasma_NameWindow.js のネーム表示ウィンドウに対応
      if (this.hasNameWindow() && this._nameWindow!.isOpen() && settings.includeName) {
        const nameColor = this.nameColorInLog(this._nameWindow!.text());
        message.text += `\x1bC[${nameColor}]${this._nameWindow!.text()}\n\x1bC[0]`;
      }
      message.text += this.convertEscapeCharacters($gameMessage.allText());
      addTextLog(message.text);
      if ($gameMessage.isChoice()) {
        this._choiceWindow.addToLog();
      }
    }
    _terminateMessage.call(this);
  };

  // DarkPlasma_NameWindow のネーム表示ウィンドウを使用しているかどうか
  windowClass.hasNameWindow = function () {
    return (
      !!this._nameWindow && PluginManager.isLoadedPlugin('DarkPlasma_NameWindow')
    );
  };

  windowClass.nameColorInLog = function (name) {
    if (PluginManager.isLoadedPlugin('DarkPlasma_NameWindow')) {
      return this.colorByName(name);
    }
    return 0;
  };
}

Window_Message_TextLogMixIn(Window_Message.prototype);

function Window_ChoiceList_TextLogMixIn(windowClass: Window_ChoiceList) {
  const _windowWidth = windowClass.windowWidth;
  windowClass.windowWidth = function (this: Window_ChoiceList) {
    // 再開時に選択肢が開いているとエラーになる不具合対策
    if (!this._windowContentsSprite) {
      return 96;
    }
    return _windowWidth.call(this);
  };

  /**
   * 選択した内容をログに記録する
   */
  windowClass.addToLog = function () {
    const chosenIndex = $gameMessage.chosenIndex()!;
    if (
      settings.includeChoice &&
      (settings.disableLoggingSwitch === 0 || !$gameSwitches.value(settings.disableLoggingSwitch)) &&
      $gameMessage.hasText()
    ) {
      let text = '';
      // MPP_ChoiceEx.js は choiceCancelType を-1ではなく選択肢配列のサイズにする。
      // 競合回避のため、 choiceCancelType を -1 に限定しない判定を行う。
      if (
        chosenIndex === $gameMessage.choiceCancelType() &&
        (chosenIndex < 0 || $gameMessage.choices().length <= chosenIndex)
      ) {
        if (!settings.includeChoiceCancel) {
          return;
        }
        text = settings.choiceCancelText;
      } else {
        text = $gameMessage.choices()[chosenIndex];
      }
      let message = {
        text: settings.choiceFormat.replace(/{choice}/gi, `\x1bC[${settings.choiceColor}]${text}\x1bC[0]`),
      };
      addTextLog(message.text);
    }
  };
}

Window_ChoiceList_TextLogMixIn(Window_ChoiceList.prototype);

const _Game_Message_clear = Game_Message.prototype.clear;
Game_Message.prototype.clear = function () {
  _Game_Message_clear.call(this);
  this._chosenIndex = null;
};

const _Game_Message_onChoice = Game_Message.prototype.onChoice;
Game_Message.prototype.onChoice = function (index) {
  _Game_Message_onChoice.call(this, index);
  this._chosenIndex = index;
};

/**
 * 選択肢で選んだ番号を返す
 */
Game_Message.prototype.chosenIndex = function () {
  return this._chosenIndex;
};

const _Game_Player_reserveTransfer = Game_Player.prototype.reserveTransfer;
Game_Player.prototype.reserveTransfer = function (mapId, x, y, d, fadeType) {
  _Game_Player_reserveTransfer.call(this, mapId, x, y, d, fadeType);
  /**
   * 場所移動時に退避したメッセージウィンドウを初期化する
   * そうしないと、ログウィンドウから戻ったものと判定され、場所移動後にメッセージウィンドウが表示されっぱなしになるケースがある
   */
  evacuatedMessageWindow = null;
};

const _Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function () {
  _Game_System_initialize.call(this);
  initializeCurrentEventLog();
  initializePastEventLog();
  evacuatedMessageWindow = null;
};

const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
Game_System.prototype.onAfterLoad = function () {
  _Game_System_onAfterLoad.call(this);
  initializeCurrentEventLog();
  initializePastEventLog();
  evacuatedMessageWindow = null;
};

/**
 * ログにテキストを記録する
 */
Game_System.prototype.insertTextLog = function (text) {
  addTextLog(text);
};

function Game_Interpreter_TextLogMixIn(gameInterpreter: Game_Interpreter) {
  /**
   * イベント終了時にそのイベントのログを直前のイベントのログとして保持する
   */
  const _terminate = gameInterpreter.terminate;
  gameInterpreter.terminate = function () {
    // 以下の場合はリセットしない
    //  - バトルイベント終了時
    //  - コモンイベント終了時
    //  - 並列イベント終了時
    if (!this.isCommonOrBattleEvent() && !this.isParallelEvent()) {
      moveToPrevLog();
      /**
       * イベント終了時に退避しておいたメッセージウィンドウも破棄する
       */
      evacuatedMessageWindow = null;
    }
    _terminate.call(this);
  };

  // コモンイベントは以下の条件を満たす
  //  A イベント中にcommand117で実行されるコモンイベント（depth > 0）
  //  B IDなし（eventId === 0）
  // A || B
  // ただし、バトルイベントもeventIdが0のため、厳密にその二者を区別はできない
  gameInterpreter.isCommonOrBattleEvent = function (this: Game_Interpreter) {
    return this._depth > 0 || this._eventId === 0;
  };

  // 並列実行イベントかどうか
  // コモンイベントは判定不能のため、isCommonOrBattleEventに任せる
  gameInterpreter.isParallelEvent = function (this: Game_Interpreter) {
    const event = $gameMap.event(this._eventId);
    return event && this.isOnCurrentMap() && event.isTriggerIn([4]);
  };

  const _Game_Interpreter_pluginCommand = gameInterpreter.pluginCommand;
  gameInterpreter.pluginCommand = function (command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    switch (command || '') {
      case 'showTextLog':
        if (isTextLogEnabled()) {
          SceneManager.push(Scene_TextLog);
        }
        break;
      case 'insertLogSplitter':
        addTextLog(settings.logSplitter);
        break;
      case 'insertTextLog':
        addTextLog(args[0]);
        break;
    }
  };
}

Game_Interpreter_TextLogMixIn(Game_Interpreter.prototype);

// Scene_Menu拡張
Scene_Menu.prototype.commandTextLog = function () {
  SceneManager.push(Scene_TextLog);
};

// Window_MenuCommand拡張
Window_MenuCommand.prototype.isTextLogEnabled = function () {
  return isTextLogEnabled();
};

// TouchInput拡張 マウスドラッグ/スワイプ対応
const _TouchInput_clear = TouchInput.clear;
TouchInput.clear = function () {
  _TouchInput_clear.call(this);
  this._deltaX = 0;
  this._deltaY = 0;
};

const _TouchInput_update = TouchInput.update;
TouchInput.update = function () {
  _TouchInput_update.call(this);
  if (!this.isPressed()) {
    this._deltaX = 0;
    this._deltaY = 0;
  }
};

const _TouchInput_onMove = TouchInput._onMove;
TouchInput._onMove = function (x, y) {
  if (this._x !== 0) {
    this._deltaX = x - this._x;
  }
  if (this._y !== 0) {
    this._deltaY = y - this._y;
  }
  _TouchInput_onMove.call(this, x, y);
};

// 上下にドラッグ、スワイプしているかどうか
// 推し続けた時間の剰余を取ってタイミングを調整しているが
// 環境による差異については未検証
TouchInput.isUpMoved = function () {
  return this._deltaY < 0 && this._pressedTime % 10 === 0;
};

TouchInput.isDownMoved = function () {
  return this._deltaY > 0 && this._pressedTime % 10 === 0;
};

type _Scene_TextLog = typeof Scene_TextLog;
type _Window_TextLog = typeof Window_TextLog;
declare global {
  var Scene_TextLog: _Scene_TextLog;
  var Window_TextLog: _Window_TextLog;
  var Game_EventTextLog: typeof EventTextLog;
}
window.Scene_TextLog = Scene_TextLog;
window.Window_TextLog = Window_TextLog;
window.Game_EventTextLog = EventTextLog;
