// DarkPlasma_ShopStock 3.0.0
// Copyright (c) 2023 DarkPlasma
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/**
 * 2023/07/05 3.0.0 パラメータ名を変更
 *                  個別の自動補充設定を廃止
 *                  自動補充数設定を廃止
 *                  補充用プラグインコマンドを追加
 * 2020/05/19 2.2.2 DarkPlasma_ShopBuyByCategory.js と併用するとエラーになる不具合を修正
 *            2.2.1 売り切れ商品が購入できる不具合を修正
 *                  ニューゲーム開始時に前回の在庫数を引き継ぐ不具合を修正
 * 2020/05/05 2.2.0 売り切れ商品を末尾に表示するか選択する設定を追加
 *                  商品の順番が環境によって元と変化してしまう不具合を修正
 * 2020/04/23 2.1.0 同一リスト内で同一アイテムIDに対して異なる在庫数を設定可能
 *                  アイテム売却時に在庫に追加する設定項目を追加
 * 2020/04/21 2.0.3 デフォルト在庫リストIDが有効でなかった不具合を修正
 *                  add english help
 * 2020/04/13 2.0.1 セーブデータをロードした時にエラーになる不具合を修正
 * 2020/04/11 2.0.0 大規模リファクタ/機能追加。1.0.0からのセーブデータ互換性なし
 *                  戦闘回数や経過時間による在庫補充機能追加
 * 2019/09/23 1.0.0 公開
 */

/*:en
 * @plugindesc Shop with stock
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @orderAfter DarkPlasma_AnotherPriceInSameShop
 *
 * @param stockIdVariable
 * @desc use stock with ID setting by this variable.
 * @text Variable for stock ID
 * @type variable
 * @default 0
 *
 * @param stockNumberLabel
 * @desc label for stock count
 * @text stock count label
 * @type string
 * @default stock
 *
 * @param soldOutLabel
 * @desc label for sold out
 * @text sold out label
 * @type string
 * @default sold out
 *
 * @param shopStock
 * @desc shop stock setting
 * @text shop stock setting
 * @type struct<ShopStockEn>[]
 * @default []
 *
 * @param addStockWhenSellItem
 * @desc add stock when sell the item without over default stock count.
 * @text add stock when sell
 * @type boolean
 * @default false
 *
 * @param soldOutItemAtBottom
 * @desc Display sold item at bottom of shop
 * @text sold out item at bottom
 * @type boolean
 * @default true
 *
 * @help
 * version: 3.0.0
 * You can set shop item stock.
 * Default stock ID is 1.
 * If you don't set stock count of item,
 * the item stock is infinite.
 *
 * With this plugin, RMMV savedata includes stock data.
 *
 * When open shop scene after satisfying condition for auto supply,
 * supplied stock upto default stock count.
 *
 * You can supply stock count by using plugin command "forceSupply".
 *
 * You can set different stock count between same item id in same stock setting.
 * e.g.) One potion is 30 stocked, another is 10.
 * If you set stock count in this order and set multi same items to shop goods,
 * shop display them in the same order.
 * (Stock count of potion displayed upper is 30, lower is 10.)
 * Please note that if you set "add stock when sell" is true,
 * and sell item that is multi displayed in shop,
 * the only top item of the same id is supplied.
 *
 * If you set different price between same item id in the same shop,
 * please consider that you use this plugin with DarkPlasma_AnotherPriceInSameShop.js.
 *
 * 本プラグインを下記プラグインと共に利用する場合、それよりも下に追加してください。
 * DarkPlasma_AnotherPriceInSameShop
 */
/*~struct~ShopStockEn:
 * @param id
 * @text stock list ID
 * @type number
 * @default 1
 *
 * @param stockItemList
 * @text stock item list
 * @type struct<StockItemEn>[]
 * @default []
 *
 * @param stockWeaponList
 * @text stock weapon list
 * @type struct<StockWeaponEn>[]
 * @default []
 *
 * @param stockArmorList
 * @text stock armor list
 * @type struct<StockArmorEn>[]
 * @default []
 *
 * @param autoSupplyType
 * @desc condition for auto supplying
 * @text auto supply condition
 * @type select
 * @option no supplying
 * @value 0
 * @option battle count
 * @value 1
 * @option play time
 * @value 2
 * @default 0
 *
 * @param autoSupplyFrequency
 * @desc auto supply frequency (battle count or play time(sec))
 * @text auto supply frequency
 * @type number
 * @default 5
 */
