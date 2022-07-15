import { settings } from './_build/DarkPlasma_TextLog_parameters';

/**
 * プラグインがロードされているかどうか
 * @param {string} name プラグインの名前
 * @return {boolean}
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
  constructor() {
    this.initialize();
  }

  initialize() {
    this._messages = [];
  }

  /**
   * @return {LogMessage[]}
   */
  get messages() {
    return this._messages;
  }

  /**
   * @return {number}
   */
  get messageLength() {
    return this._messages.length;
  }

  /**
   * ログを追加する
   * @param {string} text テキスト
   */
  addMessageLog(text) {
    this._messages.push(new LogMessage(text));
  }
}

/**
 * ログメッセージ
 */
class LogMessage {
  /**
   * @param {string} text テキスト
   */
  constructor(text) {
    this._text = text;
    this._height = 0;
    this._offsetY = 0;
  }

  /**
   * @return {string}
   */
  get text() {
    return this._text;
  }

  /**
   * ログウィンドウに表示する際の高さを記録する
   * （再計算の処理が重いため、一度だけ計算する）
   * @param {number} height 表示高さ
   */
  setHeight(height) {
    this._height = height;
  }

  get height() {
    return this._height;
  }

  /**
   * 表示開始Y座標を調整したいとき用
   * @param {number} offsetY Yオフセット
   */
  setOffsetY(offsetY) {
    this._offsetY = offsetY;
  }

  get offsetY() {
    return this._offsetY;
  }
}

/**
 * @type {EventTextLog}
 */
let currentEventLog = new EventTextLog();
/**
 * @type {EventTextLog[]}
 */
let pastEventLog = [];

