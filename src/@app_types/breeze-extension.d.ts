import {
  Entity,
  EntityKey,
  EntityType,
  MetadataStore,
  DataProperty,
  NavigationProperty
} from 'breeze-client';
import { ISpQueryOptions } from 'app/core/data-access/breeze-sp-uribuilder';
import { ISpEntityCustomValidator } from './entity-extension';
import { ValidatorFn } from '@angular/forms';
import { SharepointEntity } from 'app/core';
import { Omit } from './helper';

export type SpEntityType = Omit<
  EntityType,
  'custom' | 'dataProperties' | 'navigationProperties'
>;

export interface DataProp {
  [index: string]: DataProperty;
}

export interface NavProp {
  [index: string]: NavigationProperty;
}

export interface ISpEntityType extends SpEntityType {
  custom?: {
    defaultSelect?: string;
    formValidators?: {
      propVal: Map<string, ValidatorFn[]>;
      entityVal: Array<(entity: SharepointEntity) => ValidatorFn>;
    };
  };
  dataProperties?: DataProp;
  navigationProperties?: NavProp;
}

export interface SpEntityDef extends Partial<EntityType> {
  isComplexType?: boolean;
}

/**
 * Extending breeze with custom properties
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 *
 */
declare module 'breeze-client/src/entity-query' {
  export interface EntityQuery {
    useSpEntityQuery: boolean;
    canBeBatched: boolean;
    getAllWithMax: number;
    spQueryOptions: ISpQueryOptions;
    _getToEntityType(
      metadataStore: MetadataStore,
      skipFromCheck: boolean
    ): EntityType;
  }
}

declare module 'breeze-client/src/entity-metadata' {
  interface EntityType {
    custom?: Object;
    _mappedPropertiesCount: number;
  }
  // export interface HttpResponse {
  //     saveContext: SaveContext;
  // }
}

declare module 'breeze-client/src/entity-manager' {
  export interface SaveContext {
    tempKeys: EntityKey[];
    originalEntities: Entity[];
    saveResult: SaveResult;
  }

  export interface SaveResult {
    entitiesWithErrors: Entity[];
  }

  /**
   * For use by breeze plugin authors only. The class is for use in building a [[IDataServiceAdapter]] implementation.
   * @adapter (see [[IDataServiceAdapter]])
   * @hidden @internal
   */
  export interface EntityErrorFromServer {
    entityTypeName: string;
    keyValues: any[];

    errorName: string;
    errorMessage: string;
    propertyName: string;
  }

  /**
   * Shape of a save error returned from the server.
   * For use by breeze plugin authors only. The class is for use in building a [[IDataServiceAdapter]] implementation.
   * @adapter (see [[IDataServiceAdapter]])
   * @hidden @internal
   */
  export interface SaveErrorFromServer extends ServerError {
    entityErrors: EntityErrorFromServer[];
  }
}
