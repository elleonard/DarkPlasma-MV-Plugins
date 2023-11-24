/// <reference path="../../typings/rmmv.d.ts" />

declare interface InputStatic {
  _virtualButton: string|null;

  virtualClick(buttonName: string): void;
}

declare interface TouchInputStatic {
  _rightButtonPressed: boolean;

  isCancelPressed(): boolean;
}

declare interface UtilsStatic {
  /**
   * GraphicalDesignMode.js
   */
  isDesignMode(): boolean;
}

declare interface SceneManagerStatic {
  /**
   * SceneCustomMenu.js
   */
  createCustomMenuClass(sceneId: string): typeof Scene_Base;
}

declare interface Scene_Base {
  _cancelButton: Sprite_CancelButton;
  _backWait: number;
  _mustBePopScene: boolean;

  createCancelButton(buttonX: number, buttonY: number): void;
  triggerBackButton(): void;
}
declare interface Sprite_CancelButton extends Sprite_Button {
  _defaultBitmap: Bitmap;
  _hoveredBitmap: Bitmap;
  _pressedBitmap: Bitmap;
  _isTriggered: boolean;

  setPosition(x: number, y: number): void;
  trigger(): void;
  isTriggered(): boolean;
  isHovered(): boolean;
  isPressed(): boolean;
}