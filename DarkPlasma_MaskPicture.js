// DarkPlasma_MaskPicture 1.0.0
// Copyright (c) 2024 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2024/04/04 1.0.0 公開
 */

/*:
 * @plugindesc ピクチャをマスクする
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 1.0.0
 * ピクチャでピクチャをマスクするプラグインコマンドを提供します。
 *
 * MaskPicture 1 2
 * ピクチャ1をピクチャ2でマスクします。
 *
 * UnmaskPicture 1
 * ピクチャ1にかけたマスクを解除します。
 */

(() => {
  'use strict';

  function Game_Interpreter_MaskPictureMixIn(gameInterpreter) {
    const _pluginCommand = gameInterpreter.pluginCommand;
    gameInterpreter.pluginCommand = function (command, args) {
      var _a, _b;
      if (command === 'MaskPicture') {
        const base = Number(args[0] || 1);
        const mask = Number(args[1] || 2);
        (_a = $gameScreen.picture(base)) === null || _a === void 0 ? void 0 : _a.mask(mask);
      } else if (command === 'UnmaskPicture') {
        const base = Number(args[0] || 1);
        (_b = $gameScreen.picture(base)) === null || _b === void 0 ? void 0 : _b.unmask();
      }
      _pluginCommand.call(this, command, args);
    };
  }
  Game_Interpreter_MaskPictureMixIn(Game_Interpreter.prototype);
  function Game_Picture_MaskPictureMixIn(gamePicture) {
    gamePicture.mask = function (maskPictureId) {
      this._maskPictureId = maskPictureId;
    };
    gamePicture.unmask = function () {
      this._maskPictureId = undefined;
    };
    gamePicture.maskPictureId = function () {
      return this._maskPictureId;
    };
  }
  Game_Picture_MaskPictureMixIn(Game_Picture.prototype);
  function Spriteset_MaskPictureMixIn(spriteset) {
    const _createPictures = spriteset.createPictures;
    spriteset.createPictures = function () {
      _createPictures.call(this);
      /**
       * ピクチャIDによるランダムアクセスを可能にしてマスク関連処理の計算量を抑える
       */
      this._spritePictures = [];
      this._pictureContainer.children
        .filter((sprite) => sprite instanceof Sprite_Picture)
        .forEach((sprite) => (this._spritePictures[sprite.pictureId()] = sprite));
    };
    const _update = spriteset.update;
    spriteset.update = function () {
      _update.call(this);
      this.updateMask();
    };
    spriteset.updateMask = function () {
      this._pictureContainer.children
        .filter((sprite) => sprite instanceof Sprite_Picture && this.mustUpdateMask(sprite))
        .forEach((sprite) => {
          var _a;
          return sprite.setMask(
            this.spritePicture((_a = sprite.picture()) === null || _a === void 0 ? void 0 : _a.maskPictureId())
          );
        });
    };
    spriteset.spritePicture = function (pictureId) {
      return pictureId ? this._spritePictures[pictureId] || null : null;
    };
    spriteset.mustUpdateMask = function (sprite) {
      var _a;
      const mustBeMaskedWith = this.spritePicture(
        (_a = sprite.picture()) === null || _a === void 0 ? void 0 : _a.maskPictureId()
      );
      return sprite.visible && !sprite.isMaskedWith(mustBeMaskedWith);
    };
  }
  Spriteset_MaskPictureMixIn(Spriteset_Base.prototype);
  function Sprite_Picture_MaskPictureMixIn(spritePicture) {
    spritePicture.setMask = function (sprite) {
      this.mask = sprite;
    };
    spritePicture.isMaskedWith = function (sprite) {
      return this.mask === sprite;
    };
    spritePicture.pictureId = function () {
      return this._pictureId;
    };
  }
  Sprite_Picture_MaskPictureMixIn(Sprite_Picture.prototype);
})();
