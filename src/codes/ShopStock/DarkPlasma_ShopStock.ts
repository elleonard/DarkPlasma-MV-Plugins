/// <reference path="./ShopStock.d.ts" />

import { settings, ShopStock_ShopStock, ShopStock_StockItem } from './_build/DarkPlasma_ShopStock_parameters';

const SUPPLY_TYPE = {
  NONE: 0,
  BATTLE_COUNT: 1,
  PLAY_TIME: 2
};

const ITEM_KIND = {
  ITEM: 1,
  WEAPON: 2,
  ARMOR: 3,
};

const DEFAULT_STOCK_ID = 1;

class ShopStockManager {
  _shopStock: ShopStock[];

  constructor() {
    this.initialize();
  }

  initialize() {
    /**
     * @type {ShopStock[]}
     */
    this._shopStock = settings.shopStock.map(stockSetting => ShopStock.fromSetting(stockSetting));
  }

  /**
   * 現在の在庫リストIDに記録されている在庫数を返す
   * 在庫リストIDが指定されていない、または在庫リストの中にアイテムが存在しない場合nullを返す
   * @param {RPG.BaseItem} item アイテムデータ
   * @param {number} index リスト中のアイテム番号
   * @return {number|undefined} 現在の在庫数
   */
  stockCount(item: RPG.BaseItem, index: number): number | undefined {
    return this.currentShopStock()?.stockCount(item, index);
  }

  /**
   * 指定したIDの在庫リストを返す
   * 存在しない場合はundefinedを返す
   * @param {number} stockId 在庫リストID
   * @return {ShopStock|undefined}
   */
  shopStock(stockId: number): ShopStock | undefined {
    return this._shopStock.find(stock => stock.id === stockId);
  }

  /**
   * 現在の在庫リストを返す
   * 現在の在庫リストIDが指し示す在庫リストが存在しない場合、undefinedを返す
   * @return {ShopStock|undefined}
   */
  currentShopStock(): ShopStock | undefined {
    const currentStockId = $gameVariables.value(settings.stockIdVariable) || DEFAULT_STOCK_ID;
    return this._shopStock.find(stock => stock.id === currentStockId);
  }

  /**
   * 現在の在庫リストの在庫を補充する
   */
  autoSupplyCurrentShopStock(): void {
    const shopStock = this.currentShopStock();
    if (shopStock) {
      shopStock.autoSupply();
    }
  }

  forceSupplyCurrentShopStock(item?: RPG.BaseItem, index?: number): void {
    this.currentShopStock()?.forceSupply(item, index);
  }

  /**
   * 現在の在庫リストにおいて、指定したアイテムの在庫数を増やす
   * @param {RPG.BaseItem} item アイテムデータ
   * @param {number} index リスト中のアイテム番号
   * @param {number} count 在庫を増やす数
   */
  increaseCurrentStockCount(item: RPG.BaseItem, index: number, count: number): void {
    const shopStock = this.currentShopStock();
    if (shopStock) {
      shopStock.increaseStockCount(item, index, count);
    }
  }

  /**
   * 現在の在庫リストにおいて、指定したアイテムの在庫数を減らす
   * @param {RPG.BaseItem} item アイテムデータ
   * @param {number} index リスト中のアイテム番号
   * @param {number} count 在庫を減らす数
   */
  decreaseCurrentStockCount(item: RPG.BaseItem, index: number, count: number): void {
    const shopStock = this.currentShopStock();
    if (shopStock) {
      shopStock.decreaseStockCount(item, index, count);
    }
  }

  /**
   * セーブデータから在庫数を更新する
   * @param {Game_ShopStock[]} stockSaveData セーブデータ形式の在庫データ
   */
  updateCountBySaveData(stockSaveData: Game_ShopStock[]): void {
    stockSaveData.forEach(saveData => {
      const shopStock = this._shopStock.find(stock => saveData.id === stock.id);
      if (shopStock) {
        shopStock.updateCountBySaveData(saveData.stockItems);
      }
    });
  }

  /**
   * セーブデータ用の形式に変換して取得する
   * 以下のような形式
   * [
   *   {
   *     id: 在庫リストID,
   *     stockItems: [
   *       {
   *         id: アイテムID,
   *         kind: アイテム種別ID,
   *         count: 在庫数,
   *         supplyType: 補充形式,
   *         counterForSupply: 補充用カウンター
   *       },
   *       ....
   *     ]
   *   },
   *   ....
   * ]
   * @return {Game_ShopStock[]} セーブデータ用の形式
   */
  toSaveData(): Game_ShopStock[] {
    return this._shopStock.map(stock => stock.toSaveData());
  }
}

