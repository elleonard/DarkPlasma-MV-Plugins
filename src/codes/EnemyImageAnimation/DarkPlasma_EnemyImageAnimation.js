import { settings } from './_build/DarkPlasma_EnemyImageAnimation_parameters';

/**
 * @param {Game_Enemy.prototype} gameEnemy
 */
function Game_Enemy_ImageAnimationMixIn(gameEnemy) {
  const _battlerName = gameEnemy.battlerName;
  gameEnemy.battlerName = function () {
    /**
     * 敵キャラのバトラー名をアニメーション画像先頭に差し替える
     */
    if (this.hasImageAnimation()) {
      return `${this.imageAnimationBaseName()}1`;
    }
    return _battlerName.call(this);
  };

  /**
   * @return {boolean}
   */
  gameEnemy.hasImageAnimation = function () {
    return !!this.enemy().meta && !!this.enemy().meta.animation && !!this.enemy().meta.baseName;
  };

  /**
   * @return {string}
   */
  gameEnemy.imageAnimationBaseName = function () {
    return this.hasImageAnimation() ? this.enemy().meta.baseName : '';
  };

  /**
   * @return {number}
   */
  gameEnemy.imageAnimationSpeed = function () {
    return this.hasImageAnimation() ? Number(this.enemy().meta.animationSpeed || settings.defaultSpeed) : 0;
  };

  /**
   * コマ送りアニメーションフレーム数
   * @return {number}
   */
  gameEnemy.imageAnimationFrame = function () {
    return this.hasImageAnimation() ? Number(this.enemy().meta.animation) : 0;
  };
}

Game_Enemy_ImageAnimationMixIn(Game_Enemy.prototype);

/**
 * @param {Sprite_Enemy.prototype} spriteEnemy
 */
function Sprite_Enemy_ImageAnimationMixIn(spriteEnemy) {
  const _initMembers = spriteEnemy.initMembers;
  spriteEnemy.initMembers = function () {
    _initMembers.call(this);
    this._imageAnimationIndex = 1;
    this._imageAnimationFrame = 0;
  };

  const _updateBitmap = spriteEnemy.updateBitmap;
  spriteEnemy.updateBitmap = function () {
    _updateBitmap.call(this);
    if (this._enemy.hasImageAnimation()) {
      if (this._imageAnimationFrame > this._enemy.imageAnimationSpeed()) {
        this._imageAnimationIndex++;
        if (this._imageAnimationIndex > this._enemy.imageAnimationFrame()) {
          this._imageAnimationIndex = 1;
        }
        this._imageAnimationFrame = 0;
      } else {
        this._imageAnimationFrame++;
      }
      this.loadBitmap(`${this._enemy.imageAnimationBaseName()}${this._imageAnimationIndex}`, this._enemy.battlerHue());
    }
  };

  const _setBattler = spriteEnemy.setBattler;
  spriteEnemy.setBattler = function (battler) {
    _setBattler.call(this, battler);
    this.loadAnimationImages();
  };

  /**
   * 対象の敵キャラがコマ送りアニメーションする場合はそれぞれのコマをキャッシュにのせておく
   */
  spriteEnemy.loadAnimationImages = function () {
    if (this._enemy.hasImageAnimation()) {
      [...Array(this._enemy.imageAnimationFrame()).keys()]
        .map((index) => `${this._enemy.imageAnimationBaseName()}${index + 1}`)
        .forEach((name) => this.loadBitmap(name, this._enemy.battlerHue()));
    }
  };
}

Sprite_Enemy_ImageAnimationMixIn(Sprite_Enemy.prototype);
