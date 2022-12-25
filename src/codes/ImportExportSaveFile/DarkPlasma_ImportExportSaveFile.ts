/// <reference path="./ImportExportSaveFile.d.ts" />

import { settings } from "./_build/DarkPlasma_ImportExportSaveFile_parameters";

const MOBILE_IMPORT_EXPORT_AREA_PADDING = 5;

function Graphics_ImportExportSaveFileMixIn(graphics: typeof Graphics) {
  const _initialize = graphics.initialize;
  graphics.initialize = function (width, height, type) {
    _initialize.call(this, width, height, type);
    this._createImportExportElement();
  };

  graphics._stretchWidth = function () {
    return this._importExportMode && Utils.isMobileDevice() ? window.innerWidth/2 : window.innerWidth;
  };

  graphics._stretchHeight = function () {
    return window.innerHeight;
  };

  graphics._updateRealScale = function () {
    if (this._stretchEnabled) {
      let h = this._stretchWidth() / this._width;
      let v = this._stretchHeight() / this._height;
      if (h >= 1 && h - 0.01 <= 1) h = 1;
      if (v >= 1 && v - 0.01 <= 1) v = 1;
      this._realScale = Math.min(h, v);
    } else {
      this._realScale = this._scale;
    }
  };

  graphics._importExportAreaRect = function () {
    return Utils.isMobileDevice()
      ? new Rectangle(
        this._stretchWidth() / 2 + MOBILE_IMPORT_EXPORT_AREA_PADDING,
        MOBILE_IMPORT_EXPORT_AREA_PADDING,
        this._stretchWidth() / 2 - MOBILE_IMPORT_EXPORT_AREA_PADDING * 2,
        this._stretchHeight() - MOBILE_IMPORT_EXPORT_AREA_PADDING * 2
      )
      : new Rectangle(
        settings.textAreaRect.x,
        settings.textAreaRect.y,
        settings.textAreaRect.width,
        settings.textAreaRect.height
      );
  };

  graphics._createImportExportElement = function () {
    const rect = this._importExportAreaRect();
    this._importExportElement = document.createElement('textarea');
    this._importExportElement.style.position = 'absolute';
    this._importExportElement.style.left = `${rect.x}px`;
    this._importExportElement.style.top = `${rect.y}px`;
    this._importExportElement.style.width = `${rect.width}px`;
    this._importExportElement.style.height = `${rect.height}px`;
    this._importExportElement.style.zIndex = "98";
  };


  const _centerElement = graphics._centerElement;
  graphics._centerElement = function (element) {
    _centerElement.call(this, element);
    if (element === this._canvas && this._importExportMode && Utils.isMobileDevice()) {
      element.style.margin = "auto 0";
    }
  };

  graphics.showImportExportArea = function () {
    this._importExportElement.setSelectionRange(0, this._importExportElement.textLength);
    this._importExportMode = true;
    document.body.appendChild(this._importExportElement);
    this._updateAllElements();
  };

  graphics.hideImportExportArea = function () {
    this._importExportMode = false;
    document.body.removeChild(this._importExportElement);
    this._updateAllElements();
  };

  graphics.importExportAreaValue = function () {
    return this._importExportElement.value;
  };

  graphics.setImportExportAreaValue = function (text) {
    this._importExportElement.value = text;
  };

  graphics.setImportExportAreaPlaceholder = function (text) {
    this._importExportElement.placeholder = text;
  };
}

Graphics_ImportExportSaveFileMixIn(Graphics);