/**
 * 在庫リスト
 */
class ShopStock {
  _id: number;
  _stockItems: StockItem[];

  constructor(id: number, stockItems: StockItem[]) {
    this._id = id;
    this._stockItems = stockItems;
  }

  static fromSetting(setting: ShopStock_ShopStock): ShopStock {
    return new ShopStock(
      setting.id,
      setting.stockItemList.map(stockItem => {
        return StockItem.fromSetting(
          stockItem,
          ITEM_KIND.ITEM,
          setting.autoSupplyType,
          setting.autoSupplyFrequency
        );
      }).concat(setting.stockWeaponList.map(stockWeapon => {
        return StockItem.fromSetting(
          stockWeapon,
          ITEM_KIND.WEAPON,
          setting.autoSupplyType,
          setting.autoSupplyFrequency
        );
      })).concat(setting.stockArmorList.map(stockArmor => {
        return StockItem.fromSetting(
          stockArmor,
          ITEM_KIND.ARMOR,
          setting.autoSupplyType,
          setting.autoSupplyFrequency
        );
      }))
    );
  }

  get id() {
    return this._id;
  }

  updateCountBySaveData(stockItemSaveData: Game_ShopStockItem[]) {
    const indexes: { [itemId: number]: number } = {};
    stockItemSaveData.forEach(savedItem => {
      const items = this._stockItems.filter(item => item.kind === savedItem.kind && item.id === savedItem.id);
      if (!indexes[savedItem.id]) {
        indexes[savedItem.id] = 0;
      }
      const item = items[indexes[savedItem.id]++];
      if (item) {
        item.setCount(savedItem.count);
        if (item.autoSupplyType !== savedItem.supplyType) { // 補充形式設定が変更されていたらリセットする
          item.resetNextAutoSupplyCount();
        } else {
          item.setNextAutoSupplyCount(savedItem.counterForSupply);
        }
      }
    });
  }

  /**
   * 在庫を補充する
   */
  autoSupply(): void {
    this._stockItems.forEach(stock => stock.autoSupply());
  }

  forceSupply(item?: RPG.BaseItem, index?: number): void {
    if (item) {
      this.getStockItem(item, index || 0)?.forceSupply();
    } else {
      this._stockItems.forEach(stock => stock.forceSupply());
    }
  }

  /**
   * 指定したアイテムの在庫情報を取得する
   * @param {RPG.BaseItem} item アイテムデータ
   * @param {number} index リスト中のアイテム番号
   * @return {StockItem|null}
   */
  getStockItem(item: RPG.BaseItem, index: number): StockItem | null {
    let result: StockItem[] = [];
    if (DataManager.isItem(item)) {
      result = this._stockItems.filter(stockItem => stockItem.kind === ITEM_KIND.ITEM && stockItem.id === item.id);
    } else if (DataManager.isWeapon(item)) {
      result = this._stockItems.filter(stockItem => stockItem.kind === ITEM_KIND.WEAPON && stockItem.id === item.id);
    } else if (DataManager.isArmor(item)) {
      result = this._stockItems.filter(stockItem => stockItem.kind === ITEM_KIND.ARMOR && stockItem.id === item.id);
    }
    return result.length > index ? result[index] : null;
  }

  /**
   * @param {RPG.BaseItem} item アイテムデータ
   * @param {number} index リスト中のアイテム番号
   * @return {number|undefined} 在庫数
   */
  stockCount(item: RPG.BaseItem, index: number): number | undefined {
    return this.getStockItem(item, index)?.count;
  }

  /**
   * 指定したアイテムの在庫数を増やす
   * @param {RPG.BaseItem} item アイテムデータ
   * @param {number} index リスト中のアイテム番号
   * @param {number} count 在庫を増やす数
   */
  increaseStockCount(item: RPG.BaseItem, index: number, count: number): void {
    const stockItem = this.getStockItem(item, index);
    if (stockItem) {
      stockItem.increaseCount(count);
    }
  }

  /**
   * 指定したアイテムの在庫数を減らす
   * @param {RPG.BaseItem} item アイテムデータ
   * @param {number} index リスト中のアイテム番号
   * @param {number} count 在庫を減らす数
   */
  decreaseStockCount(item: RPG.BaseItem, index: number, count: number): void {
    const stockItem = this.getStockItem(item, index);
    if (stockItem) {
      const mustBeResetCount = stockItem.count === stockItem.maxCount();
      stockItem.decreaseCount(count);
      /**
       * 最大よりも少なくなったタイミングで次の補充タイミングを決定する
       */
      if (mustBeResetCount) {
        stockItem.resetNextAutoSupplyCount();
      }
    }
  }

