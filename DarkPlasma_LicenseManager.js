// DarkPlasma_LicenseManager 2.0.0
// Copyright (c) 2017 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/10/30 2.0.0 rollup構成へ移行
 * 2019/08/23 1.0.2 最新のNW.jsに対応
 * 2018/10/23 1.0.1 表示すべきプラグインがすべて除外されている著者が表示される不具合の修正
 * 2017/11/23 1.0.0 公開
 */

/*:ja
 * @plugindesc プラグインのライセンスをゆるく管理する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param licenseMenuOnTitle
 * @desc ライセンス表示メニューをタイトルに表示します。
 * @text 表示メニューをタイトルに
 * @type boolean
 * @default true
 *
 * @param excludePlugins
 * @desc ライセンス表示から除外するプラグインの名前を指定します。（例 DarkPlasma_LicenseManager）
 * @text 表示除外プラグイン一覧
 * @type string[]
 * @default []
 *
 * @param explicitLicenses
 * @desc 明示的にライセンス設定をします。自動で読み取れない場合にご利用ください。
 * @text ライセンスの明示的設定
 * @type struct<ExplicitLicense>[]
 * @default []
 *
 * @param convertAuthorRules
 * @desc 多言語対応していたり、同一作者でも設定の表記揺れがある場合にご利用ください。
 * @text 著者名変換規則
 * @type struct<ConvertAuthorRule>[]
 * @default []
 *
 * @help
 * version: 2.0.0
 * このプラグインはオープンソースライセンスをゆるく運用するためのものです。
 * （厳密に運用するためのものでないことに注意してください）
 * 読み込んでいるプラグインの著作権表示、ライセンス、必要に応じて
 * ライセンス全文が記されたウェブサイトへのURLを表示します。
 * ただし、すべてのプラグインについて
 * 正しく著作権表示やライセンスを読み取れるわけではありません。
 *
 * 本来のオープンソースライセンスの考え方に基づくのであれば、著作権表記、
 * ライセンス、ライセンス全文が記されたウェブサイトへのURLを
 * 記述するだけでは不十分です。
 * ウェブサイトにおいて、恒常的にライセンスの全文が得られる保証はないからです。
 * もしもオープンソースライセンスを厳密に運用するのであれば、
 * 別途ライセンス全文をコピーしたテキストを用意してください。
 *
 * 独自ソースのプラグインで著作権表示やライセンスを秘匿しておきたい場合、
 * プラグインコメントに先頭にアットマークをつけて以下のように記述すると
 * 表示から除外されます
 *
 * excludeLicenseManager
 *
 * （このプラグインを除外しないためにアットマークを省いています）
 *
 * ライセンス表示文を表すJSONはデバッグモード起動時に
 * 存在しなければデフォルトセットで生成します。
 * data/License.json に記録されます。
 */
/*~struct~ExplicitLicense:
 * @param licenseType
 * @desc ライセンス種別を選択します。
 * @text ライセンス種別
 * @type select
 * @option MIT
 * @option CC0
 * @option public domain
 * @option NYSL 0.9982
 * @option WTFPL
 * @option BSD-2-Clause
 * @option BSD-3-Clause
 * @option GPL 3.0
 * @option No License
 * @default MIT
 *
 * @param plugins
 * @desc このライセンスに設定したいプラグイン名を指定します。
 * @text プラグイン一覧
 * @type string[]
 * @default []
 */
/*~struct~ConvertAuthorRule:
 * @param to
 * @desc 画面上に表示する著者名を指定します。
 * @text 表示上の名前
 * @type string
 *
 * @param from
 * @desc プラグインに設定された著者名を指定します。
 * @text 設定上の名前
 * @type string[]
 */
