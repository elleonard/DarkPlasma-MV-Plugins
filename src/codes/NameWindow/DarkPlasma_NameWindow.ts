import { settings } from './_build/DarkPlasma_NameWindow_parameters';

/** 名前ウィンドウの位置 */
const NAME_WINDOW_POSITION = {
  LEFT_EDGE: 1,
  LEFT: 2,
  CENTER: 3,
  RIGHT: 4,
  RIGHT_EDGE: 5,
};

/**
 * アクターIDからアクター名を取得する
 * 存在しないIDの場合nullを返す
 */
function actorName(actorId: number): string | null {
  return Window_Base.prototype.actorName(actorId);
}

/**
 * アクターの名前から色を算出する
 * 色設定がない場合はデフォルト色を返す
 */
function colorByName(name: string) {
  const actor = $gameActors.byName(name);
  if (actor) {
    const colorSetting = settings.actorColors.find(
      (actorColor) => Number(actorColor.actor) === Number(actor.actorId())
    );
    return colorSetting ? colorSetting.color : settings.defaultColor;
  }
  return settings.defaultColor;
}

class NameWindowTextInfo {
  _name: string;
  _position: number;
  _eraseTarget: RegExp | string;

  /**
   * @param {string} name 名前
   * @param {number} position 表示位置
   * @param {RegExp|string} eraseTarget メッセージから取り除く文字列
   */
  constructor(name: string, position: number, eraseTarget: RegExp | string) {
    this._name = name;
    this._position = position;
    this._eraseTarget = eraseTarget;
  }

