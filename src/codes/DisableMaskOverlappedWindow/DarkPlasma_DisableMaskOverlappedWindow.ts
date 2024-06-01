/// <reference path="./DisableMaskOverlappedWindow.d.ts" />

function WindowLayer_DisableMaskOverlappedWindowMixIn(windowLayer: WindowLayer) {
  windowLayer._canvasClearWindowRect = function () {};
  windowLayer._maskWindow = function () {};
}

WindowLayer_DisableMaskOverlappedWindowMixIn(WindowLayer.prototype);
