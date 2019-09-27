import {
  Entity,
  EntityKey,
  EntityType,
  MetadataStore,
  DataProperty,
  NavigationProperty
} from 'breeze-client';
import {
  IBzEntityCustomValidator,
  IEntityChangedEvent,
  EntityList,
  EntityChangedArgType,
  GetEntityProp,
  ISpQueryOptions,
  IAppFormGroup
} from './entity-extension';
import { ValidatorFn, FormGroup } from '@angular/forms';
import {
  SharepointEntity,
  BreezeEntity,
  EmServiceProviderConfig
} from 'app/core';
import { Omit } from './helper';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

export type BzEntityType = Omit<
  EntityType,
  'custom' | 'dataProperties' | 'navigationProperties'
>;

export type IBzEntity = Omit<Entity, 'entityType'>;

export interface DataProp {
  [index: string]: DataProperty;
}

export interface NavProp {
  [index: string]: NavigationProperty;
}

export interface IBzCustomEntityType extends BzEntityType {
  custom?: {
    defaultSelect?: string;
    formValidators?: {
      propVal: Map<string, ValidatorFn[]>;
      entityVal: Array<(entity: BreezeEntity) => ValidatorFn>;
    };
    /**
     * Sets up the entity type's validators for a given
     * form group's controls. Should be called only after
     * form group with all associate form controls have
     * been created.
     */
    setFormValidators(
      formGroup: IAppFormGroup<any>,
      targetEntity: BreezeEntity
    ): void;
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
    useSpBatchQuery: boolean;
    name: string;
    forceRefresh: boolean;
    getAllWithMax: number;
    spQueryOptions: ISpQueryOptions;
    _getToEntityType(
      metadataStore: MetadataStore,
      skipFromCheck: boolean
    ): EntityType;
  }
}

declare module 'breeze-client/src/data-service' {
  export interface DataService {
    odataAppEndpoint: string;
    getRequestDigest(): Promise<string>;
  }
}

declare module 'breeze-client/src/entity-manager' {
  export interface SaveContext {
    tempKeys: EntityKey[];
    originalEntities: BreezeEntity[];
    saveResult: SaveResult;
  }

  export interface SaveResult {
    entitiesWithErrors: Entity[];
  }

  export interface EntityManager {
    isSaving: BehaviorSubject<boolean>;

    onModelChanges<
      TEntityList extends EntityList,
      TEntityName extends TEntityList['shortname']
    >(
      shortName: TEntityName | TEntityName[]
    ): Observable<IEntityChangedEvent<TEntityList, TEntityName, any>>;

    onModelChanges<
      TEntityList extends EntityList,
      TEntityName extends TEntityList['shortname'],
      TEntityAction extends EntityChangedArgType<
        TEntityName,
        any
      >['entityAction']
    >(
      shortName: TEntityName | TEntityName[],
      etAction: 'EntityState'
    ): Observable<IEntityChangedEvent<TEntityList, TEntityName, TEntityAction>>;

    onModelChanges<
      TEntityList extends EntityList,
      TEntityName extends TEntityList['shortname'],
      TEntityAction extends EntityChangedArgType<
        TEntityName,
        any
      >['entityAction'],
      TEntityProp extends GetEntityProp<TEntityName>
    >(
      shortName: TEntityName | TEntityName[],
      etAction: 'PropertyChange',
      property: TEntityProp | TEntityProp[]
    ): Observable<IEntityChangedEvent<TEntityList, TEntityName, TEntityAction>>;

    onModelChanges<
      TEntityList extends EntityList,
      TEntityName extends TEntityList['shortname'],
      TEntityAction extends EntityChangedArgType<
        TEntityName,
        any
      >['entityAction'],
      TEntityProp extends GetEntityProp<TEntityName>
    >(
      shortName: TEntityName,
      etAction?: TEntityAction,
      property?: TEntityProp | TEntityProp[]
    ): Observable<
      IEntityChangedEvent<TEntityList, TEntityName, TEntityAction, TEntityProp>
    >;
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
    originalEntities: BreezeEntity[];
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
