// DarkPlasma_CancelButton 3.0.0
// Copyright (c) 2022 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2022/07/18 3.0.0 rollup移行
 * 2021/07/27 2.0.0 シーンから戻るボタンではなく、キャンセルボタンに変更
 * 2021/07/22 1.4.2 マウスオーバーしたまま DarkPlasma_CancelToBackButton.js で戻るボタンを押しても押下時の画像が表示されない不具合を修正
 * 2021/07/21 1.4.1 DarkPlasma_CancelToBackButton.js 1.0.1 に対応
 *            1.4.0 DarkPlasma_CancelToBackButton.js に対応
 *            1.3.0 戻るボタン押下時に再生するSE設定を追加
 * 2021/07/20 1.2.0 SceneCustomMenu.js によって生成されたシーンクラスに対応
 * 2021/07/10 1.1.0 戻るボタン押下後の待機状態でキー入力を無効にするよう修正
 *                  GraphicalDesignMode.js のデザインモード時にボタンを無効化する設定を追加
 *            1.0.0 公開
 */

/*:ja
 * @plugindesc 任意のシーンにキャンセルボタンを配置する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @orderAfter SceneCustomMenu
 *
 * @param buttonImage
 * @text ボタン画像
 * @type struct<ButtonImage>
 *
 * @param defaultX
 * @text デフォルトX座標
 * @type number
 * @default 0
 *
 * @param defaultY
 * @text デフォルトY座標
 * @type number
 * @default 0
 *
 * @param scale
 * @text 拡大率（％）
 * @type number
 * @default 100
 *
 * @param backWait
 * @desc キャンセルボタンを押してから前のシーンに戻るまでのウェイトフレーム数
 * @text 戻るウェイト
 * @type number
 * @default 10
 *
 * @param sceneList
 * @text シーン
 * @type struct<BackButtonScene>[]
 * @default ["{\"name\":\"Scene_MenuBase\",\"x\":\"0\",\"y\":\"0\",\"useDefaultPosition\":\"true\"}"]
 *
 * @param enableWithDesignMode
 * @desc GraphicalDesignModeのデザインモード時にもボタンを有効にするか
 * @text デザインモード時有効
 * @type boolean
 * @default false
 *
 * @help
 * version: 3.0.0
 * キー入力可能ウィンドウを持つ任意のシーン（※）について、
 * キャンセルキーと同等の効果を持つボタン（以下、キャンセルボタン）を配置します。
 *
 * 本プラグインはキャンセルボタンを表示するためのものであり、
 * ウィンドウのレイアウトを変更するものではありません。
 * ウィンドウのレイアウトを変更したい場合、
 * GraphicalDesignMode.js 等の利用をご検討ください。
 * https://github.com/triacontane/RPGMakerMV/blob/master/GraphicalDesignMode.js
 *
 * ※以下の前提を満たしている必要があります。
 * - シーンクラスがグローバルに定義されていること
 * - ウィンドウが Window_Selectable を継承していること
 *
 * 本プラグインを下記プラグインと共に利用する場合、それよりも下に追加してください。
 * SceneCustomMenu
 */
/*~struct~ButtonImage:
 * @param default
 * @desc 通常時のキャンセルボタン画像
 * @text 通常時
 * @type file
 * @dir img
 *
 * @param hovered
 * @desc マウスオーバー時に表示する画像。省略時には通常時の画像が表示される
 * @text マウスオーバー時
 * @type file
 * @dir img
 *
 * @param pressed
 * @desc 押下時に表示する画像。省略時には通常時の画像が表示される
 * @text 押下時
 * @type file
 * @dir img
 */
/*~struct~BackButtonScene:
 * @param name
 * @text シーンクラス名
 * @type string
 *
 * @param useDefaultPosition
 * @text デフォルト座標を使う
 * @type boolean
 * @default true
 *
 * @param x
 * @text X座標
 * @type number
 * @default 0
 *
 * @param y
 * @text Y座標
 * @type number
 * @default 0
 */
(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    buttonImage: ((parameter) => {
      const parsed = JSON.parse(parameter);
      return {
        default: String(parsed.default || ''),
        hovered: String(parsed.hovered || ''),
        pressed: String(parsed.pressed || ''),
      };
    })(pluginParameters.buttonImage || '{}'),
    defaultX: Number(pluginParameters.defaultX || 0),
    defaultY: Number(pluginParameters.defaultY || 0),
    scale: Number(pluginParameters.scale || 100),
    backWait: Number(pluginParameters.backWait || 10),
    sceneList: JSON.parse(
      pluginParameters.sceneList || '[{"name":"Scene_MenuBase","x":"0","y":"0","useDefaultPosition":"true"}]'
    ).map((e) => {
      return ((parameter) => {
        const parsed = JSON.parse(parameter);
        return {
          name: String(parsed.name || ''),
          useDefaultPosition: String(parsed.useDefaultPosition || true) === 'true',
          x: Number(parsed.x || 0),
          y: Number(parsed.y || 0),
        };
      })(e || '{}');
    }),
    enableWithDesignMode: String(pluginParameters.enableWithDesignMode || false) === 'true',
  };

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

  settings.sceneList
    .filter((scene) => !!window[scene.name])
    .forEach((scene) => {
      const _createMethod = window[scene.name].prototype.create;
      window[scene.name].prototype.create = function () {
        _createMethod.call(this);
        this.createCancelButton();
        if (scene.useDefaultPosition) {
          this._cancelButton.setPosition(settings.defaultX, settings.defaultY);
        } else {
          this._cancelButton.setPosition(scene.x, scene.y);
        }
      };
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
    sceneClass.createCancelButton = function () {
      if (this._cancelButton) {
        return;
      }
      this._cancelButton = new Sprite_CancelButton();
      this._cancelButton.setClickHandler(this.triggerBackButton.bind(this));
      this._backWait = 0;
      cancelButton = this._cancelButton;
      this.addChild(this._cancelButton);
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
      this._hoveredBitmap = ImageManager.loadBitmap(
        'img/',
        settings.buttonImage.hovered || settings.buttonImage.default
      );
      this._pressedBitmap = ImageManager.loadBitmap(
        'img/',
        settings.buttonImage.pressed || settings.buttonImage.default
      );
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
})();