/*~struct~StockItemEn:
 * @param id
 * @text Item
 * @type item
 * @default 0
 *
 * @param count
 * @text default stock count
 * @type number
 * @default 1
 */
/*~struct~StockWeaponEn:
 * @param id
 * @text Weapon
 * @type weapon
 * @default 0
 *
 * @param count
 * @text default stock count
 * @type number
 * @default 1
 */
/*~struct~StockArmorEn:
 * @param id
 * @text Armor
 * @type armor
 * @default 0
 *
 * @param count
 * @text default stock count
 * @type number
 * @default 1
 */
/*:
 * @plugindesc 在庫ありショップ
 * @author DarkPlasma
 * @license MIT
 *
 * @target MV
 * @url https://github.com/elleonard/DarkPlasma-MV-Plugins/tree/release
 *
 * @orderAfter DarkPlasma_AnotherPriceInSameShop
 *
 * @param stockIdVariable
 * @desc ここで指定された変数と一致する在庫リストIDを使用します。
 * @text 在庫リストID変数
 * @type variable
 * @default 0
 *
 * @param stockNumberLabel
 * @desc 在庫数の表記を設定します。
 * @text 在庫数表記
 * @type string
 * @default 在庫数
 *
 * @param soldOutLabel
 * @desc 売り切れの表記を設定します。
 * @text 売り切れ表記
 * @type string
 * @default 売り切れ
 *
 * @param shopStock
 * @desc ショップの初期在庫を設定します。
 * @text ショップ在庫
 * @type struct<ShopStock>[]
 * @default []
 *
 * @param addStockWhenSellItem
 * @desc ONの場合、売却時にそのアイテムの在庫を追加します。ただし初期在庫を超えません。
 * @text 売却時在庫追加
 * @type boolean
 * @default false
 *
 * @param soldOutItemAtBottom
 * @desc ONの場合、売り切れ商品をショップの一番下に表示します。
 * @text 売り切れを後ろに
 * @type boolean
 * @default true
 *
 * @help
 * version: 3.0.0
 * このプラグインはショップに初期在庫を設定できます。
 * 在庫リストID:1のリストをデフォルトの在庫リストとして扱います。
 * 在庫リストで指定されなかったアイテムの在庫は無限です。
 *
 * 在庫はセーブデータに記録されます。
 *
 * 在庫の自動補充について:
 * 自動補充の条件（一定回数戦闘する、一定時間経過する）を満たした場合、
 * 次にショップを開いたタイミングで在庫を初期在庫数まで補充します。
 *
 * プラグインコマンド forceSupply によって、
 * 現在の在庫リストを強制的に補充できます。
 * プラグインコマンドには以下の引数の設定が可能です。
 * kind=(item|weapon|armor)
 * id=(アイテムID)
 * index=(同一アイテム内のインデックス)
 *
 * 例:
 * forceSupply
 * 現在の在庫リストにある、在庫ありのアイテムすべての在庫を
 * 初期値まで回復します。
 *
 * forceSupply kind=weapon id=1
 * 現在の在庫リストにある、ID=1の武器のうち
 * 先頭の武器の在庫を初期値まで回復します。
 *
 * forceSupply kind=item id=2 index=1
 * 現在の在庫リストにある、ID=2のアイテムのうち
 * 2番目のアイテムの在庫を初期値まで回復します。
 * （ID=2の在庫が複数登録されている場合のみ有効です）
 *
 * 同じ在庫リストの中で、同一アイテムに対して異なる在庫数を設定できます。
 * 例えば、片方のポーションは在庫30あるが、もう片方は10しかない、等。
 * 在庫リストの中で設定した順番が上記の通りである場合、
 * ショップ内の順番も同様です。
 * （上に設定したポーションの在庫が30、
 * 　下に設定したポーションの在庫が10になります）
 * 売却時の在庫追加は同一アイテムのうち、
 * 一番上のアイテムにしか効かないのでご注意ください。
 *
 * 同一ショップ内の同一アイテムに別価格を設定したい場合、
 * DarkPlasma_AnotherPriceInSameShop.js との併用をご検討ください。
 *
 * 本プラグインを下記プラグインと共に利用する場合、それよりも下に追加してください。
 * DarkPlasma_AnotherPriceInSameShop
 */
