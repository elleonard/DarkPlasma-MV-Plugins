import { settings } from "./_build/DarkPlasma_AutoLineBreak_parameters";

/**
 * @param {Window_Base.prototype} windowClass
 */
function Window_AutoLineBreakMixIn(windowClass) {
  windowClass.ignoreAutoLineBreak = function () {
    return settings.ignoreAutoLineBreakWindows.includes(this.constructor.name);
  };

  /**
   * 自動折り返しが有効であるか
   * 以下の場合は無効
   * - 自動改行しないウィンドウリスト設定に入っている
   * - 自動改行チェックモード中
   * @return {boolean}
   */
  windowClass.isAutoLineBreakEnabled = function () {
    return !this.ignoreAutoLineBreak() && !this._checkAutoLineBreakMode;
  };

  const _processNormalCharacter = windowClass.processNormalCharacter;
  windowClass.processNormalCharacter = function(textState) {
    if (this.mustLineBreak(textState)) {
      // 改行が挟まる分、1つだけテキストを戻す
      textState.index--;
      this.processNewLine(textState);
    } else {
      _processNormalCharacter.call(this, textState);
    }
  };

  /**
   * 自動改行すべきか
   * @param {MV.TextState} textState
   * @return {boolean}
   */
  windowClass.mustLineBreak = function (textState) {
    if (!textState || textState.index === 0) return false;
    if (!this.isAutoLineBreakEnabled()) return false;
    const nextCharacterIndex = textState.index + 1;
    const nextCharacter = textState.text.substring(textState.index, nextCharacterIndex);
    const size = this.textWidthExCheck(nextCharacter);
    if (size + textState.x > this.lineBreakWidth()) {
      return !this.isProhibitLineBreakBefore(nextCharacter);
    }
    // 行末禁則チェック
    const next2Character = textState.text.substring(textState.index, textState.index + 2);
    if (this.textWidthExCheck(next2Character) + textState.x > this.lineBreakWidth()) {
      return this.isProhibitLineBreakAfter(nextCharacter);
    }
    return false;
  };

  /**
   * 行末禁則文字か
   * @param {string} character
   * @return {boolean}
   */
  windowClass.isProhibitLineBreakBefore = function (character) {
    return settings.prohibitLineBreakBefore.includes(character);
  };

  /**
   * 行頭禁則文字か
   * @param {string} character
   * @return {boolean}
   */
  windowClass.isProhibitLineBreakAfter = function (character) {
    return settings.prohibitLineBreakAfter.includes(character);
  };

  /**
   * 折り返し幅
   * @return {number}
   */
  windowClass.lineBreakWidth = function () {
    return this.contentsWidth();
  };

  windowClass.saveCurrentWindowSettings = function () {
    this._saveFontFace = this.contents.fontFace;
    this._saveFontSize = this.contents.fontSize;
    this._savetextColor = this.contents.textColor;
    this._saveFontBold = this.contents.fontBold;
    this._saveFontItalic = this.contents.fontItalic;
    this._saveOutlineColor = this.contents.outlineColor;
    this._saveOutlineWidth = this.contents.outlineWidth;
  };

  windowClass.restoreCurrentWindowSettings = function () {
    this.contents.fontFace = this._saveFontFace;
    this.contents.fontSize = this._saveFontSize;
    this.contents.textColor = this._savetextColor;
    this.contents.fontBold = this._saveFontBold;
    this.contents.fontItalic = this._saveFontItalic;
    this.contents.outlineColor = this._saveOutlineColor;
    this.contents.outlineWidth = this._saveOutlineWidth;
  };

  windowClass.clearCurrentWindowSettings = function () {
    this._saveFontFace = undefined;
    this._saveFontSize = undefined;
    this._savetextColor = undefined;
    this._saveFontBold = undefined;
    this._saveFontItalic = undefined;
    this._saveOutlineColor = undefined;
    this._saveOutlineWidth = undefined;
  };

  /**
   * 指定されたテキストのフォント設定込みの表示幅を返す
   * 
   * drawTextExはフォント設定込みの表示テキスト幅を返す
   * ただし、フォント設定をリセットしてしまうため、一時的に退避しておく必要がある
   * @param {string} text
   * @return {number}
   */
  windowClass.textWidthExCheck = function (text) {
    this.saveCurrentWindowSettings();
    this._checkAutoLineBreakMode = true;
    const value = this.drawTextEx(text, 0, this.contents.height * 2);
    this._checkAutoLineBreakMode = false;
    this.restoreCurrentWindowSettings();
    this.clearCurrentWindowSettings();
    return value;
  };
}

Window_AutoLineBreakMixIn(Window_Base.prototype);

/**
 * @param {Window_Message.prototype} windowClass
 */
function Window_Message_AutoLineBreakMixIn(windowClass) {
  const _processNewPage = windowClass.processNewPage;
  windowClass.processNewPage = function(textState) {
    // チェックモードではindexを進める以上の副作用を起こさない
    if (this._checkAutoLineBreakMode) {
      Window_Base.prototype.processNewPage.call(this, textState);
    } else {
      _processNewPage.call(this, textState);
    }
  };
};

Window_Message_AutoLineBreakMixIn(Window_Message.prototype);

/**
 * @param {Window_Base.prototype} windowClass
 */
function Window_IgnoreAutoLineBreakMixIn(windowClass) {
  windowClass.ignoreAutoLineBreak = function () {
    return true;
  }
}

/**
 * デフォルトで自動折り返しを行わないウィンドウ
 */
Window_IgnoreAutoLineBreakMixIn(Window_ChoiceList.prototype);
Window_IgnoreAutoLineBreakMixIn(Window_BattleLog.prototype);
