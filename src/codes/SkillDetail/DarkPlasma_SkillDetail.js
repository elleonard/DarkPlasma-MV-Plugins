import { settings } from "./_build/DarkPlasma_SkillDetail_parameters";

const _DataManager_extractMetadata = DataManager.extractMetadata;
DataManager.extractMetadata = function (data) {
  _DataManager_extractMetadata.call(this, data);
  if (this.isSkill(data)) {
    if (data.meta.Detail) {
      data.detail = String(data.meta.Detail).replace(/^(\r|\n| |\t)+/, '');
    }
  }
};

const _DataManager_isSkill = DataManager.isSkill;
DataManager.isSkill = function (data) {
  return $dataSkills && _DataManager_isSkill.call(this, data);
};

/**
 * @param {Scene_Skill.prototype} sceneSkill
 */
function Scene_Skill_SkillDetailMixIn(sceneSkill) {
  const _create = sceneSkill.create;
  sceneSkill.create = function (){
    _create.call(this);
    this.createDetailWindow();
  };

  const _createItemWindow = sceneSkill.createItemWindow;
  sceneSkill.createItemWindow = function() {
    _createItemWindow.call(this);
    this._itemWindow.setHandler('detail', this.toggleDetailWindow.bind(this));
  };

  sceneSkill.toggleDetailWindow = function() {
    this._itemWindow.activate();
    if (!this._detailWindow.visible) {
      this._detailWindow.show();
      if (settings.hideListWindow) {
        this._itemWindow.hide();
      }
      this._detailWindow.resetCursor();
    } else {
      this._detailWindow.hide();
      this._detailWindow.resetCursor();
      if (settings.hideListWindow) {
        this._itemWindow.show();
      }
    }
  };

  sceneSkill.createDetailWindow = function() {
    this._detailWindowLayer = new WindowLayer();
    this._detailWindowLayer.move(0, 0, Graphics.boxWidth, Graphics.boxHeight);
    this.addChild(this._detailWindowLayer);
    this._detailWindow = new Window_SkillDetail(
      settings.detailWindowRect.x,
      settings.detailWindowRect.y,
      settings.detailWindowRect.width,
      settings.detailWindowRect.height
    );
    this._detailWindowLayer.addChild(this._detailWindow);
    this._itemWindow.setDescriptionWindow(this._detailWindow);
  };
};

Scene_Skill_SkillDetailMixIn(Scene_Skill.prototype);

/**
 * @param {Window_Selectable.prototype} windowClass
 */
function Window_SkillDetailMixIn(windowClass) {
  windowClass.setDescriptionWindow = function(detailWindow) {
    this._detailWindow = detailWindow;
    this.callUpdateHelp();
  };

  const _setHelpWindowItem = windowClass.setHelpWindowItem;
  windowClass.setHelpWindowItem = function(item) {
    _setHelpWindowItem.call(this, item);
    if (this._detailWindow) {
      this._detailWindow.setItem(item);
    }
  };

  const _isCursorMovable = windowClass.isCursorMovable;
  windowClass.isCursorMovable = function () {
    if (this._detailWindow) {
      return _isCursorMovable.call(this) && !this._detailWindow.visible;
    }
    return _isCursorMovable.call(this);
  };

  windowClass.isDetailTriggered = function () {
    return Input.isTriggered(settings.openDetailKey);
  };

  const _isOkEnabled = windowClass.isOkEnabled;
  windowClass.isOkEnabled = function () {
    if (this._detailWindow) {
      return _isOkEnabled.call(this) && !this._detailWindow.visible;
    }
    return _isOkEnabled.call(this);
  };

  const _processHandling = windowClass.processHandling;
  windowClass.processHandling = function () {
    _processHandling.call(this);
    if (this.isOpenAndActive()) {
      if (this.isDetailTriggered()) {
        return this.processDetail();
      }
    }
  };

  windowClass.processDetail = function () {
    if (this.isHandled('detail')) {
      SoundManager.playCursor();
    }
    this.updateInputData();
    this.callDetailHandler();
  };

  const _processCancel = windowClass.processCancel;
  windowClass.processCancel = function () {
    if (this._detailWindow) {
      this._detailWindow.hide();
      this._detailWindow.resetCursor();
    }
    _processCancel.call(this);
  };

  windowClass.callDetailHandler = function () {
    this.callHandler('detail');
  };
};

