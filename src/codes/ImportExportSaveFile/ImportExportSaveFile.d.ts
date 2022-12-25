/// <reference path="../../typings/rmmv.d.ts" />

declare interface GraphicsStatic {
  _importExportElement: HTMLTextAreaElement;
  _importExportMode: boolean;

  _stretchWidth(): number;
  _stretchHeight(): number;

  _importExportAreaRect(): Rectangle;
  _createImportExportElement(): void;
  showImportExportArea(): void;
  hideImportExportArea(): void;
  importExportAreaValue(): string;
  setImportExportAreaValue(text: string): void;
  setImportExportAreaPlaceholder(text: string): void;
}

declare namespace DataManager {
  export function saveCompressedGamedata(savefileId: number, zip: string): boolean;
  export function saveCompressedGamedataWithoutRescue(savefileId: number, string: string): boolean;
  export function loadCompressedGamedata(savefileId: number): string|null;
  export function loadCompressedGamedataWithoutRescue(savefileId: number): string|null;
}

declare interface Scene_File {
  _okButton: Sprite_ImportExportButton;
  _cancelButton: Sprite_ImportExportButton;
  _importButton: Sprite_ImportExportButton;
  _exportButton: Sprite_ImportExportButton;

  createOkCancelButton(): void;
  createImportExportButton(): void;
  onExportClicked(): void;
  onImportClicked(): void;
  onExportOkClicked(): void;
  onImportOkClicked(): void;
  onImportCancelClicked(): void;
}

declare interface Window_SavefileList {
  _importButton: Sprite_ImportExportButton;
  _exportButton: Sprite_ImportExportButton;

  createImportExportButton(): void;
  setExportHandler(handler: () => void): void;
  setImportHandler(handler: () => void): void;
}
