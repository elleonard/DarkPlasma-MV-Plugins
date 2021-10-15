import { settings } from './_build/DarkPlasma_ConcurrentParty_parameters';

/**
 * 分割パーティ情報全体
 */
class Game_DevidedParties {
  constructor() {
    /**
     * @type {Game_DevidedParty[]}
     */
    this._parties = [];
    this._index = 0;
    this._isStarted = false;
  }

  get length() {
    return this._parties.length;
  }

  get index() {
    return this._index;
  }

  get isStarted() {
    return this._isStarted;
  }

  initialize() {
    if (!this.isStarted) {
      this._parties = [];
      this._index = 0;
    }
  }

  start() {
    if (this.length > 0 && !this.isStarted) {
      this._isStarted = true;
      this.transferToParty(this.index);
    }
  }

  joinAllParties() {
    this._isStarted = false;
    this.initialize();
    $gamePlayer.refresh();
  }

  /**
   * 分割パーティを生成する
   * @param {Game_Actor[]} members 分割パーティに所属させるアクター一覧
   */
  createParty(members) {
    const actualMembers = members.filter(actor => !this.isAlreadyInParty(actor));
    if (actualMembers.length === 0) {
      return;
    }
    const newParty = new Game_DevidedParty();
    actualMembers.forEach(actor => newParty.addMember(actor));
    this._parties.push(newParty);
  }

  /**
   * @return {boolean}
   */
  isPartyChangable() {
    return this.length > 1 &&
      (settings.disableChangeSwitchId === 0 || !$gameSwitches.value(settings.disableChangeSwitchId));
  }

  /**
   * 次のパーティに交代する
   * @param {number} fadeType
   */
  changeToNextParty(fadeType) {
    if (this.isPartyChangable()) {
      this.changeParty((this.index + 1) % this.length, fadeType);
    }
  }

  /**
   * 前のパーティに交代する
   * @param {number} fadeType
   */
  changeToPreviousParty(fadeType) {
    if (this.isPartyChangable()) {
      this.changeParty((this.index - 1 + this.length) % this.length, fadeType);
    }
  }

  /**
   * パーティを交代する
   * @param {number} index 交代先パーティインデックス
   * @param {number} fadeType フェードタイプ
   */
  changeParty(index, fadeType) {
    if (!this.isStarted) {
      return;
    }
    this.savePartyPosition(this.index);
    this._index = index;
    this.transferToParty(index, fadeType);
  }

  transferToParty(index, fadeType) {
    const position = this.getParty(index).position;
    if (position) {
      position.transfer(fadeType);
    }
  }

  /**
   * パーティの現在位置を記録する
   * @param {number} index パーティインデックス
   */
  savePartyPosition(index) {
    this.getParty(index).setPosition(
      $gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()
    );
  }

  /**
   * 指定したアクターがすでに分割パーティに所属している
   * @param {Game_Actor} actor アクター
   * @return {boolean}
   */
  isAlreadyInParty(actor) {
    return this._parties.some(party => party.findMemberIndexByActorId(actor.actorId()) >= 0);
  }

  /**
   * @param {number} index パーティインデックス
   * @return {Game_DevidedParty|null}
   */
  getParty(index) {
    if (index >= this.length) {
      return null;
    }
    return this._parties[index];
  }

  /**
   * @return {Game_DevidedParty[]}
   */
  allParties() {
    return this._parties;
  }

  /**
   * 現在のパーティを返す
   * @param {Game_DevidedParty|null}
   */
  getCurrentParty() {
    if (this.isStarted) {
      return this._parties[this.index];
    }
    return null;
  }

  /**
   * 指定したインデックスのパーティのリーダーを取得する
   * @param {number} index パーティインデックス
   * @return {Game_Actor|null}
   */
  getPartyLeader(index) {
    const party = this.getParty(index);
    if (party) {
      return party.leader();
    }
    return null;
  }

  /**
   * @return {Game_DevidedParty|null}
   */
  lastParty() {
    if (this.length === 0) {
      return null;
    }
    return this._parties[this.length - 1];
  }

  /**
   * 全てのパーティ枠が埋まっているかどうか
   * @return {boolean}
   */
  isAllPartyFullMember() {
    return !this._parties.some((party) => !party.isFullMember());
  }

  /**
   * 空のパーティが存在しない
   * @return {boolean}
   */
  noEmptyParty() {
    return !this._parties.some((party) => party.isEmpty());
  }
}

