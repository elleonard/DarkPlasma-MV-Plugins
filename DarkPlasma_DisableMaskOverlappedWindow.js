// DarkPlasma_DisableMaskOverlappedWindow 1.0.0
// Copyright (c) 2024 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2024/06/01 1.0.0 公開
 */

/*:
 * @plugindesc 重なったウィンドウをくり抜かない
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 1.0.0
 * 重なったウィンドウをくり抜く仕様を無効化します。
 */

(() => {
  'use strict';

  function WindowLayer_DisableMaskOverlappedWindowMixIn(windowLayer) {
    windowLayer._canvasClearWindowRect = function () {};
    windowLayer._maskWindow = function () {};
  }
  WindowLayer_DisableMaskOverlappedWindowMixIn(WindowLayer.prototype);
})();
