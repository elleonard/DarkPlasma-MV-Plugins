// DarkPlasma_CustomTextOutline 1.0.0
// Copyright (c) 2022 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2022/08/07 1.0.0 公開
 */

/*:ja
 * @plugindesc テキストのアウトラインをカスタマイズする
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @param width
 * @text 幅
 * @type number
 * @default 4
 *
 * @param color
 * @text 色
 * @type struct<Color>
 * @default {"red":"0", "blue":"0", "green":"0", "alpha":"0.5"}
 *
 * @help
 * version: 1.0.0
 * テキストのアウトラインをカスタマイズします。
 */
/*~struct~Color:
 * @param red
 * @text 赤
 * @type number
 * @default 0
 *
 * @param blue
 * @text 青
 * @type number
 * @default 0
 *
 * @param green
 * @text 緑
 * @type number
 * @default 0
 *
 * @param alpha
 * @text アルファ
 * @type number
 * @default 0.5
 * @max 1
 */
(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    width: Number(pluginParameters.width || 4),
    color: ((parameter) => {
      const parsed = JSON.parse(parameter);
      return {
        red: Number(parsed.red || 0),
        blue: Number(parsed.blue || 0),
        green: Number(parsed.green || 0),
        alpha: Number(parsed.alpha || 0.5),
      };
    })(pluginParameters.color || '{"red":"0", "blue":"0", "green":"0", "alpha":"0.5"}'),
  };

  /**
   * @param {Bitmap.prototype} bitmap
   */
  function Bitmap_CustomTextOutlineMixIn(bitmap) {
    const _initialize = bitmap.initialize;
    bitmap.initialize = function (width, height) {
      _initialize.call(this, width, height);
      this.outlineColor = `rgba(${settings.color.red}, ${settings.color.blue}, ${settings.color.green}, ${settings.color.alpha})`;
      this.outlineWidth = settings.width;
    };
  }

  Bitmap_CustomTextOutlineMixIn(Bitmap.prototype);
})();
