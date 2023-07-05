/// <reference path="../../typings/rmmv.d.ts" />

type Game_ShopStockItem = {
  id: number,
  kind: number,
  count: number,
  supplyType: number,
  counterForSupply: number,
};

type Game_ShopStock = {
  id: number,
  stockItems: Game_ShopStockItem[],
};

declare interface Game_System {
  _shopStock: Game_ShopStock[];
}

declare interface Window_ShopStatus {
  _indexOfSameItem: number;

  stockCount(): number|undefined;
  drawStock(x: number, y: number): void;

  setIndexOfSameItem(index: number): void;
  indexOfSameItem(): number;
}

declare interface Window_ShopBuy {
  _indexForDrawing: number;
  _isDrawing: boolean;
  _extendedData: {
    indexOfSameItem: number,
  }[];

  stockCount(item: RPG.BaseItem, index: number): number|undefined;
  soldOut(item: RPG.BaseItem, index: number): boolean;

  indexOfSameItem(): number;
}