  toSaveData(): Game_ShopStock {
    return {
      id: this._id,
      stockItems: this._stockItems.map(stockItem => stockItem.toSaveData())
    };
  }
}

class StockItem {
  _kind: number;
  _id: number;
  _initialCount: number;
  _count: number;
  _autoSupplyType: number;
  _autoSupplyCount: number;
  _autoSupplyFrequency: number;
  _nextAutoSupplyCount: number;

  constructor(
    kind: number,
    id: number,
    initialCount: number,
    supplyType: number,
    supplyFrequency: number
  ) {
    this._kind = kind;
    this._id = id;
    this._initialCount = initialCount;
    this._count = initialCount;
    this._autoSupplyType = supplyType;
    this._autoSupplyFrequency = supplyFrequency;
    this._nextAutoSupplyCount = 0;
  }

  static fromSetting(
    setting: ShopStock_StockItem,
    kind: number,
    autoSupplyType: number,
    autoSupplyFrequency: number
  ): StockItem {
    return new StockItem(
      kind,
      setting.id,
      setting.count,
      autoSupplyType,
      autoSupplyFrequency
    );
  }

  toSaveData(): Game_ShopStockItem {
    return {
      kind: this._kind,
      id: this._id,
      count: this._count,
      supplyType: this._autoSupplyType,
      counterForSupply: this._nextAutoSupplyCount
    };
  }

  get data(): RPG.BaseItem | null {
    switch (this._kind) {
      case ITEM_KIND.ITEM:
        return $dataItems[this._id];
      case ITEM_KIND.WEAPON:
        return $dataWeapons[this._id];
      case ITEM_KIND.ARMOR:
        return $dataArmors[this._id];
      default:
        return null;
    }
  }

  get kind(): number {
    return this._kind;
  }

  get id(): number {
    return this._id;
  }

  get count(): number {
    return this._count;
  }

  get autoSupplyType(): number {
    return this._autoSupplyType;
  }

  /**
   * 在庫を増やす
   */
  increaseCount(count: number): void {
    this.setCount(this.count + count);
  }

  /**
   * 在庫を減らす
   */
  decreaseCount(count: number): void {
    this.setCount(this.count - count);
  }

  /**
   * 在庫数を設定する
   */
  setCount(count: number): void {
    this._count = count;
    if (this._count > this.maxCount()) {
      this._count = this.maxCount();
    } else if (this._count < 0) {
      this._count = 0;
    }
  }

  mustBeAutoSupply(): boolean {
    if (this._autoSupplyFrequency <= 0 || this._count >= this.maxCount()) {
      return false;
    }
    switch (this._autoSupplyType) {
      case SUPPLY_TYPE.NONE:
        return false;
      case SUPPLY_TYPE.BATTLE_COUNT:
        return this._nextAutoSupplyCount <= $gameSystem.battleCount();
      case SUPPLY_TYPE.PLAY_TIME:
        return this._nextAutoSupplyCount <= $gameSystem.playtime();
    }
    return false;
  }

  /**
   * 在庫を補充する
   */
  autoSupply(): void {
    if (this.mustBeAutoSupply()) {
      this.setCount(this.maxCount());
    }
  }

  forceSupply(): void {
    this.setCount(this.maxCount());
  }

  /**
   * セーブデータロード用
   */
  setNextAutoSupplyCount(counter: number): void {
    this._nextAutoSupplyCount = counter;
  }

  /**
   * 補充用カウンターをリセットする
   */
  resetNextAutoSupplyCount(): void {
    switch (this._autoSupplyType) {
      case SUPPLY_TYPE.BATTLE_COUNT:
        this._nextAutoSupplyCount = $gameSystem.battleCount() + this._autoSupplyFrequency;
        break;
      case SUPPLY_TYPE.PLAY_TIME:
        this._nextAutoSupplyCount = $gameSystem.playtime() + this._autoSupplyFrequency;
        break;
    }
  }

  maxCount(): number {
    // 将来的に最大数を別に設定できるようにしても良い
    return this._initialCount;
  }
}

const shopStockManager: ShopStockManager = new ShopStockManager();