/*~struct~ShopStock:
 * @param id
 * @text 在庫リストID
 * @type number
 * @default 1
 *
 * @param stockItemList
 * @text 在庫アイテムリスト
 * @type struct<StockItem>[]
 * @default []
 *
 * @param stockWeaponList
 * @text 在庫武器リスト
 * @type struct<StockWeapon>[]
 * @default []
 *
 * @param stockArmorList
 * @text 在庫防具リスト
 * @type struct<StockArmor>[]
 * @default []
 *
 * @param autoSupplyType
 * @desc 在庫を自動で補充する条件を設定します。
 * @text 自動在庫補充条件
 * @type select
 * @option 補充なし
 * @value 0
 * @option 戦闘回数
 * @value 1
 * @option 時間経過
 * @value 2
 * @default 0
 *
 * @param autoSupplyFrequency
 * @desc 自動補充の頻度を設定します。自動補充タイミング設定に従い、指定数の戦闘回数や秒数が経過した際に補充します。
 * @text 自動補充間隔
 * @type number
 * @default 5
 */
/*~struct~StockItem:
 * @param id
 * @text アイテム
 * @type item
 * @default 0
 *
 * @param count
 * @text 初期在庫数
 * @type number
 * @default 1
 */
/*~struct~StockWeapon:
 * @param id
 * @text 武器
 * @type weapon
 * @default 0
 *
 * @param count
 * @text 初期在庫数
 * @type number
 * @default 1
 */
/*~struct~StockArmor:
 * @param id
 * @text 防具
 * @type armor
 * @default 0
 *
 * @param count
 * @text 初期在庫数
 * @type number
 * @default 1
 */