Window_SkillDetailMixIn(Window_SkillList.prototype);
window.Window_SkillDetailMixIn = Window_SkillDetailMixIn;

class Window_SkillDetail extends Window_Base {
  constructor() {
    super();
    this.initialize.apply(this, arguments);
  }

  /**
   * @param {number} x X座標
   * @param {number} y Y座標
   * @param {number} width 横幅
   * @param {number} height 高さ
   */
  initialize(x, y, width, height) {
    super.initialize(x, y, width, height);
    this._text = '';
    this._handlers = {};
    this.opacity = 255;
    this._cursor = 0;
    this.hide();
  }

  standardPadding() {
    return super.standardPadding() + 8;
  }

  /**
   * @param {string} detail 詳細説明
   */
  drawDetail(detail) {
    this.drawTextEx(detail, this.textPadding(), this.baseLineHeight());
  }

  /**
   * 1行目の描画位置
   * @return {number}
   */
  baseLineHeight() {
    return - this._cursor * this.lineHeight();
  }

  refresh() {
    this.contents.clear();
    this.drawDetail(this._text);
  }

  /**
   * @param {RPG.Skill} item スキルオブジェクト
   */
  setItem(item) {
    this.setText(item && item.detail ? item.detail : '');
  }

  /**
   * @param {string} text テキスト
   */
  setText(text) {
    if (this._text !== text) {
      this._text = text;
      this._textHeight = this.calcHeight();
      this._lineCount = Math.floor(this._textHeight / this.lineHeight());
      this.refresh();
    }
  }

  /**
   * @return {number} 詳細説明テキストの表示高さ
   */
  calcHeight() {
    if (this._text) {
      let textState = { index: 0, x: this.textPadding(), y: 0, left: this.textPadding() };
      textState.text = this.convertEscapeCharacters(this._text);
      textState.height = this.calcTextHeight(textState, false);
      this.resetFontSettings();
      while (textState.index < textState.text.length) {
        this.processCharacter(textState);
      }
      return textState.y;
    }
    return 0;
  }

  /**
   * 1画面で表示する最大行数
   */
  maxLine() {
    return Math.floor(this.contentsHeight() / this.lineHeight());
  }

  clear() {
    this.setText('');
  }

  /**
   * @param {string} symbol シンボル
   * @param {Function} method 関数
   */
  setHandler(symbol, method) {
    this._handlers[symbol] = method;
  }

  /**
   * @param {string} symbol シンボル
   */
  isHandled(symbol) {
    return !!this._handlers[symbol];
  }

  /**
   * @param {string} symbol シンボル
   */
  callHandler(symbol) {
    if (this.isHandled(symbol)) {
      this._handlers[symbol]();
    }
  }

  update() {
    super.update();
    this.updateArrows();
    this.processCursorMove();
  }

  updateArrows() {
    this.upArrowVisible = this._cursor > 0;
    this.downArrowVisible = !this.isCursorMax();
  }

  processCursorMove() {
    if (this.isCursorMovable()) {
      if (Input.isRepeated('down')) {
        this.cursorDown();
      }
      if (Input.isRepeated('up')) {
        this.cursorUp();
      }
    }
  }

  /**
   * @return {boolean}
   */
  isCursorMovable() {
    return this.visible;
  }

  cursorUp() {
    if (this._cursor > 0) {
      this._cursor--;
      this.refresh();
    }
  }

  cursorDown() {
    if (!this.isCursorMax()) {
      this._cursor++;
      this.refresh();
    }
  }

  /**
   * @return {boolean}
   */
  isCursorMax() {
    return this.maxLine() + this._cursor >= this._lineCount;
  }

  resetCursor() {
    if (this._cursor > 0) {
      this._cursor = 0;
      this.refresh();
    }
  }
};

window.Window_SkillDetail = Window_SkillDetail;
