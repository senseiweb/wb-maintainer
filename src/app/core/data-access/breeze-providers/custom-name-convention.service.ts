import { Injectable } from '@angular/core';
import { DataProperty, EntityType, NamingConvention } from 'breeze-client';
import { CoreModule } from '../../core.module';

export interface ICustomClientDict {
  [index: string]: { [index: string]: string };
}

//#region Copyright, Version, and Description
/*
 *
 * NamingConventionWithDictionary plugin to the breeze.NamingConvention class
 *
 * Adds a NamingConvention that extends another NamingConvention
 * by attempting first to translate specific Entity property names using a dictionary.
 * If a property name is not found in the dictionary,
 * it falls back to the base NamingConvention (AKA "sourceNamingConvention").
 *
 * Copyright 2015 IdeaBlade, Inc.  All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the IdeaBlade Breeze license, available at http://www.breezejs.com/license
 *
 * Author: Ward Bell
 * Version: 0.1.0 - original
 *
 * Load this script after breeze
 *
 * Usage:
 *    var convention =
 *      new breeze.NamingConvention.NamingConventionWithDictionary(...)
 *
 */
//#endregion
@Injectable({ providedIn: CoreModule })
export class CustomNameConventionService {
  private clientToServerDictionary: ICustomClientDict;
  private serverToClientDictionary: { [index: string]: EntityType };
  private sourceConvention: NamingConvention;

  constructor() {
    // console.log('Naming Convention loaded');
  }

  createNameDictionary(
    name: string,
    sourceConv: NamingConvention,
    clientToServerDict: ICustomClientDict
  ): NamingConvention {
    if (!(sourceConv instanceof NamingConvention)) {
      throw new Error('must be a instance of a Naming Convention');
    }
    if (!name) {
      throw new Error('must be a non empty string');
    }
    this.clientToServerDictionary = clientToServerDict;
    this.sourceConvention = sourceConv;
    this.serverToClientDictionary = this.makeServerToClientDictionary();

    // tslint:disable-next-line: no-this-assignment
    const that = this;
    return new NamingConvention({
      name,
      clientPropertyNameToServer: (
        namer: string,
        propDef: DataProperty
      ): string => {
        if (
          propDef &&
          propDef.parentType &&
          propDef.parentType.name === '__metadata:#Global'
        ) {
          return namer;
        }
        const typeName =
          propDef && propDef.parentType && propDef.parentType.name;
        const props = that.clientToServerDictionary[typeName || undefined];
        const newName = props && props[namer];
        return (
          newName ||
          that.sourceConvention.clientPropertyNameToServer(namer, propDef)
        );
      },
      serverPropertyNameToClient: (
        namer: string,
        propDef: DataProperty
      ): string => {
        if (
          propDef &&
          propDef.parentType &&
          propDef.name === '__metadata:#Global'
        ) {
          return namer;
        }
        const typeName =
          propDef && propDef.parentType && propDef.parentType.name;
        const props = that.serverToClientDictionary[typeName || undefined];
        const newName = props && props[namer];
        return (
          newName ||
          that.sourceConvention.serverPropertyNameToClient(namer, propDef)
        );
      }
    });
  }

  updateDictionary(dict: ICustomClientDict): void {
    const newDictKeys = Object.keys(dict);
    for (const key of newDictKeys) {
      this.clientToServerDictionary[key] = dict[key];
    }
    this.serverToClientDictionary = this.makeServerToClientDictionary();
  }

  // makes new dictionary based on clientToServerDifctionary
  // that reverses each EntityType's {clientPropName: serverPropName} KV pairs
  makeServerToClientDictionary(): { [index: string]: EntityType } {
    const dict = {};
    for (const typename of Object.keys(this.clientToServerDictionary)) {
      const newType = {};
      const type = this.clientToServerDictionary[typename];
      for (const prop of Object.keys(type)) {
        newType[type[prop]] = prop; // reverse KV pair
      }
      dict[typename] = newType;
    }
    return dict;
  }
}