function DataManager_ImportExportSaveFileMixIn(dataManager: typeof DataManager) {
  dataManager.loadCompressedGamedata = function (savefileId) {
    try {
      return this.loadCompressedGamedataWithoutRescue(savefileId);
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  dataManager.loadCompressedGamedataWithoutRescue = function (savefileId) {
    if (this.isThisGameFile(savefileId)) {
      return LZString.compressToBase64(JsonEx.stringify({
        'data': JsonEx.parse(StorageManager.load(savefileId)),
        'info': this.loadGlobalInfo()[savefileId]
      }));
    } else {
      return null;
    }
  };

  dataManager.saveCompressedGamedata = function (savefileId, string) {
    try {
      StorageManager.backup(savefileId);
      return this.saveCompressedGamedataWithoutRescue(savefileId, string);
    } catch (e) {
      console.error(e);
      try {
        StorageManager.remove(savefileId);
        StorageManager.restoreBackup(savefileId);
      } catch (e2) {
      }
      return false;
    }
  };

  dataManager.saveCompressedGamedataWithoutRescue = function (savefileId, string) {
    const json = JsonEx.parse(LZString.decompressFromBase64(string));
    const data = JsonEx.stringify(json.data);
    if (data.length >= 200000) {
      console.warn('Save data too big!');
    }
    StorageManager.save(savefileId, data);
    const globalInfo = this.loadGlobalInfo() || [];
    globalInfo[savefileId] = json.info;
    this.saveGlobalInfo(globalInfo);
    return true;
  };
}

DataManager_ImportExportSaveFileMixIn(DataManager);

const MENU_BUTTON_TYPE = {
  ON_FILE: 1,
  XY: 2,
};

function Scene_File_ImporExportSaveFileMixIn(sceneFile: Scene_File) {
  const _createListWindow = sceneFile.createListWindow;
  sceneFile.createListWindow = function (this: Scene_File) {
    _createListWindow.call(this);
    this.createOkCancelButton();
    if (settings.menuButtonType === 2) {
      this.createImportExportButton();
    } else {
      this._listWindow.setExportHandler(this.onExportClicked.bind(this));
      this._listWindow.setImportHandler(this.onImportClicked.bind(this));
    }
  };

  const _start = sceneFile.start;
  sceneFile.start = function (this: Scene_File) {
    _start.call(this);
    this._listWindow.setTopRow(this.firstSavefileIndex() - 2);
    this._listWindow.select(this.firstSavefileIndex());
  };

  sceneFile.createOkCancelButton = function () {
    this._okButton = new Sprite_ImportExportButton(BUTTON_TYPE.OK);
    this._okButton.x = settings.okButtonPos.x;
    this._okButton.y = settings.okButtonPos.y;
    this._okButton.visible = false;
    this.addChild(this._okButton);

    this._cancelButton = new Sprite_ImportExportButton(BUTTON_TYPE.CANCEL);
    this._cancelButton.x = settings.cancelButtonPos.x;
    this._cancelButton.y = settings.cancelButtonPos.y;
    this._cancelButton.visible = false;
    this.addChild(this._cancelButton);

  }

  sceneFile.createImportExportButton = function () {
    this._importButton = new Sprite_ImportExportButton(BUTTON_TYPE.IMPORT);
    this._importButton.x = settings.importButtonPos.x;
    this._importButton.y = settings.importButtonPos.y;
    this._importButton.setClickHandler(this.onImportClicked.bind(this));
    this.addChild(this._importButton);

    this._exportButton = new Sprite_ImportExportButton(BUTTON_TYPE.EXPORT);
    this._exportButton.x = settings.exportButtonPos.x;
    this._exportButton.y = settings.exportButtonPos.y;
    this._exportButton.setClickHandler(this.onExportClicked.bind(this));
    this.addChild(this._exportButton);
  }

  sceneFile.onExportClicked = function (this: Scene_File) {
    if (DataManager.isThisGameFile(this.savefileId())) {
      this._listWindow.deactivate();
      Graphics.setImportExportAreaPlaceholder("");
      Graphics.setImportExportAreaValue(DataManager.loadCompressedGamedata(this.savefileId()) || "");
      Graphics.showImportExportArea();
      this._okButton.visible = true;
      this._cancelButton.visible = false;
      this._okButton.setClickHandler(this.onExportOkClicked.bind(this));
      this._cancelButton.setClickHandler(null);
      this._helpWindow.setText(settings.exportHelpText);
      SoundManager.playOk();
    } else {
      SoundManager.playBuzzer();
      this.activateListWindow();
    }
  }

  sceneFile.onImportClicked = function (this: Scene_File) {
    this._listWindow.deactivate();
    Graphics.setImportExportAreaValue("");
    Graphics.setImportExportAreaPlaceholder(settings.importHelpText);
    Graphics.showImportExportArea();
    this._okButton.visible = true;
    this._cancelButton.visible = true;
    this._okButton.setClickHandler(this.onImportOkClicked.bind(this));
    this._cancelButton.setClickHandler(this.onImportCancelClicked.bind(this));
    this._helpWindow.setText(settings.importHelpText);
  }

  sceneFile.onExportOkClicked = function (this: Scene_File) {
    Graphics.hideImportExportArea();
    this._okButton.visible = false;
    this.activateListWindow();
    this._helpWindow.setText(this.helpWindowText());
    this._okButton.setClickHandler(null);
    SoundManager.playOk();
  }

  sceneFile.onImportOkClicked = function (this: Scene_File) {
    if (DataManager.saveCompressedGamedata(this.savefileId(), Graphics.importExportAreaValue())) {
      SoundManager.playOk();
    } else {
      SoundManager.playBuzzer();
    }
    this._listWindow.refresh();
    this.onImportCancelClicked();
  }

  sceneFile.onImportCancelClicked = function (this: Scene_File) {
    Graphics.hideImportExportArea();
    this._okButton.visible = false;
    this._cancelButton.visible = false;
    this.activateListWindow();
    this._helpWindow.setText(this.helpWindowText());
    this._okButton.setClickHandler(null);
    this._cancelButton.setClickHandler(null);
  }
}

Scene_File_ImporExportSaveFileMixIn(Scene_File.prototype);

function Window_SavefileList_ImportExportSaveFileMixIn(windowClass: Window_SavefileList) {
  const _initialize = windowClass.initialize;
  windowClass.initialize = function (x, y, width, height) {
    _initialize.call(this, x, y, width, height);
    if (settings.menuButtonType !== MENU_BUTTON_TYPE.XY) {
      this.createImportExportButton();
    }
  };

  windowClass.createImportExportButton = function () {
    this._importButton = new Sprite_ImportExportButton(BUTTON_TYPE.IMPORT);
    this.addChild(this._importButton);

    this._exportButton = new Sprite_ImportExportButton(BUTTON_TYPE.EXPORT);
    this.addChild(this._exportButton);
  }

  const _updateCursor = windowClass.updateCursor;
  windowClass.updateCursor = function (this: Window_SavefileList) {
    _updateCursor.call(this);
    if (settings.menuButtonType !== MENU_BUTTON_TYPE.XY && this._importButton && this._exportButton) {
      if (this._cursorAll) {
        this._importButton.visible = false;
        this._exportButton.visible = false;
      } else if (this.isCursorVisible()) {
        const rect = this.itemRect(this.index());
        this._exportButton.x = rect.x + rect.width - this._exportButton.width;
        this._exportButton.y = rect.y + this._exportButton.height / 2;
        this._importButton.x = this._exportButton.x - this._importButton.width - 20;
        this._importButton.y = rect.y + this._importButton.height / 2;
        this._exportButton.visible = DataManager.isThisGameFile(this.index() + 1);
        this._importButton.visible = true;
      } else {
        this._exportButton.visible = false;
        this._importButton.visible = false;
        this.setCursorRect(0, 0, 0, 0);
      }
    }
  };

  windowClass.setExportHandler = function (handler) {
    if (settings.menuButtonType !== MENU_BUTTON_TYPE.XY) {
      this._exportButton.setClickHandler(handler);
    }
  }

  windowClass.setImportHandler = function (handler) {
    if (settings.menuButtonType !== MENU_BUTTON_TYPE.XY) {
      this._importButton.setClickHandler(handler);
    }
  }

  const _processTouch = windowClass.processTouch;
  windowClass.processTouch = function () {
    if (settings.menuButtonType !== MENU_BUTTON_TYPE.XY && (this._exportButton.isBeingTouched() || this._importButton.isBeingTouched())) {
      return;
    }
    _processTouch.call(this);
  };

}

Window_SavefileList_ImportExportSaveFileMixIn(Window_SavefileList.prototype);

const BUTTON_TYPE = {
  OK: 'buttonOk',
  CANCEL: 'buttonCancel',
  IMPORT: 'buttonImport',
  EXPORT: 'buttonExport',
};

class Sprite_ImportExportButton extends Sprite_Button {
  _buttonType: string;

  initialize(buttonType: string) {
    super.initialize();
    this._buttonType = buttonType;
    this.setupFrames();
  }

  public setupFrames(): void {
    this.loadButtonImage();
  }

  imageFilename() {
    switch (this._buttonType) {
      case BUTTON_TYPE.OK:
        return settings.buttonImages.ok;
      case BUTTON_TYPE.CANCEL:
        return settings.buttonImages.cancel;
      case BUTTON_TYPE.IMPORT:
        return settings.buttonImages.import;
      case BUTTON_TYPE.EXPORT:
        return settings.buttonImages.export;
      default:
        throw `不正なボタン種別です。 ${this._buttonType}`;
    }
  }

  public loadButtonImage(): void {
    this.bitmap = ImageManager.loadSystem(this.imageFilename());
    this.bitmap.addLoadListener(() => {
      const h = this.bitmap!.height;
      const w = this.bitmap!.width;
      this.setColdFrame(0, 0, w, h / 2);
      this.setHotFrame(0, h / 2, w, h / 2);
      this.updateFrame();
    });
  }

  public checkBitmap(): void { }

  public onClick(): void {
    if (this._clickHandler) {
      this._clickHandler();
    }
  }

  isBeingTouched(): boolean {
    return this._touching;
  }
}
