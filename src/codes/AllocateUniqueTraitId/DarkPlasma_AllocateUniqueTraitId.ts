/// <reference path="./AllocateUniqueTraitId.d.ts" />

import { settings } from "./_build/DarkPlasma_AllocateUniqueTraitId_parameters";

let uniqueTraitId = settings.startIdOfUniqueTraitId;

class UniqueTraitIdCache {
  _cache: {
    [key: string]: UniqueTraitId;
  } = {};

  _cacheById: {
    [id: number]: UniqueTraitId;
  } = {};

  allocate(pluginName: string, localId: number, name: string): UniqueTraitId {
    const key = this.key(pluginName, localId);
    if (!this._cache[key]) {
      this._cache[key] = new UniqueTraitId(uniqueTraitId, name);
      this._cacheById[uniqueTraitId] = this._cache[key];
      uniqueTraitId++;
    }
    return this._cache[key];
  }

  key(pluginName: string, localId: number): string {
    return `${pluginName}_${localId}`;
  }

  traitIdOf(pluginName: string, localId: number): number|undefined {
    const key = this.key(pluginName, localId);
    return this._cache[key]?.id;
  }

  nameOf(pluginName: string, localId: number): string|undefined {
    const key = this.key(pluginName, localId);
    return this._cache[key]?.name;
  }

  nameByTraitId(id: number): string|undefined {
    return this._cacheById[id]?.name;
  }
}

const uniqueTraitIdCache = new UniqueTraitIdCache();

window.uniqueTraitIdCache = uniqueTraitIdCache;

class UniqueTraitId {
  _id: number;
  _name: string;

  constructor(id: number, name: string) {
    this._id = id;
    this._name = name;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }
}