function Game_System_ShopStockMixIn(gameSystem: Game_System) {
  const _initialize = gameSystem.initialize;
  gameSystem.initialize = function () {
    _initialize.call(this);
    /**
     * ゲーム開始時に初期化する
     */
    shopStockManager.initialize();
  };

  const _onBeforeSave = gameSystem.onBeforeSave;
  gameSystem.onBeforeSave = function () {
    _onBeforeSave.call(this);
    this._shopStock = shopStockManager.toSaveData();
  };

  const _onAfterLoad = gameSystem.onAfterLoad;
  gameSystem.onAfterLoad = function () {
    _onAfterLoad.call(this);
    if (this._shopStock && Array.isArray(this._shopStock)) {
      shopStockManager.updateCountBySaveData(this._shopStock);
    } else {
      /**
       * セーブデータになければとりあえず初期化する
       */
      shopStockManager.initialize();
    }
  };
}

Game_System_ShopStockMixIn(Game_System.prototype);

function parseParameter(name: string, args: string[]): string|undefined {
  const a = args.find(arg => arg.startsWith(`${name}=`))?.split('=');
  return a && a.length > 0 ? a[1] : undefined;
}

function parseNumberParameter(name: string, args: string[]): number|undefined {
  const p = parseParameter(name, args);
  return p ? Number(p) : undefined;
}

function Game_Interpreter_ShopStockMixIn(gameInterpreter: Game_Interpreter) {
  const _pluginCommand = gameInterpreter.pluginCommand;
  gameInterpreter.pluginCommand = function(command, args) {
    _pluginCommand.call(this, command, args);
    if (command === 'forceSupply') {
      const kind = parseParameter("kind", args);
      const itemId = parseNumberParameter("id", args);
      const index = parseNumberParameter("index", args);
      const item = (() => {
        if (!kind || !itemId) {
          return undefined;
        }
        switch (kind) {
          case "item":
            return $dataItems[itemId];
          case "weapon":
            return $dataWeapons[itemId];
          case "armor":
            return $dataArmors[itemId];
          default:
            return undefined;
        }
      })();
      shopStockManager.forceSupplyCurrentShopStock(item, index);
    }
  };
}

Game_Interpreter_ShopStockMixIn(Game_Interpreter.prototype);

function Scene_Shop_StockMixIn(sceneShop: Scene_Shop) {
  const _create = sceneShop.create;
  sceneShop.create = function () {
    _create.call(this);
    // ショップを開いたタイミングで補充する
    shopStockManager.autoSupplyCurrentShopStock();
  };

  const _doBuy = sceneShop.doBuy;
  sceneShop.doBuy = function (this: Scene_Shop, number) {
    _doBuy.call(this, number);
    shopStockManager.decreaseCurrentStockCount(this._item, this._buyWindow.indexOfSameItem(), number);
  };

  const _doSell = sceneShop.doSell;
  sceneShop.doSell = function (this: Scene_Shop, number) {
    _doSell.call(this, number);
    if (settings.addStockWhenSellItem) {
      shopStockManager.increaseCurrentStockCount(this._item, 0, number);
    }
  };

  const _maxBuy = sceneShop.maxBuy;
  sceneShop.maxBuy = function (this: Scene_Shop) {
    const currentStock = shopStockManager.stockCount(this._item, this._buyWindow.indexOfSameItem()) || 0;
    return currentStock > 0 ? Math.min(
      currentStock,
      _maxBuy.call(this)
    ) : _maxBuy.call(this);
  };
}

Scene_Shop_StockMixIn(Scene_Shop.prototype);

function Window_ShopStatus_StockMixIn(windowClass: Window_ShopStatus) {
  const _refresh = windowClass.refresh;
  windowClass.refresh = function () {
    _refresh.call(this);
    // 在庫数表記
    const currentStock = this.stockCount();
    if (currentStock || currentStock === 0) {
      this.drawStock(this.textPadding(), this.lineHeight());
    }
  };

  windowClass.drawStock = function (x, y) {
    const width = this.contents.width - this.textPadding() - x;
    const stockWidth = this.textWidth('0000');
    this.changeTextColor(this.systemColor());
    this.drawText(settings.stockNumberLabel, x, y, width - stockWidth, 'left');
    this.resetTextColor();
    this.drawText(this.stockCount()!, x, y, width, 'right');
  };

  windowClass.stockCount = function (this: Window_ShopStatus) {
    return shopStockManager.stockCount(this._item, this.indexOfSameItem());
  };

  windowClass.indexOfSameItem = function () {
    return this._indexOfSameItem ? this._indexOfSameItem : 0;
  };

  windowClass.setIndexOfSameItem = function (index) {
    this._indexOfSameItem = index;
  };
}

Window_ShopStatus_StockMixIn(Window_ShopStatus.prototype);