(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  const settings = {
    stockIdVariable: Number(pluginParameters.stockIdVariable || 0),
    stockNumberLabel: String(pluginParameters.stockNumberLabel || '在庫数'),
    soldOutLabel: String(pluginParameters.soldOutLabel || '売り切れ'),
    shopStock: JSON.parse(pluginParameters.shopStock || '[]').map((e) => {
      return ((parameter) => {
        const parsed = JSON.parse(parameter);
        return {
          id: Number(parsed.id || 1),
          stockItemList: JSON.parse(parsed.stockItemList || '[]').map((e) => {
            return ((parameter) => {
              const parsed = JSON.parse(parameter);
              return {
                id: Number(parsed.id || 0),
                count: Number(parsed.count || 1),
              };
            })(e || '{}');
          }),
          stockWeaponList: JSON.parse(parsed.stockWeaponList || '[]').map((e) => {
            return ((parameter) => {
              const parsed = JSON.parse(parameter);
              return {
                id: Number(parsed.id || 0),
                count: Number(parsed.count || 1),
              };
            })(e || '{}');
          }),
          stockArmorList: JSON.parse(parsed.stockArmorList || '[]').map((e) => {
            return ((parameter) => {
              const parsed = JSON.parse(parameter);
              return {
                id: Number(parsed.id || 0),
                count: Number(parsed.count || 1),
              };
            })(e || '{}');
          }),
          autoSupplyType: Number(parsed.autoSupplyType || 0),
          autoSupplyFrequency: Number(parsed.autoSupplyFrequency || 5),
        };
      })(e || '{}');
    }),
    addStockWhenSellItem: String(pluginParameters.addStockWhenSellItem || false) === 'true',
    soldOutItemAtBottom: String(pluginParameters.soldOutItemAtBottom || true) === 'true',
  };

  const SUPPLY_TYPE = {
    NONE: 0,
    BATTLE_COUNT: 1,
    PLAY_TIME: 2,
  };
  const ITEM_KIND = {
    ITEM: 1,
    WEAPON: 2,
    ARMOR: 3,
  };
  const DEFAULT_STOCK_ID = 1;
  class ShopStockManager {
    constructor() {
      this.initialize();
    }
    initialize() {
      /**
       * @type {ShopStock[]}
       */
      this._shopStock = settings.shopStock.map((stockSetting) => ShopStock.fromSetting(stockSetting));
    }
    /**
     * 現在の在庫リストIDに記録されている在庫数を返す
     * 在庫リストIDが指定されていない、または在庫リストの中にアイテムが存在しない場合nullを返す
     * @param {RPG.BaseItem} item アイテムデータ
     * @param {number} index リスト中のアイテム番号
     * @return {number|undefined} 現在の在庫数
     */
    stockCount(item, index) {
      var _a;
      return (_a = this.currentShopStock()) === null || _a === void 0 ? void 0 : _a.stockCount(item, index);
    }
    /**
     * 指定したIDの在庫リストを返す
     * 存在しない場合はundefinedを返す
     * @param {number} stockId 在庫リストID
     * @return {ShopStock|undefined}
     */
    shopStock(stockId) {
      return this._shopStock.find((stock) => stock.id === stockId);
    }
    /**
     * 現在の在庫リストを返す
     * 現在の在庫リストIDが指し示す在庫リストが存在しない場合、undefinedを返す
     * @return {ShopStock|undefined}
     */
    currentShopStock() {
      const currentStockId = $gameVariables.value(settings.stockIdVariable) || DEFAULT_STOCK_ID;
      return this._shopStock.find((stock) => stock.id === currentStockId);
    }
    /**
     * 現在の在庫リストの在庫を補充する
     */
    autoSupplyCurrentShopStock() {
      const shopStock = this.currentShopStock();
      if (shopStock) {
        shopStock.autoSupply();
      }
    }
    forceSupplyCurrentShopStock(item, index) {
      var _a;
      (_a = this.currentShopStock()) === null || _a === void 0 ? void 0 : _a.forceSupply(item, index);
    }
    /**
     * 現在の在庫リストにおいて、指定したアイテムの在庫数を増やす
     * @param {RPG.BaseItem} item アイテムデータ
     * @param {number} index リスト中のアイテム番号
     * @param {number} count 在庫を増やす数
     */
    increaseCurrentStockCount(item, index, count) {
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
    decreaseCurrentStockCount(item, index, count) {
      const shopStock = this.currentShopStock();
      if (shopStock) {
        shopStock.decreaseStockCount(item, index, count);
      }
    }
    /**
     * セーブデータから在庫数を更新する
     * @param {Game_ShopStock[]} stockSaveData セーブデータ形式の在庫データ
     */
    updateCountBySaveData(stockSaveData) {
      stockSaveData.forEach((saveData) => {
        const shopStock = this._shopStock.find((stock) => saveData.id === stock.id);
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
    toSaveData() {
      return this._shopStock.map((stock) => stock.toSaveData());
    }
  }
  /**
   * 在庫リスト
   */
  class ShopStock {
    constructor(id, stockItems) {
      this._id = id;
      this._stockItems = stockItems;
    }
    static fromSetting(setting) {
      return new ShopStock(
        setting.id,
        setting.stockItemList
          .map((stockItem) => {
            return StockItem.fromSetting(
              stockItem,
              ITEM_KIND.ITEM,
              setting.autoSupplyType,
              setting.autoSupplyFrequency
            );
          })
          .concat(
            setting.stockWeaponList.map((stockWeapon) => {
              return StockItem.fromSetting(
                stockWeapon,
                ITEM_KIND.WEAPON,
                setting.autoSupplyType,
                setting.autoSupplyFrequency
              );
            })
          )
          .concat(
            setting.stockArmorList.map((stockArmor) => {
              return StockItem.fromSetting(
                stockArmor,
                ITEM_KIND.ARMOR,
                setting.autoSupplyType,
                setting.autoSupplyFrequency
              );
            })
          )
      );
    }
    get id() {
      return this._id;
    }
    updateCountBySaveData(stockItemSaveData) {
      const indexes = {};
      stockItemSaveData.forEach((savedItem) => {
        const items = this._stockItems.filter((item) => item.kind === savedItem.kind && item.id === savedItem.id);
        if (!indexes[savedItem.id]) {
          indexes[savedItem.id] = 0;
        }
        const item = items[indexes[savedItem.id]++];
        if (item) {
          item.setCount(savedItem.count);
          if (item.autoSupplyType !== savedItem.supplyType) {
            // 補充形式設定が変更されていたらリセットする
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
    autoSupply() {
      this._stockItems.forEach((stock) => stock.autoSupply());
    }
    forceSupply(item, index) {
      var _a;
      if (item) {
        (_a = this.getStockItem(item, index || 0)) === null || _a === void 0 ? void 0 : _a.forceSupply();
      } else {
        this._stockItems.forEach((stock) => stock.forceSupply());
      }
    }
    /**
     * 指定したアイテムの在庫情報を取得する
     * @param {RPG.BaseItem} item アイテムデータ
     * @param {number} index リスト中のアイテム番号
     * @return {StockItem|null}
     */
    getStockItem(item, index) {
      let result = [];
      if (DataManager.isItem(item)) {
        result = this._stockItems.filter((stockItem) => stockItem.kind === ITEM_KIND.ITEM && stockItem.id === item.id);
      } else if (DataManager.isWeapon(item)) {
        result = this._stockItems.filter(
          (stockItem) => stockItem.kind === ITEM_KIND.WEAPON && stockItem.id === item.id
        );
      } else if (DataManager.isArmor(item)) {
        result = this._stockItems.filter((stockItem) => stockItem.kind === ITEM_KIND.ARMOR && stockItem.id === item.id);
      }
      return result.length > index ? result[index] : null;
    }
    /**
     * @param {RPG.BaseItem} item アイテムデータ
     * @param {number} index リスト中のアイテム番号
     * @return {number|undefined} 在庫数
     */
    stockCount(item, index) {
      var _a;
      return (_a = this.getStockItem(item, index)) === null || _a === void 0 ? void 0 : _a.count;
    }
    /**
     * 指定したアイテムの在庫数を増やす
     * @param {RPG.BaseItem} item アイテムデータ
     * @param {number} index リスト中のアイテム番号
     * @param {number} count 在庫を増やす数
     */
    increaseStockCount(item, index, count) {
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
    decreaseStockCount(item, index, count) {
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
    toSaveData() {
      return {
        id: this._id,
        stockItems: this._stockItems.map((stockItem) => stockItem.toSaveData()),
      };
    }
  }
  class StockItem {
    constructor(kind, id, initialCount, supplyType, supplyFrequency) {
      this._kind = kind;
      this._id = id;
      this._initialCount = initialCount;
      this._count = initialCount;
      this._autoSupplyType = supplyType;
      this._autoSupplyFrequency = supplyFrequency;
      this._nextAutoSupplyCount = 0;
    }
    static fromSetting(setting, kind, autoSupplyType, autoSupplyFrequency) {
      return new StockItem(kind, setting.id, setting.count, autoSupplyType, autoSupplyFrequency);
    }
    toSaveData() {
      return {
        kind: this._kind,
        id: this._id,
        count: this._count,
        supplyType: this._autoSupplyType,
        counterForSupply: this._nextAutoSupplyCount,
      };
    }
    get data() {
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
    get kind() {
      return this._kind;
    }
    get id() {
      return this._id;
    }
    get count() {
      return this._count;
    }
    get autoSupplyType() {
      return this._autoSupplyType;
    }
    /**
     * 在庫を増やす
     */
    increaseCount(count) {
      this.setCount(this.count + count);
    }
    /**
     * 在庫を減らす
     */
    decreaseCount(count) {
      this.setCount(this.count - count);
    }
    /**
     * 在庫数を設定する
     */
    setCount(count) {
      this._count = count;
      if (this._count > this.maxCount()) {
        this._count = this.maxCount();
      } else if (this._count < 0) {
        this._count = 0;
      }
    }
    mustBeAutoSupply() {
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
    autoSupply() {
      if (this.mustBeAutoSupply()) {
        this.setCount(this.maxCount());
      }
    }
    forceSupply() {
      this.setCount(this.maxCount());
    }
    /**
     * セーブデータロード用
     */
    setNextAutoSupplyCount(counter) {
      this._nextAutoSupplyCount = counter;
    }
    /**
     * 補充用カウンターをリセットする
     */
    resetNextAutoSupplyCount() {
      switch (this._autoSupplyType) {
        case SUPPLY_TYPE.BATTLE_COUNT:
          this._nextAutoSupplyCount = $gameSystem.battleCount() + this._autoSupplyFrequency;
          break;
        case SUPPLY_TYPE.PLAY_TIME:
          this._nextAutoSupplyCount = $gameSystem.playtime() + this._autoSupplyFrequency;
          break;
      }
    }
    maxCount() {
      // 将来的に最大数を別に設定できるようにしても良い
      return this._initialCount;
    }
  }
  const shopStockManager = new ShopStockManager();
  function Game_System_ShopStockMixIn(gameSystem) {
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
  function parseParameter(name, args) {
    var _a;
    const a = (_a = args.find((arg) => arg.startsWith(`${name}=`))) === null || _a === void 0 ? void 0 : _a.split('=');
    return a && a.length > 0 ? a[1] : undefined;
  }
  function parseNumberParameter(name, args) {
    const p = parseParameter(name, args);
    return p ? Number(p) : undefined;
  }
  function Game_Interpreter_ShopStockMixIn(gameInterpreter) {
    const _pluginCommand = gameInterpreter.pluginCommand;
    gameInterpreter.pluginCommand = function (command, args) {
      _pluginCommand.call(this, command, args);
      if (command === 'forceSupply') {
        const kind = parseParameter('kind', args);
        const itemId = parseNumberParameter('id', args);
        const index = parseNumberParameter('index', args);
        const item = (() => {
          if (!kind || !itemId) {
            return undefined;
          }
          switch (kind) {
            case 'item':
              return $dataItems[itemId];
            case 'weapon':
              return $dataWeapons[itemId];
            case 'armor':
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
  function Scene_Shop_StockMixIn(sceneShop) {
    const _create = sceneShop.create;
    sceneShop.create = function () {
      _create.call(this);
      // ショップを開いたタイミングで補充する
      shopStockManager.autoSupplyCurrentShopStock();
    };
    const _doBuy = sceneShop.doBuy;
    sceneShop.doBuy = function (number) {
      _doBuy.call(this, number);
      shopStockManager.decreaseCurrentStockCount(this._item, this._buyWindow.indexOfSameItem(), number);
    };
    const _doSell = sceneShop.doSell;
    sceneShop.doSell = function (number) {
      _doSell.call(this, number);
      if (settings.addStockWhenSellItem) {
        shopStockManager.increaseCurrentStockCount(this._item, 0, number);
      }
    };
    const _maxBuy = sceneShop.maxBuy;
    sceneShop.maxBuy = function () {
      const currentStock = shopStockManager.stockCount(this._item, this._buyWindow.indexOfSameItem()) || 0;
      return currentStock > 0 ? Math.min(currentStock, _maxBuy.call(this)) : _maxBuy.call(this);
    };
  }
  Scene_Shop_StockMixIn(Scene_Shop.prototype);
  function Window_ShopStatus_StockMixIn(windowClass) {
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
      this.drawText(this.stockCount(), x, y, width, 'right');
    };
    windowClass.stockCount = function () {
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
  function Window_ShopBuy_StockMixIn(windowClass) {
    const _updateHelp = windowClass.updateHelp;
    windowClass.updateHelp = function () {
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
    windowClass.stockCount = function (item, index) {
      return shopStockManager.stockCount(item, index);
    };
    /**
     * 指定したアイテムが売り切れであるかどうか
     * @param {RPG.BaseItem} item アイテムデータ
     * @param {number} index 在庫リストの中での順番
     * @return {boolean}
     */
    windowClass.soldOut = function (item, index) {
      return this.stockCount(item, index) === 0;
    };
    const _isEnabled = windowClass.isEnabled;
    windowClass.isEnabled = function (item) {
      return _isEnabled.call(this, item) && !this.soldOut(item, this.indexOfSameItem());
    };
    /**
     * 売り切れ表示のため描画部分を上書きする
     */
    windowClass.drawItem = function (index) {
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
    /**
     * ソート順を上書き
     */
    windowClass.makeItemList = function () {
      this._data = [];
      this._price = [];
      /**
       * 拡張データ
       */
      this._extendedData = [];
      /**
       * 同名アイテムで何番目か
       */
      const indexesOfSameItem = {};
      this._shopGoods
        .map((goods, index) => {
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
        }, this)
        .filter((goods) => !!goods)
        .sort((a, b) => {
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
        })
        .forEach((goods) => {
          this._data.push(goods.item);
          this._price.push(goods.price);
          this._extendedData.push({
            indexOfSameItem: goods.indexOfSameItem,
          });
        }, this);
    };
  }
  Window_ShopBuy_StockMixIn(Window_ShopBuy.prototype);
})();
