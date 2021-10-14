// DarkPlasma_NotToHideTileCharacter 1.0.0
// Copyright (c) 2021 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/10/14 1.0.0 公開
 */

/*:ja
 * @plugindesc タイル画像を指定したイベントが敵遭遇時に消える不具合を修正する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 1.0.0
 * タイル画像を指定したイベントが敵遭遇時に消える不具合を修正します。
 */

(() => {
  'use strict';

  Sprite_Character.prototype.isTile = function () {
    return this._character.isTile();
  };
})();
