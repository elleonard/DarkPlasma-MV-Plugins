// DarkPlasma_MessageWindowInMenu 1.0.0
// Copyright (c) 2021 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2021/11/03 1.0.0 公開
 */

/*:ja
 * @plugindesc メニューにメッセージウィンドウを追加する
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @help
 * version: 1.0.0
 * メニュー画面でメッセージウィンドウを表示できるようにします。
 */

(() => {
  'use strict';

  /**
   * @param {Scene_Menu.prototype} sceneMenu
   */
  function Scene_Menu_MessageWindowMixIn(sceneMenu) {
    const _create = sceneMenu.create;
    sceneMenu.create = function () {
      _create.call(this);
      this.createMessageWindowLayer();
      this._windowBackTo = null;
    };

    sceneMenu.createMessageWindowLayer = function () {
      this._messageWindowLayer = new WindowLayer();
      this._messageWindowLayer.move(0, 0, Graphics.boxWidth, Graphics.boxHeight);
      this.addChild(this._messageWindowLayer);
      this._messageWindow = new Window_Message();
      this._messageWindowLayer.addChild(this._messageWindow);
      this._messageWindow.subWindows().forEach((window) => this._messageWindowLayer.addChild(window));
    };

    const _update = sceneMenu.update;
    sceneMenu.update = function () {
      _update.call(this);
      if ($gameMessage.isBusy() && !this._windowBackTo) {
        this._windowBackTo = this._commandWindow;
        this._windowBackTo.deactivate();
      } else if (!$gameMessage.isBusy() && this._windowBackTo && !this._windowBackTo.isOpenAndActive()) {
        this._windowBackTo.activate();
        this._windowBackTo = null;
      }
    };
  }

  Scene_Menu_MessageWindowMixIn(Scene_Menu.prototype);
})();
