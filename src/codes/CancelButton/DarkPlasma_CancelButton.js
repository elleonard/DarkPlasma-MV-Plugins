import { settings } from './_build/DarkPlasma_CancelButton_parameters';

/**
 * @param {typeof Input} input
 */
function Input_CancelButtonMixIn(input) {
  const _clear = input.clear;
  input.clear = function () {
    _clear.call(this);
    this._virtualButton = null;
  };

  const _update = input.update;
  input.update = function () {
    _update.call(this);
    if (this._virtualButton) {
      this._latestButton = this._virtualButton;
      this._pressedTime = 0;
      this._virtualButton = null;
    }
  };

  /**
   * ボタン押下をキー入力に変換する
   * @param {string} buttonName ボタン名
   */
  input.virtualClick = function (buttonName) {
    this._virtualButton = buttonName;
  };
}

Input_CancelButtonMixIn(Input);

/**
 * @param {typeof TouchInput} touchInput
 */
function TouchInput_CancelButtonMixIn(touchInput) {
  /**
   * Hover検出のため、マウス移動のたびに TouchInput.x, yを更新する
   * @param {MouseEvent} event
   */
  touchInput._onMouseMove = function (event) {
    this._onMove(Graphics.pageToCanvasX(event.pageX), Graphics.pageToCanvasY(event.pageY));
  };

  const __onMouseUp = touchInput._onMouseUp;
  touchInput._onMouseUp = function (event) {
    __onMouseUp.call(this, event);
    this._rightButtonPressed = false;
  };

  const __onRightButtonDown = touchInput._onRightButtonDown;
  touchInput._onRightButtonDown = function (event) {
    __onRightButtonDown.call(this, event);
    this._rightButtonPressed = true;
  };

  /**
   * キャンセル長押し判定。とりあえず右クリックのみ対応
   * @return {boolean}
   */
  touchInput.isCancelPressed = function () {
    return this._rightButtonPressed || this.isCancelled();
  };
}

TouchInput_CancelButtonMixIn(TouchInput);

/**
 * @param {Scene_Base.prototype} sceneClass
 * @param {number} buttonX
 * @param {number} buttonY
 */
function Scene_CreateCancelButtonMixIn(sceneClass, buttonX, buttonY) {
  if (sceneClass.createDisplayObjects) {
    const _createDisplayObjects = sceneClass.createDisplayObjects;
    sceneClass.createDisplayObjects = function () {
      _createDisplayObjects.call(this);
      this.createCancelButton(buttonX, buttonY);
    };
  } else {
    const _create = sceneClass.create;
    sceneClass.create = function () {
      _create.call(this);
      this.createCancelButton(buttonX, buttonY);
    };
  }
}

settings.sceneList
  .filter((scene) => !!window[scene.name])
  .forEach((scene) => {
    const buttonX = scene.useDefaultPosition ? settings.defaultX : scene.x;
    const buttonY = scene.useDefaultPosition ? settings.defaultY : scene.y;
    Scene_CreateCancelButtonMixIn(window[scene.name].prototype, buttonX, buttonY);
  });

/**
 * SceneCustomMenu.js 対応
 */
if (SceneManager.createCustomMenuClass) {
  const _createCustomMenuClass = SceneManager.createCustomMenuClass;
  SceneManager.createCustomMenuClass = function (sceneId) {
    const sceneClass = _createCustomMenuClass.call(this, sceneId);
    const sceneSetting = settings.sceneList.find((scene) => scene.name === sceneClass.name);
    if (sceneSetting) {
      const _createMethod = sceneClass.prototype.create;
      sceneClass.prototype.create = function () {
        _createMethod.call(this);
        if (sceneSetting.useDefaultPosition) {
          this._cancelButton.setPosition(sceneSetting.defaultX, sceneSetting.defaultY);
        } else {
          this._cancelButton.setPosition(sceneSetting.x, sceneSetting.y);
        }
      };
    }
    return sceneClass;
  };
}

/**
 * キャンセルボタン
 * シーン中の全ての Window_Selectable から参照可能にする
 * @type {Sprite_CancelButton|null}
 */
let cancelButton = null;

/**
 * @param {Scene_Base.prototype} sceneClass
 */
function Scene_CancelButtonMixIn(sceneClass) {
  sceneClass.createCancelButton = function (buttonX, buttonY) {
    if (this._cancelButton) {
      return;
    }
    this._cancelButton = new Sprite_CancelButton();
    this._cancelButton.setClickHandler(this.triggerBackButton.bind(this));
    this._backWait = 0;
    cancelButton = this._cancelButton;
    this.addChild(this._cancelButton);
    this._cancelButton.setPosition(buttonX, buttonY);
  };

  sceneClass.triggerBackButton = function () {
    if (!settings.enableWithDesignMode && Utils.isDesignMode && Utils.isDesignMode()) {
      return;
    }
    this._cancelButton.trigger();
    Input.virtualClick('cancel');
  };

  const _update = sceneClass.update;
  sceneClass.update = function () {
    _update.call(this);
    if (this._cancelButton && this._cancelButton.isTriggered() && this._mustBePopScene) {
      if (this._backWait > 0) {
        this._backWait--;
      } else {
        this.popScene();
      }
    }
  };

  const _popSccene = sceneClass.popScene;
  sceneClass.popScene = function () {
    if (this._cancelButton && this._cancelButton.isTriggered() && !this._mustBePopScene) {
      this._mustBePopScene = true;
      this._backWait = settings.backWait;
      this._windowLayer.children.forEach((window) => window.deactivate());
      cancelButton = null;
      return;
    }
    _popSccene.call(this);
  };
}

Scene_CancelButtonMixIn(Scene_Base.prototype);

class Sprite_CancelButton extends Sprite_Button {
  initialize() {
    super.initialize();
    this._defaultBitmap = ImageManager.loadBitmap('img/', settings.buttonImage.default);
    this._hoveredBitmap = ImageManager.loadBitmap('img/', settings.buttonImage.hovered || settings.buttonImage.default);
    this._pressedBitmap = ImageManager.loadBitmap('img/', settings.buttonImage.pressed || settings.buttonImage.default);
    this.scale.x = settings.scale / 100;
    this.scale.y = settings.scale / 100;
    this._isTriggered = false;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  update() {
    super.update();
    if (this.isPressed()) {
      this.bitmap = this._pressedBitmap;
    } else if (this.isHovered()) {
      this.bitmap = this._hoveredBitmap;
    } else {
      this.bitmap = this._defaultBitmap;
    }
  }

  isButtonTouched() {
    const x = this.canvasToLocalX(TouchInput.x);
    const y = this.canvasToLocalY(TouchInput.y);
    return x >= 0 && y >= 0 && x < this.width * this.scale.x && y < this.height * this.scale.y;
  }

  isHovered() {
    return this.isButtonTouched() && !TouchInput.isPressed();
  }

  isPressed() {
    return (
      (this.isButtonTouched() && TouchInput.isPressed()) ||
      (this.isTriggered() && (Input.isPressed('cancel') || TouchInput.isCancelPressed()))
    );
  }

  isTriggered() {
    return this._isTriggered;
  }

  trigger() {
    this._isTriggered = true;
  }
}

/**
 * @param {Window_Selectable.prototype} windowClass
 */
function Window_Selectable_CancelButtonMixIn(windowClass) {
  const _processCancel = windowClass.processCancel;
  windowClass.processCancel = function () {
    if (cancelButton) {
      cancelButton.trigger();
    }
    _processCancel.call(this);
  };
}

Window_Selectable_CancelButtonMixIn(Window_Selectable.prototype);