function Window_ShopBuy_StockMixIn(windowClass: Window_ShopBuy) {
  const _updateHelp = windowClass.updateHelp;
  windowClass.updateHelp = function (this: Window_ShopBuy) {
    if (this._statusWindow) {
      this._statusWindow.setIndexOfSameItem(this.indexOfSameItem());
    }
    _updateHelp.call(this);
  };

  /**
   * 指定したアイテムの在庫数を取得する
   * @param {RPG.BaseItem} item アイテムデータ
   * @param {number} index 在庫リストの中での順番
   * @return {number|undefined}
   */
  windowClass.stockCount = function (item: RPG.BaseItem, index: number): number|undefined {
    return shopStockManager.stockCount(item, index);
  };

  /**
   * 指定したアイテムが売り切れであるかどうか
   * @param {RPG.BaseItem} item アイテムデータ
   * @param {number} index 在庫リストの中での順番
   * @return {boolean}
   */
  windowClass.soldOut = function (item: RPG.BaseItem, index: number): boolean {
    return this.stockCount(item, index) === 0;
  };

  const _isEnabled = windowClass.isEnabled;
  windowClass.isEnabled = function (item) {
    return _isEnabled.call(this, item) &&
      !this.soldOut(item, this.indexOfSameItem());
  };

  /**
   * 売り切れ表示のため描画部分を上書きする
   */
  windowClass.drawItem = function (this: Window_ShopBuy, index) {
    this._indexForDrawing = index;
    this._isDrawing = true;
    const item = this._data[index];
    const rect = this.itemRect(index);
    const priceWidth = 96;
    rect.width -= this.textPadding();
    this.changePaintOpacity(this.isEnabled(item));
    this.drawItemName(item, rect.x, rect.y, rect.width - priceWidth);
    this.drawText(
      this.soldOut(item, this.indexOfSameItem()) ? settings.soldOutLabel : this.price(item),
      rect.x + rect.width - priceWidth,
      rect.y, 
      priceWidth, 
      'right'
    );
    this.changePaintOpacity(true);
    this._isDrawing = false;
  };

  /**
   * このショップの同一アイテムで何番目のアイテムを選択しているか
   * アイテムを選択していない場合や、存在しない場合は -1 を返す
   * 描画中は描画対象を選択しているとみなす
   * @return {number}
   */
  windowClass.indexOfSameItem = function () {
    const index = this._isDrawing ? this._indexForDrawing : this.index();
    if (this._extendedData.length <= index || index < 0) {
      return -1;
    }
    return this._extendedData[index].indexOfSameItem;
  };

  type GoodsForShopWithStock = {
    item: RPG.Item|RPG.Weapon|RPG.Armor,
    price: number,
    indexOfSameItem: number,
    soldOut: boolean,
    goodsIndex: number,
  };

  /**
   * ソート順を上書き
   */
  windowClass.makeItemList = function (this: Window_ShopBuy) {
    this._data = [];
    this._price = [];
    /**
     * 拡張データ
     */
    this._extendedData = [];
    /**
     * 同名アイテムで何番目か
     */
    const indexesOfSameItem: {[key: string]: number} = {};
    this._shopGoods.map((goods, index) => {
      let item = null;
      switch (goods[0]) {
        case 0:
          item = $dataItems[goods[1]];
          break;
        case 1:
          item = $dataWeapons[goods[1]];
          break;
        case 2:
          item = $dataArmors[goods[1]];
          break;
      }
      if (item) {
        const key = `${goods[0]}_${item.id}`;
        if (!indexesOfSameItem[key]) {
          indexesOfSameItem[key] = 0;
        }
        return {
          item: item,
          price: goods[2] === 0 ? item.price : goods[3],
          indexOfSameItem: indexesOfSameItem[key],
          soldOut: this.soldOut(item, indexesOfSameItem[key]++),
          goodsIndex: index,
        };
      } else {
        return undefined;
      }
    }, this).filter((goods): goods is GoodsForShopWithStock => !!goods).sort((a, b) => {
      /**
       * 売り切れを一番下に表示する
       */
      if (settings.soldOutItemAtBottom) {
        if (a.soldOut && !b.soldOut) return 1;
        if (!a.soldOut && b.soldOut) return -1;
      }
      /**
       * Array.prototype.sort が stable になるのは NW.js 0.34.0以降
       * RPGツクールMV1.6系は NW.js 0.29.4 のため、元々のindexで比較してやる
       */
      return a.goodsIndex - b.goodsIndex;
    }).forEach(goods => {
      this._data.push(goods.item);
      this._price.push(goods.price);
      this._extendedData.push({
        indexOfSameItem: goods.indexOfSameItem
      });
    }, this);
  };
}

Window_ShopBuy_StockMixIn(Window_ShopBuy.prototype);