window[Game_DevidedParties.name] = Game_DevidedParties;

class Game_DevidedPartyPosition {
  constructor(mapId, x, y, direction) {
    this._mapId = mapId;
    this._x = x;
    this._y = y;
    this._direction = direction;
  }

  get mapId() {
    return this._mapId;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get direction() {
    return this._direction;
  }

  transfer(fadeType) {
    $gamePlayer.reserveTransfer(this._mapId, this._x, this._y, this._direction, fadeType || 0);
  }
}

window[Game_DevidedPartyPosition.name] = Game_DevidedPartyPosition;

/**
 * 分割されたパーティ個別の情報
 */
class Game_DevidedParty {
  constructor() {
    this._members = [];
    this._position = null;
  }

  /**
   * パーティにメンバーを追加する
   * @param {Game_Actor} actor アクター
   */
  addMember(actor) {
    this._members.push(new Game_DevidedPartyMember(actor));
  }

  get position() {
    return this._position;
  }

  setPosition(mapId, x, y, direction) {
    this._position = new Game_DevidedPartyPosition(mapId, x, y, direction);
  }

  /**
   * 指定したインデックスのメンバーのアクターを取得する
   * @param {number} index インデックス
   * @return {Game_Actor}
   */
  actor(index) {
    return this._members[index].actor;
  }

  /**
   * @return {Game_Actor}
   */
  leader() {
    return this.actor(0);
  }

  /**
   * アクターIDからメンバーの位置を取得する
   * 存在しない場合は-1を返す
   * @param {number} actorId アクターID
   * @return {Game_DevidedPartyMember}
   */
  findMemberIndexByActorId(actorId) {
    return this._members.findIndex((member) => member.actor && member.actor.actorId() === actorId);
  }

  /**
   * 指定したインデックスのメンバーを入れ替える
   * @param {number} actorId1 インデックス1
   * @param {number} actorId2 インデックス2
   */
  swapOrder(actorId1, actorId2) {
    const member1Index = this.findMemberIndexByActorId(actorId1);
    const member2Index = this.findMemberIndexByActorId(actorId2);
    const member1 = this._members[member1Index];
    this._members[member1Index] = this._members[member2Index];
    this._members[member2Index] = member1;
    $gamePlayer.refresh();
  }

  allMembers() {
    return this._members;
  }

  /**
   * @return {Game_Actor[]}
   */
  allActors() {
    return this._members.map((member) => member.actor);
  }

  /**
   * パーティの枠が全部埋まっているかどうか
   * @return {boolean}
   */
  isFullMember() {
    return !this._members.some((member) => !member.actor);
  }

  /**
   * パーティが空であるかどうか
   * @return {boolean}
   */
  isEmpty() {
    return !this._members.some((member) => !!member.actor);
  }
}

window[Game_DevidedParty.name] = Game_DevidedParty;

/**
 * 分割されたパーティのメンバー情報
 */
class Game_DevidedPartyMember {
  /**
   * @param {Game_Actor} actor アクター
   */
  constructor(actor) {
    this._actorId = actor ? actor.actorId() : -1;
  }

  /**
   * @return {Game_DevidedPartyMember}
   */
  static empty() {
    return new Game_DevidedPartyMember(null, true);
  }