// ログ表示用シーン
class Scene_TextLog extends Scene_Base {
  constructor() {
    super();
    this.initialize.apply(this, arguments);
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
   * @return {Bitmap}
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
  constructor() {
    super();
    this.initialize.apply(this, arguments);
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
    this._maxViewCount = settings.maxVisibleMessages;
  }

  /**
   * @return {number}
   */
  standardFontSize() {
    return settings.standardFontSize ? settings.standardFontSize : super.standardFontSize();
  }

  /**
   * @return {number}
   */
  cursor() {
    return this._cursor;
  }

  /**
   * ハンドラを登録する
   * @param {string} symbol シンボル
   * @param {Function} method メソッド
   */
  setHandler(symbol, method) {
    this._handlers[symbol] = method;
  }

  /**
   * 指定したシンボルでハンドラが登録されているか
   * @param {string} symbol シンボル
   */
  isHandled(symbol) {
    return !!this._handlers[symbol];
  }

  /**
   * 指定したシンボルのハンドラを呼び出す
   * @param {string} symbol シンボル
   */
  callHandler(symbol) {
    if (this.isHandled(symbol)) {
      this._handlers[symbol]();
    }
  }

  /**
   * @return {boolean}
   */
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
   * @return {boolean}
   */
  isCursorMax() {
    const size = this._viewTexts.length;
    let height = 0;
    for (let i = this.cursor(); i < size; i++) {
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
    if (this.cursor() > 0) {
      this._cursor--;
    }
  }

  processCursorMove() {
    if (this.isCursorMovable()) {
      const lastCursor = this.cursor();
      let moved = false;
      if (Input.isRepeated('down') || TouchInput.wheelY > 0 || TouchInput.isDownMoved()) {
        this.cursorDown();
        moved = true;
      }
      if (Input.isRepeated('up') || TouchInput.wheelY < 0 || TouchInput.isUpMoved()) {
        this.cursorUp();
        moved = true;
      }
      this._needRefresh = lastCursor !== this.cursor();
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

  /**
   * @return {boolean}
   */
  isCancelEnabled() {
    return this.isHandled('cancel');
  }

  /**
   * @return {boolean}
   */
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
    this.upArrowVisible = this.cursor() > 0;
    this.downArrowVisible = !this.isCursorMax();
  }

  refresh() {
    this.contents.clear();
    this.drawTextLog();
  }

  drawTextLog() {
    let height = 0;
    for (let i = this.cursor(); i < this.cursor() + this._maxViewCount; i++) {
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
   * @return {number}
   */
  calcDefaultCursor() {
    let height = 0;
    const size = this._viewTexts.length;
    for (let i = 0; i < size; i++) {
      const viewText = this._viewTexts[size - 1 - i];
      viewText.setHeight(this.calcMessageHeight(viewText.text));
      height += viewText.height;
      if (height > Graphics.boxHeight - this.lineHeight()) {
        return i > 0 ? size - i : size - 1;
      }
    }
    return 0;
  }

  /**
   * @return {number}
   */
  lineHeight() {
    return this.contents.fontSize + settings.lineSpacing;
  }

  /**
   * メッセージの表示高さを計算する
   * @param {string} text テキスト
   * @return {number}
   */
  calcMessageHeight(text) {
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
  drawTextEx(text, x, y) {
    if (this._calcMode) {
      /**
       * 計算モード時には描画しない
       */
      let drawFunction = this.contents.drawText;
      this.contents.drawText = function () {};
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
  calcTextHeight(textState, all) {
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
  processNewLine(textState) {
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
  processEscapeCharacter(code, textState) {
    super.processEscapeCharacter(code, textState);
    if (settings.escapeCharacterCodes.includes(code)) {
      this.obtainEscapeParamTexts(textState);
    }
  }

  /**
   * [YYY]のYYYを取り出し、カンマ区切りで配列化して返す
   * @param {MV.TextState} textState
   * @return {string[]}
   */
  obtainEscapeParamTexts(textState) {
    const arr = /^\[(.+?)\]/.exec(textState.text.slice(textState.index));
    if (arr) {
      textState.index += arr[0].length;
      return arr[1].split(',');
    } else {
      return [];
    }
  }
}

window[Window_TextLog.name] = Window_TextLog;

/**
 * テキストログを追加する
 * @param {string} text ログに追加する文字列
 */
function addTextLog(text) {
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
  /**
   * @param {Window_Message} messageWindow メッセージウィンドウ
   * @param {Window_ScrollText} scrollTextWindow スクロールテキストウィンドウ
   * @param {Window_PauseMenu} pauseWindow ポーズメニューウィンドウ（NobleMushroom.js 用）
   */
  constructor(messageWindow, scrollTextWindow, pauseWindow) {
    this._messageWindow = messageWindow;
    this._scrollTextWindow = scrollTextWindow;
    this._pauseWindow = pauseWindow;
  }

  /**
   * @return {Window_Message}
   */
  get messageWindow() {
    return this._messageWindow;
  }

  /**
   * @return {Window_ScrollText}
   */
  get scrollTextWindow() {
    return this._scrollTextWindow;
  }

  /**
   * @return {Window_PauseMenu}
   */
  get pauseWindow() {
    return this._pauseWindow;
  }
}

/**
 * @type {EvacuatedMessageWindows}
 */
let evacuatedMessageWindow = null;

// Scene_Mapの拡張
const _Scene_Map_start = Scene_Map.prototype.start;
Scene_Map.prototype.start = function () {
  _Scene_Map_start.call(this);

  // 呼び出し中フラグの初期化
  this.textLogCalling = false;
};

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function () {
  // isSceneChangeOK時はイベント中も含まれるため、特殊な条件で許可する
  if (this.isActive() && !SceneManager.isSceneChanging()) {
    this.updateCallTextLog();
  }
  _Scene_Map_update.call(this);
};

const _Scene_Map_createMessageWindow = Scene_Map.prototype.createMessageWindow;
Scene_Map.prototype.createMessageWindow = function () {
  /**
   * ログシーンからスムーズに戻るために、処理を上書きして
   * Windowインスタンスを新しく作らないようにする
   */
  if (settings.smoothBackFromLog && evacuatedMessageWindow) {
    this._messageWindow = evacuatedMessageWindow.messageWindow;
    this.addWindow(this._messageWindow);
    this._messageWindow.subWindows().forEach(function (window) {
      this.addWindow(window);
    }, this);
  } else {
    _Scene_Map_createMessageWindow.call(this);
  }
};

const _Scene_Map_createScrollTextWindow = Scene_Map.prototype.createScrollTextWindow;
Scene_Map.prototype.createScrollTextWindow = function () {
  /**
   * ログシーンからスムーズに戻るために、処理を上書きして
   * Windowインスタンスを新しく作らないようにする
   */
  if (settings.smoothBackFromLog && evacuatedMessageWindow) {
    this._scrollTextWindow = evacuatedMessageWindow.scrollTextWindow;
    this.addWindow(this._scrollTextWindow);
  } else {
    _Scene_Map_createScrollTextWindow.call(this);
  }
};

if (PluginManager.isLoadedPlugin('NobleMushroom')) {
  /**
   * ハンドラを更新する
   */
  Scene_Map.prototype.refreshPauseWindowHandlers = function () {
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
  if (Scene_Map.prototype.createPauseWindow) {
    const _Scene_Map_createPauseWindow = Scene_Map.prototype.createPauseWindow;
    Scene_Map.prototype.createPauseWindow = function () {
      /**
       * ログシーンからスムーズに戻るために、処理を上書きして
       * Windowインスタンスを新しく作らないようにする
       */
      if (settings.smoothBackFromLog && evacuatedMessageWindow) {
        this._pauseWindow = evacuatedMessageWindow.pauseWindow;
        this.refreshPauseWindowHandlers();
        this.addWindow(this._pauseWindow);
      } else {
        _Scene_Map_createPauseWindow.call(this);
      }
    };
  } else {
    const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function () {
      _Scene_Map_onMapLoaded.call(this);
      if (settings.smoothBackFromLog && evacuatedMessageWindow) {
        this._windowLayer.removeChild(this._pauseWindow);
        this._pauseWindow = evacuatedMessageWindow.pauseWindow;
        this.refreshPauseWindowHandlers();
        this.addWindow(this._pauseWindow);
      }
    };
  }
}

Scene_Map.prototype.updateCallTextLog = function () {
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
Scene_Map.prototype.isTextLogEnabled = function () {
  return (
    (!$gameMap.isEventRunning() || ($gameMap.isEventRunning() && !this._messageWindow.isClosed())) &&
    isTextLogEnabled() &&
    !this.isFileListWindowActive()
  );
};

/**
 * NobleMushroom.js でセーブ・ロード画面を開いているかどうか
 * @return {boolean}
 */
Scene_Map.prototype.isFileListWindowActive = function () {
  return this._fileListWindow && this._fileListWindow.isOpenAndActive();
};

Scene_Map.prototype.isTextLogCalled = function () {
  return settings.openLogKeys.some((openLogKey) => Input.isTriggered(openLogKey));
};

Scene_Map.prototype.callTextLog = function () {
  evacuatedMessageWindow = new EvacuatedMessageWindows(this._messageWindow, this._scrollTextWindow, this._pauseWindow);
  SoundManager.playCursor();
  SceneManager.push(Scene_TextLog);
  $gameTemp.clearDestination();
};

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

// Window_Messageの拡張
// メッセージ表示時にログに追加する
const _Window_Message_terminateMessage = Window_Message.prototype.terminateMessage;
Window_Message.prototype.terminateMessage = function () {
  if (
    (settings.disableLoggingSwitch === 0 || !$gameSwitches.value(settings.disableLoggingSwitch)) &&
    $gameMessage.hasText()
  ) {
    let message = {
      text: '',
    };
    // YEP_MessageCore.js or DarkPlasma_NameWindow.js のネーム表示ウィンドウに対応
    if (this.hasNameWindow() && this._nameWindow.isOpen() && settings.includeName) {
      const nameColor = this.nameColorInLog(this._nameWindow._text);
      message.text += `\x1bC[${nameColor}]${this._nameWindow._text}\n\x1bC[0]`;
    }
    message.text += this.convertEscapeCharacters($gameMessage.allText());
    addTextLog(message.text);
    if ($gameMessage.isChoice()) {
      this._choiceWindow.addToLog();
    }
  }
  _Window_Message_terminateMessage.call(this);
};

// YEP_MessageCore.js や DarkPlasma_NameWindow のネーム表示ウィンドウを使用しているかどうか
Window_Message.prototype.hasNameWindow = function () {
  return (
    this._nameWindow && (typeof Window_NameBox !== 'undefined' || PluginManager.isLoadedPlugin('DarkPlasma_NameWindow'))
  );
};

Window_Message.prototype.nameColorInLog = function (name) {
  if (PluginManager.isLoadedPlugin('DarkPlasma_NameWindow')) {
    return this.colorByName(name);
  }
  if (Yanfly && Yanfly.Param && Yanfly.Param.MSGNameBoxColor) {
    return Yanfly.Param.MSGNameBoxColor;
  }
  return 0;
};

const _Window_ChoiceList_windowWidth = Window_ChoiceList.prototype.windowWidth;
Window_ChoiceList.prototype.windowWidth = function () {
  // 再開時に選択肢が開いているとエラーになる不具合対策
  if (!this._windowContentsSprite) {
    return 96;
  }
  return _Window_ChoiceList_windowWidth.call(this);
};

/**
 * 選択した内容をログに記録する
 */
Window_ChoiceList.prototype.addToLog = function () {
  const chosenIndex = $gameMessage.chosenIndex();
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
 * @return {number|null}
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
 * @param {string} text ログに記録したいテキスト
 */
Game_System.prototype.insertTextLog = function (text) {
  addTextLog(text);
};

/**
 * イベント終了時にそのイベントのログを直前のイベントのログとして保持する
 */
const _Game_Interpreter_terminate = Game_Interpreter.prototype.terminate;
Game_Interpreter.prototype.terminate = function () {
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
  _Game_Interpreter_terminate.call(this);
};

// コモンイベントは以下の条件を満たす
//  A イベント中にcommand117で実行されるコモンイベント（depth > 0）
//  B IDなし（eventId === 0）
// A || B
// ただし、バトルイベントもeventIdが0のため、厳密にその二者を区別はできない
Game_Interpreter.prototype.isCommonOrBattleEvent = function () {
  return this._depth > 0 || this._eventId === 0;
};

// 並列実行イベントかどうか
// コモンイベントは判定不能のため、isCommonOrBattleEventに任せる
Game_Interpreter.prototype.isParallelEvent = function () {
  const event = $gameMap.event(this._eventId);
  return event && this.isOnCurrentMap() && event.isTriggerIn([4]);
};

const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
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
