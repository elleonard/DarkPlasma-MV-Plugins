// DarkPlasma_TextLog 3.2.0
// Copyright (c) 2017 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2024/10/11 3.2.0 Game_EventTextLogクラスを公開
 * 2024/10/08 3.1.1 表示行数の設定が少ない場合に、カーソル位置とスクロール可否の計算結果が異常になる不具合を修正
 * 2023/11/24 3.1.0 Scene_TextLog クラスを公開
 * 2023/11/23 3.0.0 typescript移行
 *                  YEP_MessageCore対応をオミット
 *                  スワイプの挙動を逆方向に変更
 * 2022/07/15 2.2.0 メニュー禁止でもログを開けるように変更
 * 2022/07/10 2.1.0 \XXX[YYY]のYYYをログから消す設定を追加
 * 2021/11/26 2.0.0 rollup構成へ移行
 *                  戦闘終了時に自動で区切り線を入れる設定を追加
 *                  ログ開閉キーを複数設定できるように変更
 *                  不要な機能を削除
 * 2021/07/07 1.12.0 ログシーンの背景画像設定を追加
 *                   ログウィンドウ枠非表示設定を追加
 * 2021/07/05 1.11.0 ログウィンドウの標準フォントサイズ設定を追加
 * 2021/01/19 1.10.2 EventReSpawn.js でイベントを削除した場合にエラーになる不具合を修正
 * 2020/08/09 1.10.1 NobleMushroom.js と併用した際に、場所移動後にウィンドウが表示され続ける不具合を修正
 * 2020/08/07 1.10.0 テキストログウィンドウ拡張用インターフェースを公開
 * 2020/08/05 1.9.1 MPP_ChoiceEx.js との競合を解消
 * 2020/06/23 1.9.0 プラグインコマンドでログを追加する機能を追加
 *                  外部向けログ追加インターフェース公開
 *            1.8.3 DarkPlasma_WordWrapForJapanese.js 等と併用しないとエラーになる不具合を修正
 * 2020/06/03 1.8.2 NobleMushroom.js と併用した際に、セーブ・ロード画面でログを開ける不具合を修正
 *            1.8.1 NobleMushroom.js と併用した際に、ポーズメニューでフリーズする不具合を修正
 *                  タイトルに戻ってニューゲーム/ロードした際に、直前のデータのログを引き継ぐ不具合を修正
 * 2020/05/30 1.8.0 ログから戻った際に最後のメッセージを再表示しない設定を追加
 *                  スクロールテキストをログに含める設定を追加
 *                  選択肢をログに含める設定を追加
 *                  高さ計算ロジックを整理
 * 2020/05/09 1.7.3 ログ表示/スクロール処理を軽量化
 *            1.7.2 ログ保存イベント数を超えるとログが壊れる不具合を修正
 * 2020/05/08 1.7.1 軽微なリファクタ
 *            1.7.0 名前ウィンドウの名前をログに含める設定を追加
 * 2020/03/09 1.6.4 プラグインが無効の状態で読み込まれていても有効と判定される不具合を修正
 * 2020/01/28 1.6.3 文章を表示しないイベントに自動区切り線を入れないよう修正
 * 2020/01/27 1.6.2 決定キーでログウィンドウを閉じられるよう修正
 *                  ログ開閉キーにpagedownキーを設定できるよう修正
 *            1.6.1 ログ表示時の順序が逆になる不具合を修正
 *                  DarkPlasma_WordWrapForJapanese（1.0.2以降）に対応
 *            1.6.0 ログウィンドウを開くボタンでログウィンドウを閉じられるよう修正
 *                  メッセージ同士の間隔やテキストログの行間の設定項目を追加
 *                  DarkPlasma_NameWindowに対応できていなかった不具合を修正
 *                  記録できるイベントログ数を無制限に変更
 *                  記録できるイベント数、メッセージ数の設定を追加
 *                  イベントごとにログを区切る機能を追加
 * 2020/01/23 1.5.3 選択肢が開いている最中にログウィンドウを開いて戻ろうとするとエラーで落ちる不具合を修正
 * 2020/01/18 1.5.2 DarkPlasma_NameWindowに対応
 * 2017/10/07 1.5.1 冗長な変数名を修正
 *                  パラメータの型を明示
 * 2017/07/09 1.5.0 マウスドラッグやスワイプでログウィンドウをスクロールする機能のおためし版を実装
 *            1.4.0 ログウィンドウがスクロール可能な場合にスクロール可能アイコンを表示する機能を実装
 *            1.3.0 ログが空の場合にメニューからログウィンドウを開こうとするとフリーズする不具合を修正
 *                  空のログウィンドウ表示可否フラグを実装
 * 2017/07/08 1.2.1 選択肢でログに空文字列が記録される不具合を修正
 *                  ログが空でもメニューやプラグインコマンドから開けた不具合を修正
 * 2017/07/07 1.2.0 プラグインコマンドからテキストログを開く機能を実装
 *                  スイッチによるログ表示可能フラグON/OFF機能を実装
 *            1.1.0 スイッチによるログ記録のON/OFF機能を実装
 *                  テキストログを開くボタンの変更機能を実装
 *                  マウススクロールでもログのスクロールできる機能を実装
 *                  マウス右クリックでもログを閉じることができる機能を実装
 *                  マップ移動時にエラーで落ちる不具合を修正
 *                  YEP_MainMenuManager.js に対応
 * 2017/07/06 1.0.3 並列イベント終了時にログをリセットしないよう修正
 *                  ブザーフラグが正しく動作していなかった不具合を修正
 *            1.0.2 バトルイベント終了時、コモンイベント終了時にログをリセットしないよう修正
 *                  長いイベントのログが正常にスクロールできていない不具合を修正
 *            1.0.1 デフォルトには存在しないメソッドを使用していた不具合を修正
 * 2017/07/05 1.0.0 公開
 */

