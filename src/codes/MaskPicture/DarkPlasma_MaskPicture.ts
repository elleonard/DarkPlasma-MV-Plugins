/// <reference path="./MaskPicture.d.ts" />

function Game_Interpreter_MaskPictureMixIn(gameInterpreter: Game_Interpreter) {
  const _pluginCommand = gameInterpreter.pluginCommand;
  gameInterpreter.pluginCommand = function (command, args) {
    if (command === "MaskPicture") {
      const base = Number(args[0] || 1);
      const mask = Number(args[1] || 2);
      $gameScreen.picture(base)?.mask(mask);
    } else if (command === "UnmaskPicture") {
      const base = Number(args[0] || 1);
      $gameScreen.picture(base)?.unmask();
    }
    _pluginCommand.call(this, command, args);
  };
}

Game_Interpreter_MaskPictureMixIn(Game_Interpreter.prototype);

function Game_Screen_MaskPictureMixIn(gameScreen: Game_Screen) {
  const _showPicture = gameScreen.showPicture;
  gameScreen.showPicture = function (pictureId, name, origin, x, y, scaleX, scaleY, opacity, blendMode) {
    const maskPictureId = this.picture(pictureId)?.maskPictureId();
    _showPicture.call(this, pictureId, name, origin, x, y, scaleX, scaleY, opacity, blendMode);
    if (maskPictureId) {
      this.picture(pictureId)?.mask(maskPictureId);
    }
  };
}

Game_Screen_MaskPictureMixIn(Game_Screen.prototype);

function Game_Picture_MaskPictureMixIn(gamePicture: Game_Picture) {
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

function Spriteset_MaskPictureMixIn(spriteset: Spriteset_Base) {
  const _createPictures = spriteset.createPictures;
  spriteset.createPictures = function (this: Spriteset_Base) {
    _createPictures.call(this);
    /**
     * ピクチャIDによるランダムアクセスを可能にしてマスク関連処理の計算量を抑える
     */
    this._spritePictures = [];
    this._pictureContainer.children
      .filter<Sprite_Picture>((sprite): sprite is Sprite_Picture => sprite instanceof Sprite_Picture)
      .forEach(sprite => this._spritePictures[sprite.pictureId()] = sprite);
  };

  const _update = spriteset.update;
  spriteset.update = function () {
    _update.call(this);
    this.updateMask();
  };

  spriteset.updateMask = function (this: Spriteset_Base) {
    this._pictureContainer.children
      .filter((sprite): sprite is Sprite_Picture => sprite instanceof Sprite_Picture && this.mustUpdateMask(sprite))
      .forEach(sprite => sprite.setMask(this.spritePicture(sprite.picture()?.maskPictureId())));
  };

  spriteset.spritePicture = function (pictureId) {
    return pictureId ? this._spritePictures[pictureId] || null: null;
  };

  spriteset.mustUpdateMask = function (sprite) {
    const mustBeMaskedWith = this.spritePicture(sprite.picture()?.maskPictureId());
    return sprite.visible && !sprite.isMaskedWith(mustBeMaskedWith);
  };
}

Spriteset_MaskPictureMixIn(Spriteset_Base.prototype);

function Sprite_Picture_MaskPictureMixIn(spritePicture: Sprite_Picture) {
  spritePicture.setMask = function (sprite) {
    this.mask = sprite;
  };

  spritePicture.isMaskedWith = function (sprite) {
    return this.mask === sprite;
  };

  spritePicture.pictureId = function (this: Sprite_Picture) {
    return this._pictureId;
  };
}

Sprite_Picture_MaskPictureMixIn(Sprite_Picture.prototype);