(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    licenseMenuOnTitle: String(pluginParameters.licenseMenuOnTitle || true) === 'true',
    excludePlugins: JSON.parse(pluginParameters.excludePlugins || '[]').map((e) => {
      return String(e || '');
    }),
    explicitLicenses: JSON.parse(pluginParameters.explicitLicenses || '[]').map((e) => {
      return ((parameter) => {
        const parsed = JSON.parse(parameter);
        return {
          licenseType: String(parsed.licenseType || 'MIT'),
          plugins: JSON.parse(parsed.plugins || '[]').map((e) => {
            return String(e || '');
          }),
        };
      })(e || '{}');
    }),
    convertAuthorRules: JSON.parse(pluginParameters.convertAuthorRules || '[]').map((e) => {
      return ((parameter) => {
        const parsed = JSON.parse(parameter);
        return {
          to: String(parsed.to || ''),
          from: JSON.parse(parsed.from || '[]').map((e) => {
            return String(e || '');
          }),
        };
      })(e || '{}');
    }),
  };

  class PluginLicense {
    constructor(pluginName, author, copyright, licenseType) {
      this._pluginName = pluginName;
      this._author = author;
      this._copyright = copyright;
      this._licenseType = licenseType;
    }

    static fromObject(object) {
      return new PluginLicense(object.pluginName, object.author, object.copyright, object.license.type);
    }

    get pluginName() {
      return this._pluginName;
    }

    get author() {
      return this._author;
    }

    get copyright() {
      return this._copyright;
    }

    get licenseType() {
      return this._licenseType;
    }

    toString() {
      return `${this._pluginName}
${this._copyright ? this._copyright : ''}
${this.licenseText()}
${this.licenseUrl()}`;
    }

    licenseText() {
      return $dataLicense[this._licenseType] ? $dataLicense[this._licenseType].text : '';
    }

    licenseUrl() {
      return $dataLicense[this._licenseType] ? $dataLicense[this._licenseType].url : '';
    }
  }

  /**
   * @type {PluginLicense[]}
   */
  const pluginLicenses = [];

  const LICENSE_TYPE = {
    MIT: 'MIT',
    BSD2: 'BSD-2-Clause',
    BSD3: 'BSD-3-Clause',
    GPL3: 'GPL 3.0',
    CC0: 'CC0',
    PD: 'public domain',
    NYSL: 'NYSL 0.9982',
    WTFPL: 'WTFPL',
    NL: 'No License',
  };

  /**
   * ライセンス表示文のデフォルトセット
   */
  const DEFAULT_LICENSE = {
    MIT: {
      text: 'This software is released under the MIT License.',
      url: 'http://opensource.org/licenses/mit-license.php',
    },
    'BSD-2-Clause': {
      text: 'This software is released under the FreeBSD License.',
      url: 'https://opensource.org/licenses/BSD-2-Clause',
    },
    'BSD-3-Clause': {
      text: 'This software is released under the New BSD License.',
      url: 'https://opensource.org/licenses/BSD-3-Clause',
    },
    'GPL 3.0': {
      text: 'This software is released under the GPL 3.0.',
      url: 'https://opensource.org/licenses/GPL-3.0',
    },
    CC0: {
      text: 'This software is released under CC0.',
      url: 'https://creativecommons.org/publicdomain/zero/1.0/deed',
    },
    'public domain': {
      text: 'This software is PUBLIC DOMAIN.',
      url: '',
    },
    'NYSL 0.9982': {
      text: 'This software is released under the NYSL 0.9982.',
      url: 'http://www.kmonos.net/nysl/',
    },
    WTFPL: {
      text: 'This software is released under the WTFPL.',
      url: 'http://www.wtfpl.net/',
    },
  };

  const _Window_TitleCommand_makeCommandList = Window_TitleCommand.prototype.makeCommandList;
  Window_TitleCommand.prototype.makeCommandList = function () {
    _Window_TitleCommand_makeCommandList.call(this);
    if (settings.licenseMenuOnTitle) {
      this.addCommand('ライセンス一覧', 'displayLicense');
    }
  };

  /**
   * @param {Scene_Boot.prototype} sceneBoot
   */
  function Scene_Boot_LicenseManagerMixIn(sceneBoot) {
    const _create = sceneBoot.create;
    sceneBoot.create = function () {
      _create.call(this);
      // プラグインからライセンス情報をロード
      $plugins.filter((plugin) => plugin.status).forEach((plugin) => this.loadPluginLicense(plugin.name));
    };

    sceneBoot.loadPluginLicense = function (pluginName) {
      const filepath = 'js/plugins/' + pluginName + '.js';
      const xhr = new XMLHttpRequest();
      xhr.open('GET', filepath, true);
      xhr.onload = function (e) {
        if (xhr.status >= 400) {
          return;
        }
        const plugin = {};
        plugin.pluginName = pluginName;
        plugin.author = null;
        plugin.copyright = null;
        plugin.excluded = false;
        plugin.license = {
          type: null, // ライセンスの種類
          exact: false, // 確度の高い情報かどうか
          atlicense: false, // @licenseによる情報かどうか
        };

        const content = xhr.responseText;
        const lines = content.split('\n');
        let commentRegion = false;
        lines.forEach((line) => {
          let commentText = getCommentText(line, commentRegion);
          // 次の行もコメント領域かどうか取得しておく
          commentRegion = isCommentRegion(line, commentRegion);
          // CR等の端の空白を除去
          commentText = commentText.trim();

          // 空行は無視する
          if (commentText === '') {
            return;
          }
          // 除外プラグイン
          if (searchExcluded(commentText)) {
            plugin.excluded = true;
            return;
          }
          // 著者
          if (plugin.author === null) {
            plugin.author = searchAuthor(commentText);
            const convertRule = settings.convertAuthorRules.find((convert) => convert.from.includes(plugin.author));
            if (convertRule) {
              plugin.author = convertRule.to;
            }
          }
          // copyright
          if (plugin.copyright === null) {
            plugin.copyright = searchCopyright(commentText);
          }
          // ライセンス判定
          if (!plugin.license.exact && !plugin.license.atlicense) {
            const searchedLicense = searchLicense(commentText);
            if (searchedLicense.type != null && (plugin.license.type == null || searchedLicense.exact)) {
              plugin.license = searchedLicense;
            }
          }
        });
        // プラグインパラメータでライセンスが明示設定されている場合、最優先に設定する
        const explicitLicense = settings.explicitLicenses.find((license) =>
          license.plugins.includes(plugin.pluginName)
        );
        if (explicitLicense) {
          plugin.license = {
            type: explicitLicense.licenseType,
            exact: true,
          };
        }
        // 除外設定プラグインに含まれているかどうか
        plugin.excluded |= settings.excludePlugins.some((excludedPlugin) => excludedPlugin === plugin.pluginName);
        if (!plugin.excluded) {
          pluginLicenses.push(PluginLicense.fromObject(plugin));
        }
      };
      xhr.send();
    };
  }

  Scene_Boot_LicenseManagerMixIn(Scene_Boot.prototype);

  const _Scene_Title_createCommandWindow = Scene_Title.prototype.createCommandWindow;
  Scene_Title.prototype.createCommandWindow = function () {
    _Scene_Title_createCommandWindow.call(this);
    this._commandWindow.setHandler('displayLicense', this.commandDisplayLicense.bind(this));
  };

  /**
   * ライセンス一覧表示画面へ
   */
  Scene_Title.prototype.commandDisplayLicense = function () {
    SceneManager.push(Scene_License);
  };

  /**
   * ライセンス一覧表示シーン
   */
  class Scene_License extends Scene_Base {
    create() {
      super.create();
      this.createBackground();
      this.createWindowLayer();
      this.createLicenseWindows();
    }

    createBackground() {
      this._backgroundSprite = new Sprite();
      this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
      this.addChild(this._backgroundSprite);
    }

    createLicenseWindows() {
      // 著者一覧ウィンドウ
      this._commandWindow = new Window_LicenseCommand();
      this._commandWindow.setHandler('author', this.commandAuthor.bind(this));
      this._commandWindow.setHandler('cancel', this.popScene.bind(this));
      this.addWindow(this._commandWindow);
      // 著者名ウィンドウ
      this._authorNameWindow = new Window_PluginAuthorName();
      this._commandWindow.setHelpWindow(this._authorNameWindow);
      this.addWindow(this._authorNameWindow);

      // プラグイン名ウィンドウ
      this._listWindow = new Window_PluginList();
      this._listWindow.setHandler('cancel', this.commandBack.bind(this));
      this._commandWindow.setListWindow(this._listWindow);
      this.addWindow(this._listWindow);

      // ライセンス表示ウィンドウ
      this._licenseWindow = new Window_License();
      this._listWindow.setHelpWindow(this._licenseWindow);
      this._commandWindow.setLicenseWindow(this._licenseWindow);
      this.addWindow(this._licenseWindow);
    }

    start() {
      super.start();
      this._commandWindow.refresh();
      this._authorNameWindow.refresh();
      this._listWindow.refresh();
      this._licenseWindow.refresh();
    }

    commandAuthor() {
      this._commandWindow.deactivate();
      this._listWindow.activate();
    }

    commandBack() {
      this._listWindow.select(0);
      this._listWindow.deactivate();
      this._commandWindow.activate();
    }
  }

  window.Scene_License = Scene_License;

  /**
   * 著者一覧ウィンドウ
   */
  class Window_LicenseCommand extends Window_Command {
    initialize() {
      super.initialize(0, this.fittingHeight(1));
    }

    /**
     * リスト表示ウィンドウを設定する
     *
     * @param {Window_PluginList} listWindow プラグインリストウィンドウ
     */
    setListWindow(listWindow) {
      this._listWindow = listWindow;
      this.update();
    }

    setLicenseWindow(licenseWindow) {
      this._licenseWindow = licenseWindow;
    }

    numVisibleRows() {
      return 9;
    }

    makeCommandList() {
      getAuthorList().forEach(function (author) {
        this.addCommand(author, 'author');
      }, this);
      this.addCommand('戻る', 'cancel');
    }

    updateHelp() {
      this.setHelpWindowItem(this.currentData().name);
      if (this._licenseWindow) {
        this._licenseWindow.setText('');
      }
    }

    update() {
      super.update();
      if (this._listWindow) {
        this._listWindow.setAuthor(this.currentData().name);
      }
    }
  }

  /**
   * 著者名ウィンドウ
   */
  class Window_PluginAuthorName extends Window_Help {
    initialize() {
      Window_Base.prototype.initialize.call(this, 0, 0, Graphics.width, this.fittingHeight(1));
      this._text = '';
    }

    /**
     * 著者の名前を設定する
     *
     * @param {string} authorName 著者名
     */
    setItem(authorName) {
      this.setText(authorName);
    }
  }

  /**
   * プラグインリスト表示ウィンドウ
   */
  class Window_PluginList extends Window_Selectable {
    initialize() {
      super.initialize(this.windowX(), this.fittingHeight(1), Graphics.width - this.windowX(), this.fittingHeight(9));
      this._data = [];
      this._author = null;
      this.refresh();
      this.select(0);
    }

    windowX() {
      return 240;
    }

    maxCols() {
      return 1;
    }

    maxItems() {
      return this._data ? this._data.length : 0;
    }

    itemTextAlign() {
      return 'left';
    }

    /**
     * 著者名を設定する
     *
     * @param {string} author 著者
     */
    setAuthor(author) {
      if (this._author !== author) {
        this._author = author;
        this.refresh();
      }
    }

    /**
     * @param {PluginLicense} pluginLicense
     * @return {PluginLicense[]}
     */
    includes(pluginLicense) {
      if (this._author === null) {
        return [];
      }
      // 名無しのみ特殊判定
      if (this._author === '?') {
        return pluginLicense.author === null;
      }
      // 現在選択している著者のみ
      // かつ、除外設定されていないもののみ
      return pluginLicense.author === this._author && !pluginLicense.excluded;
    }

    makeItemList() {
      this._data = pluginLicenses.filter((license) => this.includes(license));
    }

    drawItem(index) {
      if (this._data) {
        const rect = this.itemRectForText(index);
        this.resetTextColor();
        this.drawText(this._data[index].pluginName, rect.x, rect.y, rect.width, this.itemTextAlign());
      }
    }

    currentPlugin() {
      const index = this.index();
      return this._data && index >= 0 ? this._data[index] : null;
    }

    updateHelp() {
      this.setHelpWindowItem(this.currentPlugin());
    }

    refresh() {
      this.makeItemList();
      this.createContents();
      this.drawAllItems();
    }
  }

  /**
   * ライセンス表示ウィンドウ
   */
  class Window_License extends Window_Help {
    initialize() {
      Window_Base.prototype.initialize.call(this, 0, this.windowY(), Graphics.width, Graphics.height - this.windowY());
      this._text = '';
    }

    windowY() {
      return this.fittingHeight(1) + this.fittingHeight(9);
    }

    /**
     * プラグインを設定する
     * @param {PluginLicense} pluginLicense
     */
    setItem(pluginLicense) {
      if (pluginLicense === undefined) {
        return;
      }
      this.setText(pluginLicense.toString());
    }
  }

  /**
   * 行からコメントテキストを取得する
   * @param {string} line 行テキスト
   * @param {boolean} isInCommentRegion コメント領域かどうか
   * @return {string} コメントテキスト
   */
  function getCommentText(line, isInCommentRegion) {
    if (isInCommentRegion) {
      // コメント領域内だった場合、末尾または*/までをコメントとみなす
      if (line.indexOf('*/') >= 0) {
        return line.substring(0, line.indexOf('*/'));
      }
      return line;
    } else {
      line = line.trim();
      // コメントでない
      if (line.indexOf('/*') < 0 && line.indexOf('//') < 0) {
        return '';
      }
      const commentRegionStart = line.indexOf('/*');
      const commentRegionEnd = line.indexOf('*/');
      if (commentRegionStart >= 0) {
        if (commentRegionEnd > commentRegionStart) {
          // 行内でコメント領域が完結している
          return line.substring(commentRegionStart, commentRegionEnd);
        }
        return line.substring(line.indexOf('/*'));
      }
      return line.substring(line.indexOf('//'));
    }
  }
  /**
   * 次の行開始がコメント領域かどうか
   * @param {string} line 行テキスト
   * @param {boolean} isInCommentRegion 今の行開始がコメントテキストかどうか
   */
  function isCommentRegion(line, isInCommentRegion) {
    if (isInCommentRegion) {
      // コメント領域が終わらなければ真
      return line.indexOf('*/') < 0;
    } else {
      // コメント領域が始まる かつ コメント領域が終わらなければ真
      const commentRegionStart = line.indexOf('/*');
      return commentRegionStart >= 0 && line.indexOf('*/') < commentRegionStart;
    }
  }
  /**
   * 除外フラグを探す
   * 除外フラグがあればtrue なければfalse
   */
  function searchExcluded(text) {
    const match = /@excludeLicenseManager/.exec(text);
    return match != null;
  }
  /**
   * 著者表記を探す
   * 見つからなかったらnullを返す
   * @param {string} line
   * @return {string|null}
   */
  function searchAuthor(line) {
    const match = /@author[ \t]+(.*)$/.exec(line);
    return match != null ? match[1] : null;
  }
  /**
   * Copyright (c) year author の形式を探す
   * 見つからなかったらnullを返す
   */
  function searchCopyright(line) {
    const match = /Copyright \(c\) (\d{4}|\d{4}\-\d{4}) .*$/.exec(line);
    return match != null ? match[0] : null;
  }
  /**
   * ライセンスを探す
   * 判定できなかった場合はtype = NL
   * ライセンス判定の確度が低い場合はexact = false
   */
  function searchLicense(text) {
    // @licenseが含まれるコメントを最優先する
    const match = /@license (.*)$/.exec(text);
    if (match != null) {
      const ret = checkLicenseType(text);
      ret.atlicense = true;
      return ret;
    }
    return checkLicenseType(text);
  }
  /**
   * ライセンスの種類を探る
   */
  function checkLicenseType(text) {
    const ret = {
      type: LICENSE_TYPE.NL,
      exact: false,
      atlicense: false,
    };

    // 大文字のMIT, mit-licenseのURLが含まれるなら確度の高いMIT
    if (text.indexOf('MIT') >= 0 || text.indexOf('mit-license') >= 0) {
      ret.type = LICENSE_TYPE.MIT;
      ret.exact = true;
      return ret;
    }

    if (text.indexOf('BSD') >= 0) {
      // BSDはそれ単体では確度が低い（clauseまで明記されていない場合は2-clauseと判定する）
      ret.type = LICENSE_TYPE.BSD2;
      var clauseMatch = /2-[C|c]lause/.exec(text);
      if (clauseMatch != null) {
        ret.exact = true;
      }
      clauseMatch = /3-[C|c]lause/.exec(text);
      if (clauseMatch != null) {
        ret.type = LICENSE_TYPE.BSD3;
        ret.exact = true;
      }
      return ret;
    }

    if (text.indexOf('GPL') >= 0) {
      ret.type = LICENSE_TYPE.GPL3;
      return ret;
    }

    if (text.indexOf('CC0') >= 0) {
      ret.type = LICENSE_TYPE.CC0;
      ret.exact = true;
      return ret;
    }

    if (text.indexOf('public domain') >= 0) {
      ret.type = LICENSE_TYPE.PD;
      ret.exact = true;
      return ret;
    }

    if (text.indexOf('NYSL') >= 0) {
      // NYSLはバージョンが付与されていない場合確度が低い
      ret.type = LICENSE_TYPE.NYSL;
      var versionMatch = /0\.9982/.exec(text);
      if (versionMatch != null) {
        ret.exact = true;
      }
      return ret;
    }

    if (text.indexOf('WTFPL') >= 0) {
      ret.type = LICENSE_TYPE.WTFPL;
      return ret;
    }

    return ret;
  }
  /**
   * pluginData から著者リストを取得する
   * @return {string[]}
   */
  function getAuthorList() {
    return [...new Set(pluginLicenses.map((plugin) => (plugin.author != null ? plugin.author : '?')))];
  }
  /**
   * セーブ/ロード周り
   */
  DataManager._databaseLicense = {
    name: '$dataLicense',
    src: 'License.json',
  };

  var _DataManager_loadDatabase = DataManager.loadDatabase;
  DataManager.loadDatabase = function () {
    _DataManager_loadDatabase.apply(this, arguments);
    const errorMessage = this._databaseLicense.src + 'が見つかりませんでした。';
    this.loadDataFileAllowErrorWithCallBack(
      this._databaseLicense.name,
      this._databaseLicense.src,
      errorMessage,
      DataManager.saveDefaultLicense.bind(this)
    );
  };

  DataManager.loadDataFileAllowErrorWithCallBack = function (name, src, errorMessage, callback) {
    const xhr = new XMLHttpRequest();
    const url = 'data/' + src;
    xhr.open('GET', url);
    xhr.overrideMimeType('application/json');
    xhr.onload = function () {
      if (xhr.status < 400) {
        window[name] = JSON.parse(xhr.responseText);
        DataManager.onLoad(window[name]);
      } else {
        DataManager.onDataFileNotFound(name, errorMessage);
      }
    };
    xhr.onerror = function () {
      DataManager.onDataFileNotFound(name, errorMessage);
      if (callback !== undefined) {
        callback();
      }
    };
    window[name] = null;
    xhr.send();
  };

  DataManager.onDataFileNotFound = function (name, errorMessage) {
    window[name] = {};
    console.warn(errorMessage);
  };

  const _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
  DataManager.isDatabaseLoaded = function () {
    return _DataManager_isDatabaseLoaded.apply(this, arguments) && window[this._databaseLicense.name];
  };

  DataManager.saveDefaultLicense = function () {
    const filename = this._databaseLicense.src;
    StorageManager.saveToLocalDataFile(filename, DEFAULT_LICENSE);
    $dataLicense = DEFAULT_LICENSE;
  };

  StorageManager.saveToLocalDataFile = function (fileName, json) {
    // ローカルモードでない場合require使用不可
    if (!this.isLocalMode()) {
      return;
    }
    const data = JSON.stringify(json);
    const fs = require('fs');
    const dirPath = this.localDataFileDirectoryPath();
    const filePath = dirPath + fileName;
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
    fs.writeFileSync(filePath, data);
  };

  StorageManager.localDataFileDirectoryPath = function () {
    var path = require('path');
    var base = path.dirname(process.mainModule.filename);
    return path.join(base, 'data/');
  };
})();