/*:
 * @plugindesc テキストログを保持・表示する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param maxVisibleMessages
 * @desc 1画面に表示する最大のメッセージ数を設定します。
 * @text 1画面のメッセージ数上限
 * @type number
 * @default 16
 *
 * @param standardFontSize
 * @desc ログウィンドウの標準フォントサイズを設定します。0でツクールのデフォルトを継承します。
 * @text 標準フォントサイズ
 * @type number
 * @default 0
 *
 * @param disableLoggingSwitch
 * @desc 設定したスイッチがONの間はログを残しません。0の場合、常にログを残します。
 * @text ログ記録無効スイッチ
 * @type switch
 * @default 0
 *
 * @param openLogKeys
 * @desc テキストログウィンドウを開閉するためのボタンを設定します。
 * @text ログ開閉ボタン
 * @type select[]
 * @default ["pageup"]
 *
 * @param disableLogWindowSwitch
 * @desc 設定したスイッチがONの間はログウィンドウを開けません。0の場合、常に開けます。
 * @text ログウィンドウ無効スイッチ
 * @type switch
 * @default 0
 *
 * @param showLogWindowWithoutText
 * @desc ONの場合、ログに表示すべきテキストがない場合でもログウィンドウを開けます。
 * @text 白紙ログでも開く
 * @type boolean
 * @default true
 *
 * @param lineSpacing
 * @desc ログの行間を設定します。
 * @text ログの行間
 * @type number
 * @default 0
 *
 * @param messageSpacing
 * @desc ログのメッセージの間隔を設定します。メッセージはイベントコマンド単位でひとかたまりです。
 * @text メッセージ間隔
 * @type number
 * @default 0
 *
 * @param logSplitter
 * @desc イベントの切れ目などに挟むための区切り線を設定します。
 * @text ログ区切り線
 * @type string
 * @default -------------------------------------------------------
 *
 * @param autoSplit
 * @desc ONの場合、バトル、コモン、並列イベントを除くイベント終了時に区切り線を自動で入れます。
 * @text 自動区切り線
 * @type boolean
 * @default true
 *
 * @param autoSplitWhenBattleEnd
 * @desc ONの場合、戦闘終了時に区切り線を自動で入れます。
 * @text 戦闘終了時区切り線
 * @type boolean
 * @default true
 *
 * @param includeName
 * @desc ONの場合、名前ウィンドウの名前をログに含めます。
 * @text 名前をログに含む
 * @type boolean
 * @default true
 *
 * @param includeScrollText
 * @desc ONの場合、スクロールテキストをログに含めます。
 * @text スクロールテキストをログに含む
 * @type boolean
 * @default false
 *
 * @param includeChoice
 * @desc ONの場合、選んだ選択肢をログに含めます。
 * @text 選んだ選択肢をログに含む
 * @type boolean
 * @default true
 *
 * @param choiceFormat
 * @desc ログに表示する選択肢のフォーマットを設定します。{choice}は選んだ選択肢に変換されます。
 * @text 選択肢フォーマット
 * @type string
 * @default 選択肢:{choice}
 *
 * @param choiceColor
 * @desc ログに表示する選択肢の色を設定します。
 * @text 選択肢色
 * @type number
 * @default 17
 *
 * @param includeChoiceCancel
 * @desc ONの場合、選択肢をキャンセルしたことをログに含めます。選んだ選択肢をログに含むがONの場合のみ有効です。
 * @text キャンセルをログに含む
 * @type boolean
 * @default true
 *
 * @param choiceCancelText
 * @desc 選択肢をキャンセルした際に記録する内容を設定します。
 * @text キャンセルログ
 * @type string
 * @default キャンセル
 *
 * @param smoothBackFromLog
 * @desc ONの場合、ログシーンから戻った際にテキストを再度表示し直しません。
 * @text テキスト再表示なし
 * @type boolean
 * @default true
 *
 * @param backgroundImage
 * @desc ログシーンに表示する背景画像を設定します。
 * @text 背景画像
 * @type file
 * @dir img
 *
 * @param showLogWindowFrame
 * @desc ONの場合、ログウィンドウ枠を表示します。
 * @text ウィンドウ枠表示
 * @type boolean
 * @default true
 *
 * @param escapeCharacterCodes
 * @desc \XXX[YYY]の形式でYYYをログから消したい場合、ここにXXXを追加します。
 * @text パラメータを除外したい制御文字
 * @type string[]
 * @default []
 *
 * @help
 * version: 3.2.0
 * イベントのテキストログを表示します。
 *
 * イベント会話中またはマップ上で pageup キー（L2ボタン）でログを表示します。
 * イベント会話中はそのイベントの直前までのログを表示します。
 * ログは上下キーでスクロールすることができます。
 * キャンセルキーやログ開閉キーでログから抜け、イベントやマップに戻ります。
 *
 * 注意: テキスト再表示なしをONにしている場合、
 * Scene_Map.prototype.createMessageWindow 及び
 * Scene_Map.prototype.createScrollTextWindow の処理を上書きします。
 * これらの関数に処理を加えているプラグインとは競合する恐れがありますので、
 * それらよりも下にこのプラグインを追加してください。
 * この設定がOFFになっている場合、
 * イベントに戻る際、最後のメッセージをもう一度最初から流します。
 *
 * メニュー拡張系のプラグインでは、
 * 下記スクリプトからログを開くことができます。
 *  this.commandTextLog.bind(this)
 *
 * プラグインコマンド showTextLog から開くことも可能です。
 *
 * プラグインコマンド insertLogSplitter を使用することで、
 * イベントログに区切り線を追加できます。
 * 自動イベント区切り線 設定をONにしておくことで、
 * イベントごとに自動で区切り線を挿入させることもできます。
 *
 * プラグインコマンド insertTextLog XXXX を使用することで、
 * イベントログに任意のログを追加できます。
 *
 * 操作方法（デフォルト）
 *  pageupキー（L2ボタン） : ログを表示する
 *  上下キー/マウススクロール : ログをスクロールする
 *  キャンセルキー/右クリック : ログから抜ける
 *
 * マウスドラッグやスワイプでもログをスクロールできますが、
 * 環境差異に関して未検証なのでおためし版です。
 * しばらく使われて問題が報告されなければ正式版とします。
 *
 * 外部向けインターフェース
 *  $gameSystem.insertTextLog(text): ログに文字列 text を追加します。
 *
 * 拡張プラグインを書くことで、テキストログウィンドウにおける
 * エスケープ文字の複雑な挙動を定義できます。
 * 詳細は DarkPlasma_TextLogExtensionExample.js を参照してください。
 */

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    maxVisibleMessages: Number(pluginParameters.maxVisibleMessages || 16),
    standardFontSize: Number(pluginParameters.standardFontSize || 0),
    disableLoggingSwitch: Number(pluginParameters.disableLoggingSwitch || 0),
    openLogKeys: JSON.parse(pluginParameters.openLogKeys || '["pageup"]').map((e) => {
      return String(e || '');
    }),
    disableLogWindowSwitch: Number(pluginParameters.disableLogWindowSwitch || 0),
    showLogWindowWithoutText: String(pluginParameters.showLogWindowWithoutText || true) === 'true',
    lineSpacing: Number(pluginParameters.lineSpacing || 0),
    messageSpacing: Number(pluginParameters.messageSpacing || 0),
    logSplitter: String(pluginParameters.logSplitter || '-------------------------------------------------------'),
    autoSplit: String(pluginParameters.autoSplit || true) === 'true',
    autoSplitWhenBattleEnd: String(pluginParameters.autoSplitWhenBattleEnd || true) === 'true',
    includeName: String(pluginParameters.includeName || true) === 'true',
    includeScrollText: String(pluginParameters.includeScrollText || false) === 'true',
    includeChoice: String(pluginParameters.includeChoice || true) === 'true',
    choiceFormat: String(pluginParameters.choiceFormat || '選択肢:{choice}'),
    choiceColor: Number(pluginParameters.choiceColor || 17),
    includeChoiceCancel: String(pluginParameters.includeChoiceCancel || true) === 'true',
    choiceCancelText: String(pluginParameters.choiceCancelText || 'キャンセル'),
    smoothBackFromLog: String(pluginParameters.smoothBackFromLog || true) === 'true',
    backgroundImage: String(pluginParameters.backgroundImage || ''),
    showLogWindowFrame: String(pluginParameters.showLogWindowFrame || true) === 'true',
    escapeCharacterCodes: JSON.parse(pluginParameters.escapeCharacterCodes || '[]').map((e) => {
      return String(e || '');
    }),
  };

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
    addMessageLog(text) {
      this._messages.push(new LogMessage(text));
    }
  }
  /**
   * ログメッセージ
   */
  class LogMessage {
    constructor(text) {
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
    setHeight(height) {
      this._height = height;
    }
    get height() {
      return this._height;
    }
    /**
     * 表示開始Y座標を調整したいとき用
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
    setHandler(symbol, method) {
      this._handlers[symbol] = method;
    }
    /**
     * 指定したシンボルでハンドラが登録されているか
     */
    isHandled(symbol) {
      return !!this._handlers[symbol];
    }
    /**
     * 指定したシンボルのハンドラを呼び出す\
     */
    callHandler(symbol) {
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
  /**
   * テキストログを追加する
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
  let evacuatedMessageWindow = null;
  function Scene_Map_TextLogMixIn(sceneMap) {
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
    sceneMap.createMessageWindow = function () {
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
        _createMessageWindow.call(this);
      }
    };
    const _createScrollTextWindow = sceneMap.createScrollTextWindow;
    sceneMap.createScrollTextWindow = function () {
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
        sceneMap.onMapLoaded = function () {
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
    sceneMap.isTextLogEnabled = function () {
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
    sceneMap.callTextLog = function () {
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
  function Window_Message_TextLogMixIn(windowClass) {
    // Window_Messageの拡張
    // メッセージ表示時にログに追加する
    const _terminateMessage = windowClass.terminateMessage;
    windowClass.terminateMessage = function () {
      if (
        (settings.disableLoggingSwitch === 0 || !$gameSwitches.value(settings.disableLoggingSwitch)) &&
        $gameMessage.hasText()
      ) {
        let message = {
          text: '',
        };
        // YEP_MessageCore.js or DarkPlasma_NameWindow.js のネーム表示ウィンドウに対応
        if (this.hasNameWindow() && this._nameWindow.isOpen() && settings.includeName) {
          const nameColor = this.nameColorInLog(this._nameWindow.text());
          message.text += `\x1bC[${nameColor}]${this._nameWindow.text()}\n\x1bC[0]`;
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
      return !!this._nameWindow && PluginManager.isLoadedPlugin('DarkPlasma_NameWindow');
    };
    windowClass.nameColorInLog = function (name) {
      if (PluginManager.isLoadedPlugin('DarkPlasma_NameWindow')) {
        return this.colorByName(name);
      }
      return 0;
    };
  }
  Window_Message_TextLogMixIn(Window_Message.prototype);
  function Window_ChoiceList_TextLogMixIn(windowClass) {
    const _windowWidth = windowClass.windowWidth;
    windowClass.windowWidth = function () {
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
  function Game_Interpreter_TextLogMixIn(gameInterpreter) {
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
    gameInterpreter.isCommonOrBattleEvent = function () {
      return this._depth > 0 || this._eventId === 0;
    };
    // 並列実行イベントかどうか
    // コモンイベントは判定不能のため、isCommonOrBattleEventに任せる
    gameInterpreter.isParallelEvent = function () {
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
  window.Scene_TextLog = Scene_TextLog;
  window.Window_TextLog = Window_TextLog;
  window.Game_EventTextLog = EventTextLog;
})();