  /**
   * @return {Game_Actor|null}
   */
  get actor() {
    return this._actorId < 0 ? null : $gameActors.actor(this._actorId);
  }
}

window[Game_DevidedPartyMember.name] = Game_DevidedPartyMember;

/**
 * @param {Game_Party.prototype} gameParty
 */
function Game_Party_ConcurrentPartyMixIn(gameParty) {
  const _initialize = gameParty.initialize;
  gameParty.initialize = function () {
    _initialize.call(this);
    this._devidedParties = new Game_DevidedParties();
  };

  gameParty.devidedParties = function () {
    if (!this._devidedParties) {
      this._devidedParties = new Game_DevidedParties();
    }
    return this._devidedParties;
  };

  /**
   * 分割パーティを生成する
   * @param {Game_Actor[]} members 分割パーティに所属させるメンバー一覧
   */
  gameParty.createDevidedParty = function (members) {
    this.devidedParties().createParty(members);
  };

  /**
   * 指定したパーティのリーダーを返す
   * @param {number} partyIndex パーティインデックス
   * @return {Game_Actor|null}
   */
  gameParty.devidedPartyLeader = function (partyIndex) {
    return this.devidedParties().getPartyLeader(partyIndex);
  };

  /**
   * 分割パーティの位置を設定する
   * @param {number} partyIndex 対象パーティインデックス。-1で最後のパーティ
   * @param {number} mapId マップID
   * @param {number} x X座標
   * @param {number} y Y座標
   * @param {number} direction 向き
   */
  gameParty.setDevidedPartyPosition = function (partyIndex, mapId, x, y, direction) {
    const targetParty = partyIndex >= 0 ? this.devidedParties().getParty(partyIndex) : this.devidedParties().lastParty();
    if (targetParty) {
      targetParty.setPosition(mapId, x, y, direction)
    }
  };

  /**
   * 分割パーティの位置を取得する
   * @param {number} partyIndex 対象パーティインデックス。-1で最後のパーティ
   * @return {Game_DevidedPartyPosition}
   */
  gameParty.devidedPartyPosition = function (partyIndex) {
    const targetParty = partyIndex >= 0 ? this.devidedParties().getParty(partyIndex) : this.devidedParties().lastParty();
    return targetParty ? targetParty.position : null;
  };

  gameParty.startDevidePartyMode = function () {
    this.devidedParties().start();
  };

  gameParty.resetDevidedParty = function () {
    this.devidedParties().initialize();
  };

  /**
   * 分割パーティモードであるかどうか
   * @return {boolean}
   */
  gameParty.isDevided = function () {
    return this.devidedParties().isStarted;
  };

  gameParty.changeToNextParty = function (fadeType) {
    this.devidedParties().changeToNextParty(fadeType);
  };

  gameParty.changeToPreviousParty = function (fadeType) {
    this.devidedParties().changeToPreviousParty(fadeType);
  };

  gameParty.joinAllDevidedParties = function () {
    this.devidedParties().joinAllParties();
  };

  const _allMembers = gameParty.allMembers
  gameParty.allMembers = function () {
    return this.isDevided()
      ? this.devidedParties()
        .getCurrentParty()
        .allActors()
        .filter((actor) => !!actor)
      : _allMembers.call(this);
  };

  const _swapOrder = gameParty.swapOrder
  gameParty.swapOrder = function (index1, index2) {
    if (this.isDevided()) {
      const allMembers = this.allMembers();
      this.devidedParties()
        .getCurrentParty()
        .swapOrder(allMembers[index1].actorId(), allMembers[index2].actorId());
    } else {
      _swapOrder.call(this, index1, index2);
    }
  };
}

Game_Party_ConcurrentPartyMixIn(Game_Party.prototype);

const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
  _Game_Interpreter_pluginCommand.call(this, command, args);
  switch (command) {
    case 'createParty':
      if (!$gameParty.isDevided()) {
        const members = args
          .map(name => $gameParty.members().find(actor => actor.name() === name))
          .filter(actor => actor);
        $gameParty.createDevidedParty(members);
      }
      break;
    case 'resetParty':
      $gameParty.resetDevidedParty();
      break;
    case 'startConcurrentParty':
      $gameParty.startDevidePartyMode();
      break;
    case 'setPartyPosition':
      $gameParty.setDevidedPartyPosition(-1, Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]));
      break;
    case 'moveParty':
      if ($gameParty.isDevided()) {
        $gameParty.setDevidedPartyPosition(Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4] || 0));
      }
      break;
    case 'changeToNextParty':
      $gameParty.changeToNextParty(Number(args[0] || 0));
      break;
    case 'changeToPreviousParty':
      $gameParty.changeToPreviousParty(Number(args[0] || 0));
      break;
    case 'joinAllMember':
      $gameParty.joinAllDevidedParties();
      break;
  }
};

const _Scene_Map_update_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function () {
  _Scene_Map_update_update.call(this);
  if (!SceneManager.isSceneChanging()) {
    this.updateCallChangeParty();
  }
};

Scene_Map.prototype.updateCallChangeParty = function () {
  if (!$gamePlayer.isMoving() && !$gameMap.isEventRunning()) {
    if (this.isChangePartyCalled()) {
      $gameParty.changeToNextParty();
    } else if (this.isChangePreviousPartyCalled()) {
      $gameParty.changeToPreviousParty();
    }
  }
};

Scene_Map.prototype.isChangePartyCalled = function () {
  return Input.isTriggered(settings.changePartyButton);
};

Scene_Map.prototype.isChangePreviousPartyCalled = function () {
  return Input.isTriggered(settings.changePreviousPartyButton);
};

