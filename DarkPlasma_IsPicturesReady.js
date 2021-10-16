// DarkPlasma_IsPicturesReady 1.0.0
// Copyright (c) 2021 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/10/16 1.0.0 公開
 */

/*:ja
 * @plugindesc ピクチャの表示準備が完了したかを知る
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 1.0.0
 * ピクチャの表示準備が完了しているかどうかを知るための
 * プラグインコマンドを提供します。
 *
 * プラグインコマンド:
 * isPicturesReady pictureIds=(ピクチャIDリスト) switchId=(スイッチID)
 *
 * 例:
 * isPicturesReady pictureIds=1to3 switchId=1
 * スイッチID1に対して、ピクチャ1～3の表示準備が完了しているかどうかを格納します。
 *
 * isPicturesReady pictureIds=1,3 switchId=1
 * スイッチID1に対して、ピクチャ1,3の表示準備が完了しているかどうかを格納します。
 */

(() => {
  'use strict';

  const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'isPicturesReady') {
      const pictureIds = parsePictureIds(args.find((arg) => arg.startsWith('pictureIds=')).split('=')[1]);
      const switchId = Number(args.find((arg) => arg.startsWith('switchId=')).split('=')[1]);
      $gameTemp.requestIIsPicturesReady(pictureIds, switchId);
    }
  };

  /**
   * @param {string} str
   * @return {number[]}
   */
  function parsePictureIds(str) {
    str
      .split(',')
      .map((idOrRange) => {
        if (idOrRange.includes('to')) {
          const min = Number(idOrRange.split('to')[0]);
          const max = Number(idOrRange.split('to')[1]);
          return [...Array(max - min + 1).keys()].map((i) => i + min);
        } else {
          return [Number(idOrRange)];
        }
      })
      .reduce((acc, val) => acc.concat(val), []);
    return [];
  }

  Game_Temp.prototype.requestIIsPicturesReady = function (pictureIds, switchId) {
    this._isPicturesReadyRequest = {
      pictureIds: pictureIds,
      switchId: switchId,
    };
  };

  Game_Temp.prototype.requestedIsPicturesReady = function () {
    return this._isPicturesReadyRequest ? this._isPicturesReadyRequest : null;
  };

  Game_Temp.prototype.clearRequestIsPicturesReady = function () {
    this._isPicturesReadyRequest = null;
  };

  /**
   * @param {Scene_Map.prototype|Scene_Battle.prototype} sceneClass
   */
  function Scene_IsPicturesReadyMixIn(sceneClass) {
    const _update = sceneClass.update;
    sceneClass.update = function () {
      _update.call(this);
      const requestedIsPicturesReady = $gameTemp.requestedIsPicturesReady();
      if (requestedIsPicturesReady) {
        $gameSwitches.setValue(
          requestedIsPicturesReady.switchId,
          this._spriteset.isPicturesReady(requestedIsPicturesReady.pictureIds)
        );
        $gameTemp.clearRequestIsPicturesReady();
      }
    };
  }
  Scene_IsPicturesReadyMixIn(Scene_Map.prototype);
  Scene_IsPicturesReadyMixIn(Scene_Battle.prototype);

  Spriteset_Base.prototype.isPicturesReady = function (pictureIds) {
    return this._pictureContainer.children
      .filter((sprite) => pictureIds.includes(sprite.pictureId()))
      .every((sprite) => sprite.isREady());
  };

  Sprite_Picture.prototype.pictureId = function () {
    return this._pictureId;
  };

  Sprite_Picture.prototype.isReady = function () {
    return this.bitmap && this.bitmap.isReady();
  };
})();