  static fromMessageText(text: string) {
    const regExpAndPositions = [
      {
        regExp: /\x1bN\<(.*?)\>/gi,
        position: NAME_WINDOW_POSITION.LEFT_EDGE,
      },
      {
        regExp: /\x1bN1\<(.*?)\>/gi,
        position: NAME_WINDOW_POSITION.LEFT_EDGE,
      },
      {
        regExp: /\x1bN2\<(.*?)\>/gi,
        position: NAME_WINDOW_POSITION.LEFT,
      },
      {
        regExp: /\x1bN3\<(.*?)\>/gi,
        position: NAME_WINDOW_POSITION.CENTER,
      },
      {
        regExp: /\x1bNC\<(.*?)\>/gi,
        position: NAME_WINDOW_POSITION.CENTER,
      },
      {
        regExp: /\x1bN4\<(.*?)\>/gi,
        position: NAME_WINDOW_POSITION.RIGHT,
      },
      {
        regExp: /\x1bN5\<(.*?)\>/gi,
        position: NAME_WINDOW_POSITION.RIGHT_EDGE,
      },
      {
        regExp: /\x1bNR\<(.*?)\>/gi,
        position: NAME_WINDOW_POSITION.RIGHT_EDGE,
      },
      {
        regExp: /\x1bNDP\<(.*?)\>/gi,
        position: NAME_WINDOW_POSITION.LEFT_EDGE,
        isActorId: true,
      },
    ];
    const hit = regExpAndPositions
      .map((regExpAndPosition) => {
        return {
          regExp: new RegExp(regExpAndPosition.regExp),
          position: regExpAndPosition.position,
          idOrName: regExpAndPosition.regExp.exec(text),
          isActorId: regExpAndPosition.isActorId,
        };
      })
      .find((hit) => hit.idOrName && hit.idOrName[1]);
    if (hit && hit.idOrName) {
      const name = hit.isActorId ? actorName(Number(hit.idOrName[1])) : hit.idOrName[1];
      return new NameWindowTextInfo(name!, hit.position, hit.regExp);
    }

    if (settings.autoDetectName) {
      // 名前＋開きカッコを見つけ次第、名前ウィンドウを設定する
      const speakerReg = new RegExp('^(.+)(「|（)', 'gi');
      const speaker = speakerReg.exec(text);
      if (speaker !== null) {
        let target = speaker[1].replace('\x1b}', '');
        const eraseTarget = target;
        /**
         * 色は強制的に固定する
         */
        target = target.replace(/\x1bC\[(#?[0-9]*)\]/gi, '');

        if (target.length > 0) {
          return new NameWindowTextInfo(target, NAME_WINDOW_POSITION.LEFT_EDGE, eraseTarget);
        }
      }
    }
    return null;
  }

  get name() {
    return this._name;
  }

  get position() {
    return this._position;
  }

  get eraseTarget() {
    return this._eraseTarget;
  }

  /**
   * 色付きの名前
   */
  coloredName() {
    const speakerNames = this.name.split('＆');
    const speakerNameString = speakerNames
      .map((speakerName) => {
        // 設定値の色があればそれを設定する
        const color = colorByName(speakerName);
        return speakerName.replace(new RegExp(`^${speakerName}$`, 'gi'), `\\C[${color}]${speakerName}`);
      }, this)
      .join('\\C[0]＆');
    return speakerNameString;
  }
}

function Game_Message_NameWindowMixIn(gameMessage: Game_Message) {
  gameMessage.nextText = function (this: Game_Message) {
    return this._texts[0];
  };

  /**
   * MessageSkip.js 対応
   */
  if (!gameMessage.skipFlg) {
    gameMessage.skipFlg = function () {
      return false;
    };
  }
}

Game_Message_NameWindowMixIn(Game_Message.prototype);

function Game_Actors_NameWindowMixIn(gameActors: Game_Actors) {
  gameActors.byName = function (this: Game_Actors, name) {
    const actor = $dataActors.find((actor) => actor && actor.name === name);
    if (actor) {
      if (!this._data[actor.id]) {
        this._data[actor.id] = new Game_Actor(actor.id);
      }
      return this._data[actor.id];
    }
    return null;
  };
}

Game_Actors_NameWindowMixIn(Game_Actors.prototype);

function Scene_Map_NameWindowMixIn(sceneMap: Scene_Map) {
  /**
   * 名前ウィンドウ表示中に戦闘に入った場合、名前ウィンドウを消す
   */
  const _snapForBattleBackground = sceneMap.snapForBattleBackground;
  sceneMap.snapForBattleBackground = function (this: Scene_Map) {
    if (this.isNameWindowVisible()) {
      this._messageWindow.hideNameWindow();
    }
    _snapForBattleBackground.call(this);
  };

  sceneMap.hasNameWindow = function (this: Scene_Map) {
    return this._messageWindow && this._messageWindow.hasNameWindow();
  };

  sceneMap.isNameWindowVisible = function (this: Scene_Map) {
    return this.hasNameWindow() && this._messageWindow.isNameWindowVisible();
  };
}

Scene_Map_NameWindowMixIn(Scene_Map.prototype);

const BACKGROUND_TYPE = {
  EXTENDS: 3,
};

class Window_SpeakerName extends Window_Base {
  _parentWindow: Window_Message;
  _text: string;
  _startClose: boolean;
  _closeDelayCounter: number;
  _background: number;
  _position: number;

  /**
   * @param {Window_Message} parentWindow メッセージウィンドウ
   */
  constructor(parentWindow: Window_Message) {
    super(0, 0, 0, 0);
    this._parentWindow = parentWindow;
    this.initialize();
  }

  initialize() {
    super.initialize(0, 0, 240, this.windowHeight());
    this._text = '';
    this._openness = 0;
    this.stopClose();
    this.deactivate();
    this.hide();
  }

  text() {
    return this._text;
  }

  standardPadding() {
    return settings.standardPadding;
  }

  windowWidth() {
    this.resetFontSettings();
    const textWidth = this.textWidthEx(this._text);
    const width = textWidth + this.padding * 2 + settings.horizontalPadding;
    return Math.ceil(width);
  }

  windowHeight() {
    return this.fittingHeight(1);
  }

  textWidthEx(text: string) {
    return this.drawTextEx(text, 0, this.contents.height);
  }

  contentsHeight() {
    return this.lineHeight();
  }

  /**
   * 名前ウィンドウを閉じる
   * MessageSkip.js でスキップ中の場合、見栄えを考慮して強制的に閉じることとする
   */
  startClose() {
    this._startClose = this.isOpen() || $gameMessage.skipFlg();
  }

  /**
   * 名前ウィンドウクローズ用変数の初期化
   */
  stopClose() {
    this._startClose = false;
    this._closeDelayCounter = settings.closeDelayFrame;
  }

  update() {
    super.update();
    if (this.doesContinue()) {
      this.stopClose();
      return;
    }
    if (!this._startClose) return;
    if (this._closeDelayCounter-- > 0) return;
    this.close();
    this._startClose = false;
    this._closeDelayCounter = settings.closeDelayFrame;
  }

  updateBackground() {
    if (settings.backgroundType === BACKGROUND_TYPE.EXTENDS) {
      this._background = $gameMessage.background();
    } else {
      this._background = settings.backgroundType;
    }
    this.setBackgroundType(this._background);
  }

  /**
   * @param {string} text 名前
   * @param {number} position 表示場所
   */
  showName(text: string, position: number) {
    super.show();
    this.stopClose();
    this._text = text;
    this._position = position;
    this.width = this.windowWidth();
    this.createContents();
    this.contents.clear();
    this.resetFontSettings();
    let padding = settings.horizontalPadding / 2;
    this.drawTextEx(this._text, padding, 0);
    this.adjustPositionX();
    this.adjustPositionY();
    this.updateBackground();
    this.open();
    this.activate();
  }

  adjustPositionX() {
    switch (this._position) {
      case NAME_WINDOW_POSITION.LEFT_EDGE:
        this.x = this._parentWindow.x;
        this.x += settings.windowOffsetX;
        break;
      case NAME_WINDOW_POSITION.LEFT:
        this.x = this._parentWindow.x;
        this.x += (this._parentWindow.width * 3) / 10;
        this.x -= this.width / 2;
        break;
      case NAME_WINDOW_POSITION.CENTER:
        this.x = this._parentWindow.x;
        this.x += this._parentWindow.width / 2;
        this.x -= this.width / 2;
        break;
      case NAME_WINDOW_POSITION.RIGHT:
        this.x = this._parentWindow.x;
        this.x += (this._parentWindow.width * 7) / 10;
        this.x -= this.width / 2;
        break;
      case NAME_WINDOW_POSITION.RIGHT_EDGE:
        this.x = this._parentWindow.x + this._parentWindow.width;
        this.x -= this.width;
        this.x -= settings.windowOffsetX;
        break;
    }
    this.x = this.x.clamp(0, Graphics.boxWidth - this.width);
  }

  adjustPositionY() {
    const parentWindowY = ($gameMessage.positionType() * (Graphics.boxHeight - this._parentWindow.windowHeight())) / 2;
    if ($gameMessage.positionType() === 0) {
      this.y = parentWindowY + this._parentWindow.height;
      this.y -= settings.windowOffsetY;
    } else {
      this.y = parentWindowY;
      this.y -= this.height;
      this.y += settings.windowOffsetY;
    }
    if (this.y < 0) {
      this.y = parentWindowY + this._parentWindow.height;
      this.y -= settings.windowOffsetY;
    }
  }

  /**
   * @return {boolean} 表示し続ける必要があるかどうか
   */
  doesContinue(): boolean {
    return this._parentWindow.doesContinue() && !!this._parentWindow.findNameWindowTextInfo($gameMessage.nextText());
  }

  isNameWindow() {
    return true;
  }

  /**
   * AutoLineBreak
   */
  isAutoLineBreakEnabled(): boolean {
    return false;
  }
}

Window_Base.prototype.isNameWindow = function () {
  return false;
};

function Window_Message_NameWindowMixIn(windowClass: Window_Message) {
  windowClass.showNameWindow = function (name, position) {
    if (!this._isAlreadyShownNameWindow) {
      this._nameWindow.showName(name, position);
      this._isAlreadyShownNameWindow = true;
    }
  };

  const _startMessage = windowClass.startMessage;
  windowClass.startMessage = function (this: Window_Message) {
    _startMessage.call(this);
    this._isAlreadyShownNameWindow = false;
    if (this._nameWindowTextInfo) {
      this.showNameWindow(this._nameWindowTextInfo.coloredName(), this._nameWindowTextInfo.position);
    }
  };

  const _WindowMessage_terminateMessage = windowClass.terminateMessage;
  windowClass.terminateMessage = function () {
    this._nameWindow.startClose();
    this._nameWindowTextInfo = null;
    _WindowMessage_terminateMessage.call(this);
  };

  const _WindowMessage_createSubWindows = windowClass.createSubWindows;
  windowClass.createSubWindows = function () {
    _WindowMessage_createSubWindows.call(this);
    this._nameWindow = new Window_SpeakerName(this);
  };

  const _Window_Message_subWindows = windowClass.subWindows;
  windowClass.subWindows = function () {
    return _Window_Message_subWindows.call(this).concat([this._nameWindow]);
  };

  windowClass.hideSubWindow = function (subWindow) {
    if (subWindow.isNameWindow()) {
      this._isAlreadyShownNameWindow = false;
    }
  };

  windowClass.showSubWindow = function (subWindow) {
    if (subWindow.isNameWindow()) {
      if (this._nameWindowTextInfo) {
        this.showNameWindow(this._nameWindowTextInfo.coloredName(), this._nameWindowTextInfo.position);
      }
    }
  };

  windowClass.convertEscapeCharacters = function (text) {
    text = Window_Base.prototype.convertEscapeCharacters.call(this, text);
    return this.convertNameWindow(text);
  };

  /**
   * 指定したテキストの中から名前ウィンドウにすべき箇所を探す
   */
  windowClass.findNameWindowTextInfo = function (text) {
    return NameWindowTextInfo.fromMessageText(text);
  };

  windowClass.convertNameWindow = function (text) {
    const nameWindowTextInfo = this.findNameWindowTextInfo(text);
    if (nameWindowTextInfo) {
      text = text.replace(nameWindowTextInfo.eraseTarget, '');
      this._nameWindowTextInfo = nameWindowTextInfo;
    }
    return text;
  };

  windowClass.hideNameWindow = function () {
    this._nameWindow.hide();
  };

  windowClass.hasNameWindow = function () {
    return !!this._nameWindow;
  };

  windowClass.isNameWindowVisible = function () {
    return this._nameWindow && this._nameWindow.visible;
  };

  windowClass.colorByName = function (name) {
    return colorByName(name);
  };
}

Window_Message_NameWindowMixIn(Window_Message.prototype);
