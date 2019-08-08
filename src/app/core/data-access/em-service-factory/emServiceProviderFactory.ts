import {
  EntityManager,
  DataService,
  NamingConvention,
  MetadataStore,
  EntityAction
} from 'breeze-client';
import '../breeze-providers/sharepoint-dataservice';
import { EmServiceProviderConfig } from './emServiceProviderConfig.service';
import { CustomNameConventionService } from '../breeze-providers/custom-name-convention.service';
import { Injectable } from '@angular/core';
import { DataAccessModule } from '../data-access.module';
import {
  IBreezeScaffoldProto,
  EntityList,
  EntityChangedArgType,
  GetEntityProp,
  IEntityChangedEvent,
  IEntityPropertyChange
} from '@app_types';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SharepointMetadata, BreezeEntity } from 'app/core/data-models';

// List of models that are used across feature setsl
const GlobalModel = [SharepointMetadata];

@Injectable({ providedIn: DataAccessModule })
export class EmServiceProviderFactory {
  private metaStore: MetadataStore;
  private repoStore = {};

  constructor(private nameDictService: CustomNameConventionService) {
    this.initEmServiceProvider();
  }

  initEmServiceProvider(): void {
    const nameDictionaryService = this.nameDictService;

    const namingDictionary = {};

    nameDictionaryService
      .createNameDictionary(
        'spNameCov',
        NamingConvention.camelCase,
        namingDictionary
      )
      .setAsDefault();

    this.metaStore = new MetadataStore();

    GlobalModel.forEach((bzEntityScaffold: any) => {
      (bzEntityScaffold.prototype as IBreezeScaffoldProto).spBzEntity.createTypeForStore(
        this.metaStore,
        this.nameDictService,
        'Global'
      );
    });
  }

  createManager(mgrCfg: EmServiceProviderConfig): EntityManager {
    const dataService = new DataService({
      serviceName: mgrCfg.serviceEndpoint,
      hasServerMetadata: false,
      adapterName: mgrCfg.adapterName
    });

    const em = new EntityManager({
      dataService,
      metadataStore: this.metaStore
    });

    const bzEntities = mgrCfg.featureEntities;

    bzEntities.forEach((bzEntityScaffold: any) => {
      (bzEntityScaffold.prototype as IBreezeScaffoldProto).spBzEntity.createTypeForStore(
        this.metaStore,
        this.nameDictService,
        mgrCfg.nameSpace
      );
    });

    em.onModelChanges = this.watchModelChanges(em);
    return em;
  }

  private watchModelChanges(em: EntityManager): any {
    const onEntityChanges = new Subject();
    em.entityChanged.subscribe(changedArgs => {
      changedArgs.shortName = changedArgs.entity.shortname;

      switch (changedArgs.entityAction as EntityAction) {
        case EntityAction.PropertyChange:
          changedArgs.entityAction = 'PropertyChange';
          break;
        case EntityAction.EntityStateChange:
          changedArgs.entityAction = 'EntityState';
          break;
      }

      onEntityChanges.next(changedArgs);
    });
    return <
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
    > => {
      const shortNameArrayed = Array.isArray(shortName)
        ? shortName
        : [shortName];
      const propertyArrayed =
        property && Array.isArray(property) ? property : [property];

      const ecObserverable = onEntityChanges.pipe(
        filter(
          (
            chngArgs: IEntityChangedEvent<
              TEntityList,
              TEntityName,
              TEntityAction,
              any
            >
          ) => shortNameArrayed.includes(chngArgs.shortName)
        )
      );

      if (etAction) {
        ecObserverable.pipe(
          filter(
            (
              chngArgs: IEntityChangedEvent<
                TEntityList,
                TEntityName,
                TEntityAction,
                TEntityProp
              >
            ) => chngArgs.entityAction === etAction
          )
        );
      }

      if (property) {
        ecObserverable.pipe(
          filter(
            (
              chngArgs: IEntityChangedEvent<
                TEntityList,
                TEntityName,
                TEntityAction,
                TEntityProp
              >
            ) =>
              propertyArrayed.includes(
                (chngArgs.args as IEntityPropertyChange<
                  TEntityName,
                  TEntityProp
                >).propertyName
              )
          )
        );
      }

      return ecObserverable;
    };
  }
}
